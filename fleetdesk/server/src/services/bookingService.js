const { getDb } = require('../../db/connection');

class BookingService {
    /**
     * Checks if a vehicle has any conflicting reservation or maintenance in the specified date range.
     * Overlap condition: requestedStart < existingEnd AND requestedEnd > existingStart
     */
    static checkVehicleAvailability(vehicleId, pickupDatetime, returnDatetime, excludeBookingId = null) {
        const db = getDb();

        const pickup = new Date(pickupDatetime).toISOString();
        const returnDate = new Date(returnDatetime).toISOString();

        if (new Date(returnDatetime) <= new Date(pickupDatetime)) {
            return { available: false, reason: 'Return date/time must be strictly after pickup date/time.' };
        }

        // 1. Check vehicle existence and operational status
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
        if (!vehicle) {
            return { available: false, reason: 'Vehicle not found.' };
        }
        if (vehicle.operational_status === 'DEACTIVATED') {
            return { available: false, reason: 'Vehicle has been deactivated from service.' };
        }

        // 2. Check conflicting active reservations (PENDING, CONFIRMED, ACTIVE, OVERDUE)
        let query = `
            SELECT id, booking_reference, pickup_datetime, expected_return_datetime, status
            FROM bookings
            WHERE vehicle_id = ?
              AND status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'OVERDUE')
              AND ? < expected_return_datetime
              AND ? > pickup_datetime
        `;
        const params = [vehicleId, pickup, returnDate];

        if (excludeBookingId) {
            query += ' AND id != ?';
            params.push(excludeBookingId);
        }

        const conflict = db.prepare(query).get(...params);
        if (conflict) {
            return {
                available: false,
                reason: `Conflict with reservation ${conflict.booking_reference} (${conflict.pickup_datetime} to ${conflict.expected_return_datetime}).`,
                conflictBooking: conflict
            };
        }

        // 3. Check conflicting maintenance records (SCHEDULED, IN_PROGRESS)
        const maintQuery = `
            SELECT id, service_type, start_date, completion_date, next_service_due, status
            FROM maintenance_records
            WHERE vehicle_id = ?
              AND status IN ('SCHEDULED', 'IN_PROGRESS')
              AND ? < COALESCE(completion_date, next_service_due, '2099-12-31')
              AND ? > start_date
        `;
        const maintConflict = db.prepare(maintQuery).get(vehicleId, pickup.slice(0, 10), returnDate.slice(0, 10));
        if (maintConflict) {
            return {
                available: false,
                reason: `Vehicle has scheduled maintenance (${maintConflict.service_type}) during this interval.`,
                conflictMaintenance: maintConflict
            };
        }

        return { available: true, vehicle };
    }

    /**
     * Creates a new booking with interval conflict validation and licence expiry check
     */
    static createBooking({ customerId, vehicleId, pickupDatetime, expectedReturnDatetime, discountCode, currentUser }) {
        const db = getDb();

        // Validate date order
        const pickupDate = new Date(pickupDatetime);
        const returnDate = new Date(expectedReturnDatetime);
        if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime()) || returnDate <= pickupDate) {
            throw new Error('Invalid rental duration: return date/time must be strictly after pickup date/time.');
        }

        // Validate customer
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
        if (!customer) {
            throw new Error('Customer account not found.');
        }
        if (customer.account_status !== 'ACTIVE') {
            throw new Error(`Customer account is currently ${customer.account_status}.`);
        }

        // Validate driving licence expiry
        const licenceExpiry = new Date(customer.licence_expiry_date);
        if (licenceExpiry < returnDate) {
            throw new Error(`Customer driving licence expires on ${customer.licence_expiry_date}, which is before the rental return date.`);
        }

        // Role-based customer ownership check
        if (currentUser && currentUser.role === 'CUSTOMER' && currentUser.customerId !== Number(customerId)) {
            throw new Error('Unauthorized: You cannot book on behalf of another customer.');
        }

        // Execute in transaction for concurrency safety
        db.exec('BEGIN TRANSACTION');
        try {
            // Re-validate availability inside transaction
            const availability = this.checkVehicleAvailability(vehicleId, pickupDatetime, expectedReturnDatetime);
            if (!availability.available) {
                throw new Error(availability.reason);
            }

            const vehicle = availability.vehicle;
            const agreedDailyRate = vehicle.daily_rental_rate;

            // Generate booking reference
            const year = new Date().getFullYear();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const bookingRef = `BK-${year}-${randomSuffix}`;

            // Insert booking
            const insertBooking = db.prepare(`
                INSERT INTO bookings (
                    booking_reference, customer_id, vehicle_id, pickup_datetime, expected_return_datetime,
                    status, agreed_daily_rate
                ) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)
            `);

            const bookingResult = insertBooking.run(
                bookingRef, customerId, vehicleId,
                pickupDate.toISOString().replace('T', ' ').slice(0, 19),
                returnDate.toISOString().replace('T', ' ').slice(0, 19),
                agreedDailyRate
            );
            const bookingId = bookingResult.lastInsertRowid;

            // Compute billing duration and generate initial invoice
            const hours = Math.abs(returnDate - pickupDate) / 36e5;
            const billableDays = Math.max(1, Math.ceil(hours / 24));
            const rentalCharge = Number((billableDays * agreedDailyRate).toFixed(2));

            // Check discount if provided
            let discountAmount = 0.00;
            if (discountCode) {
                const discount = db.prepare('SELECT * FROM discounts WHERE code = ? AND is_active = 1').get(discountCode.trim());
                if (discount && billableDays >= discount.min_rental_days) {
                    if (discount.discount_type === 'PERCENTAGE') {
                        discountAmount = Number(((rentalCharge * discount.value) / 100).toFixed(2));
                    } else if (discount.discount_type === 'FIXED') {
                        discountAmount = Math.min(rentalCharge, Number(discount.value));
                    }
                }
            }

            const totalAmount = Math.max(0, Number((rentalCharge - discountAmount).toFixed(2)));
            const invNumber = `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

            const insertInvoice = db.prepare(`
                INSERT INTO invoices (
                    invoice_number, booking_id, billable_days, rental_charge, discount_amount,
                    extra_charges, late_days, late_fee, total_amount, paid_amount,
                    refunded_amount, outstanding_balance, payment_status, notes
                ) VALUES (?, ?, ?, ?, ?, 0.00, 0, 0.00, ?, 0.00, 0.00, ?, 'UNPAID', ?)
            `);

            insertInvoice.run(
                invNumber, bookingId, billableDays, rentalCharge, discountAmount,
                totalAmount, totalAmount, `Reservation invoice generated for booking ${bookingRef}.`
            );

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'BOOKING_CREATED', 'BOOKING', ?, ?)
                `).run(currentUser.id, bookingId.toString(), `Booking created with reference ${bookingRef} for vehicle ID ${vehicleId}`);
            }

            db.exec('COMMIT');

            return {
                bookingId,
                bookingReference: bookingRef,
                agreedDailyRate,
                billableDays,
                totalAmount,
                invoiceNumber: invNumber
            };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }

    /**
     * Cancels an eligible booking (must be in PENDING or CONFIRMED status)
     */
    static cancelBooking(bookingId, reason, currentUser) {
        const db = getDb();
        const booking = db.prepare(`
            SELECT b.*, c.user_id as customer_user_id
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?
        `).get(bookingId);

        if (!booking) {
            throw new Error('Booking not found.');
        }

        // Customer permission check
        if (currentUser && currentUser.role === 'CUSTOMER' && booking.customer_user_id !== currentUser.id) {
            throw new Error('Unauthorized: You cannot cancel another customer’s booking.');
        }

        if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
            throw new Error(`Cannot cancel booking in status '${booking.status}'. Only PENDING or CONFIRMED bookings may be cancelled.`);
        }

        db.exec('BEGIN TRANSACTION');
        try {
            db.prepare(`
                UPDATE bookings
                SET status = 'CANCELLED',
                    cancellation_reason = ?,
                    cancelled_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(reason || 'Cancelled by user', bookingId);

            // Cancel associated unpaid invoice if any
            db.prepare(`
                UPDATE invoices
                SET payment_status = 'CANCELLED',
                    notes = notes || ' [Booking cancelled]'
                WHERE booking_id = ? AND paid_amount = 0.00
            `).run(bookingId);

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'BOOKING_CANCELLED', 'BOOKING', ?, ?)
                `).run(currentUser.id, bookingId.toString(), `Reason: ${reason || 'N/A'}`);
            }

            db.exec('COMMIT');
            return { success: true, message: 'Booking successfully cancelled.' };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }

    /**
     * Checks for overdue bookings and updates their status
     */
    static updateOverdueStatus() {
        const db = getDb();
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        // Find active bookings past expected return time
        const overdueBookings = db.prepare(`
            SELECT b.id, b.booking_reference, b.vehicle_id
            FROM bookings b
            WHERE b.status = 'ACTIVE'
              AND b.expected_return_datetime < ?
        `).all(now);

        for (const b of overdueBookings) {
            db.prepare(`UPDATE bookings SET status = 'OVERDUE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(b.id);
        }

        return overdueBookings.length;
    }
}

module.exports = BookingService;
