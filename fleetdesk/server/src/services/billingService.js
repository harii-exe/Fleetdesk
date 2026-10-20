const { getDb } = require('../../db/connection');

class BillingService {
    /**
     * Gets configured penalty multiplier from system_settings
     */
    static getPenaltyMultiplier() {
        const db = getDb();
        const setting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('penalty_multiplier');
        return setting ? parseFloat(setting.value) : 1.5;
    }

    /**
     * Calculates billable days from two timestamps (ceiling of 24-hr blocks, min 1)
     */
    static calculateBillableDays(startDatetime, endDatetime) {
        const start = new Date(startDatetime);
        const end = new Date(endDatetime);
        const hours = Math.max(0, (end.getTime() - start.getTime()) / 36e5);
        return Math.max(1, Math.ceil(hours / 24));
    }

    /**
     * Calculates late days and late fee based on expected vs actual return
     * Late days = Math.ceil(hours overdue / 24)
     * Late fee = late days * agreed daily rate * penalty multiplier
     */
    static calculateLateFee(expectedReturnDatetime, actualReturnDatetime, agreedDailyRate, multiplier = null) {
        const penaltyMultiplier = multiplier !== null ? multiplier : this.getPenaltyMultiplier();
        const expected = new Date(expectedReturnDatetime);
        const actual = new Date(actualReturnDatetime);

        if (actual <= expected) {
            return { hoursOverdue: 0, lateDays: 0, lateFee: 0.00 };
        }

        const hoursOverdue = (actual.getTime() - expected.getTime()) / 36e5;
        const lateDays = Math.ceil(hoursOverdue / 24);
        const lateFee = Number((lateDays * agreedDailyRate * penaltyMultiplier).toFixed(2));

        return { hoursOverdue, lateDays, lateFee };
    }

    /**
     * Performs vehicle handover (Staff action)
     */
    static processHandover({ bookingId, startOdometer, startFuelLevel, handoverNotes, currentUser }) {
        const db = getDb();
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

        if (!booking) {
            throw new Error('Booking not found.');
        }

        if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
            throw new Error(`Cannot handover booking with status '${booking.status}'. Must be PENDING or CONFIRMED.`);
        }

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        db.exec('BEGIN TRANSACTION');
        try {
            // Update booking
            db.prepare(`
                UPDATE bookings
                SET status = 'ACTIVE',
                    actual_pickup_datetime = ?,
                    start_odometer = ?,
                    start_fuel_level = ?,
                    handover_notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(now, startOdometer, startFuelLevel || '100%', handoverNotes || 'Handover completed.', bookingId);

            // Update vehicle status to RENTED
            db.prepare(`
                UPDATE vehicles
                SET operational_status = 'RENTED',
                    odometer_reading = MAX(odometer_reading, ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(startOdometer, booking.vehicle_id);

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'VEHICLE_HANDOVER', 'BOOKING', ?, ?)
                `).run(currentUser.id, bookingId.toString(), `Handed over vehicle ID ${booking.vehicle_id} with odometer ${startOdometer}`);
            }

            db.exec('COMMIT');
            return { success: true, message: 'Vehicle successfully handed over.' };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }

    /**
     * Performs vehicle return, updates invoice with actual duration, damage fees, late penalties
     */
    static processReturn({ bookingId, endOdometer, endFuelLevel, returnNotes, damageCharges = 0, markMaintenance = false, currentUser }) {
        const db = getDb();
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

        if (!booking) {
            throw new Error('Booking not found.');
        }

        if (booking.status !== 'ACTIVE' && booking.status !== 'OVERDUE') {
            throw new Error(`Cannot process return for booking in '${booking.status}' status. Only ACTIVE or OVERDUE bookings may be returned.`);
        }

        const actualReturnTime = new Date();
        const actualReturnIso = actualReturnTime.toISOString().replace('T', ' ').slice(0, 19);
        const pickupTime = booking.actual_pickup_datetime || booking.pickup_datetime;

        // Calculate billable days & late fee
        const billableDays = this.calculateBillableDays(pickupTime, actualReturnIso);
        const agreedRate = Number(booking.agreed_daily_rate);
        const rentalCharge = Number((billableDays * agreedRate).toFixed(2));

        const penaltyMultiplier = this.getPenaltyMultiplier();
        const { lateDays, lateFee } = this.calculateLateFee(
            booking.expected_return_datetime,
            actualReturnIso,
            agreedRate,
            penaltyMultiplier
        );

        const extraCharges = Number(damageCharges) || 0.00;

        db.exec('BEGIN TRANSACTION');
        try {
            // Find existing invoice
            const invoice = db.prepare('SELECT * FROM invoices WHERE booking_id = ?').get(bookingId);
            if (!invoice) {
                throw new Error('Invoice not found for this booking.');
            }

            const discount = Number(invoice.discount_amount);
            const totalAmount = Math.max(0, Number((rentalCharge - discount + extraCharges + lateFee).toFixed(2)));
            const paid = Number(invoice.paid_amount);
            const refunded = Number(invoice.refunded_amount);
            const outstanding = Math.max(0, Number((totalAmount - paid + refunded).toFixed(2)));

            let paymentStatus = invoice.payment_status;
            if (outstanding <= 0.00) {
                paymentStatus = 'PAID';
            } else if (paid > 0.00) {
                paymentStatus = 'PARTIALLY_PAID';
            } else {
                paymentStatus = 'UNPAID';
            }

            // Update invoice
            db.prepare(`
                UPDATE invoices
                SET billable_days = ?,
                    rental_charge = ?,
                    extra_charges = ?,
                    late_days = ?,
                    late_fee = ?,
                    total_amount = ?,
                    outstanding_balance = ?,
                    payment_status = ?,
                    notes = COALESCE(notes, '') || ' [Final return reconciled]',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(billableDays, rentalCharge, extraCharges, lateDays, lateFee, totalAmount, outstanding, paymentStatus, invoice.id);

            // Update booking status to COMPLETED
            db.prepare(`
                UPDATE bookings
                SET status = 'COMPLETED',
                    actual_return_datetime = ?,
                    end_odometer = ?,
                    end_fuel_level = ?,
                    return_notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(actualReturnIso, endOdometer, endFuelLevel || '100%', returnNotes || 'Vehicle returned.', bookingId);

            // Update vehicle status
            // Check if there are other active maintenance records
            const otherActiveMaint = db.prepare(`
                SELECT id FROM maintenance_records
                WHERE vehicle_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS')
            `).get(booking.vehicle_id);

            const nextVehicleStatus = (markMaintenance || extraCharges > 0 || otherActiveMaint) ? 'MAINTENANCE' : 'AVAILABLE';

            db.prepare(`
                UPDATE vehicles
                SET operational_status = ?,
                    odometer_reading = MAX(odometer_reading, ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(nextVehicleStatus, endOdometer, booking.vehicle_id);

            // If markMaintenance, create a maintenance record
            if (markMaintenance || extraCharges > 500) {
                db.prepare(`
                    INSERT INTO maintenance_records (vehicle_id, service_type, description, cost, start_date, status, technician_notes)
                    VALUES (?, 'Post-Rental Inspection / Repair', ?, ?, ?, 'IN_PROGRESS', ?)
                `).run(
                    booking.vehicle_id,
                    `Post-rental condition check: ${returnNotes || 'Maintenance flagged on vehicle return'}`,
                    extraCharges,
                    actualReturnIso.slice(0, 10),
                    'Vehicle routed to service bay upon customer checkout.'
                );
            }

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'VEHICLE_RETURNED', 'BOOKING', ?, ?)
                `).run(currentUser.id, bookingId.toString(), `Processed return for vehicle ID ${booking.vehicle_id}. Total: ₹${totalAmount}, Late Fee: ₹${lateFee}`);
            }

            db.exec('COMMIT');

            return {
                success: true,
                billableDays,
                rentalCharge,
                lateDays,
                lateFee,
                extraCharges,
                totalAmount,
                outstanding,
                paymentStatus,
                nextVehicleStatus
            };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }
}

module.exports = BillingService;
