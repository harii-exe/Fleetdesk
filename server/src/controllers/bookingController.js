const { getDb } = require('../../db/connection');
const BookingService = require('../services/bookingService');
const BillingService = require('../services/billingService');

class BookingController {
    static async checkAvailability(req, res) {
        const { vehicleId, pickupDatetime, expectedReturnDatetime, excludeBookingId } = req.body;

        if (!vehicleId || !pickupDatetime || !expectedReturnDatetime) {
            return res.status(400).json({ success: false, error: 'Vehicle ID, pickup date/time, and return date/time are required.' });
        }

        const result = BookingService.checkVehicleAvailability(
            parseInt(vehicleId),
            pickupDatetime,
            expectedReturnDatetime,
            excludeBookingId ? parseInt(excludeBookingId) : null
        );

        res.json({
            success: true,
            available: result.available,
            reason: result.reason || (result.available ? 'Vehicle is available for the selected dates.' : 'Vehicle unavailable.'),
            vehicle: result.vehicle || null
        });
    }

    static async getAll(req, res) {
        const db = getDb();
        const { status, vehicleId, customerId } = req.query;

        // Auto update overdue bookings
        BookingService.updateOverdueStatus();

        let query = `
            SELECT
                b.*,
                c.full_name as customer_name, c.phone as customer_phone, c.driving_licence_number,
                v.brand, v.model, v.registration_number, v.category, v.image_url,
                i.id as invoice_id, i.invoice_number, i.total_amount, i.paid_amount, i.outstanding_balance, i.payment_status
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN vehicles v ON b.vehicle_id = v.id
            LEFT JOIN invoices i ON b.id = i.booking_id
            WHERE 1=1
        `;
        const params = [];

        // Role-based customer filtering
        if (req.user && req.user.role === 'CUSTOMER') {
            query += ' AND b.customer_id = ?';
            params.push(req.user.customerId);
        } else if (customerId) {
            query += ' AND b.customer_id = ?';
            params.push(parseInt(customerId));
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (vehicleId) {
            query += ' AND b.vehicle_id = ?';
            params.push(parseInt(vehicleId));
        }

        query += ' ORDER BY b.pickup_datetime DESC';
        const bookings = db.prepare(query).all(...params);

        res.json({ success: true, data: bookings });
    }

    static async getById(req, res) {
        const id = req.params.id;
        const db = getDb();

        const booking = db.prepare(`
            SELECT
                b.*,
                c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address,
                c.driving_licence_number, c.licence_expiry_date, c.user_id as customer_user_id,
                v.brand, v.model, v.registration_number, v.category, v.fuel_type, v.seating_capacity,
                v.transmission, v.image_url, v.odometer_reading as current_vehicle_odometer,
                i.id as invoice_id, i.invoice_number, i.billable_days, i.rental_charge, i.discount_amount,
                i.extra_charges, i.late_days, i.late_fee, i.total_amount, i.paid_amount, i.refunded_amount,
                i.outstanding_balance, i.payment_status, i.notes as invoice_notes
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN vehicles v ON b.vehicle_id = v.id
            LEFT JOIN invoices i ON b.id = i.booking_id
            WHERE b.id = ?
        `).get(id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Ownership restriction for customer
        if (req.user && req.user.role === 'CUSTOMER' && booking.customer_user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Access denied: You do not own this booking.' });
        }

        // Fetch payments for this invoice
        let payments = [];
        if (booking.invoice_id) {
            payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC').all(booking.invoice_id);
        }

        res.json({
            success: true,
            data: {
                ...booking,
                payments
            }
        });
    }

    static async create(req, res) {
        try {
            const { customerId, vehicleId, pickupDatetime, expectedReturnDatetime, discountCode } = req.body;

            // Determine customer ID
            let targetCustomerId = customerId;
            if (req.user && req.user.role === 'CUSTOMER') {
                targetCustomerId = req.user.customerId;
            }

            if (!targetCustomerId || !vehicleId || !pickupDatetime || !expectedReturnDatetime) {
                return res.status(400).json({ success: false, error: 'Missing required reservation fields.' });
            }

            const result = BookingService.createBooking({
                customerId: parseInt(targetCustomerId),
                vehicleId: parseInt(vehicleId),
                pickupDatetime,
                expectedReturnDatetime,
                discountCode,
                currentUser: req.user
            });

            res.status(201).json({
                success: true,
                message: 'Reservation created successfully.',
                data: result
            });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async confirm(req, res) {
        const id = req.params.id;
        const db = getDb();
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        if (booking.status !== 'PENDING') {
            return res.status(400).json({ success: false, error: `Only PENDING bookings can be confirmed. Current status: ${booking.status}` });
        }

        // Revalidate availability at confirmation time!
        const availability = BookingService.checkVehicleAvailability(booking.vehicle_id, booking.pickup_datetime, booking.expected_return_datetime, booking.id);
        if (!availability.available) {
            return res.status(409).json({ success: false, error: 'Cannot confirm: ' + availability.reason });
        }

        db.prepare("UPDATE bookings SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'BOOKING_CONFIRMED', 'BOOKING', ?, 'Booking confirmed by staff')
        `).run(req.user.id, id.toString());

        res.json({ success: true, message: 'Booking confirmed successfully.' });
    }

    static async cancel(req, res) {
        try {
            const id = req.params.id;
            const { reason } = req.body;
            const result = BookingService.cancelBooking(id, reason, req.user);
            res.json(result);
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async handover(req, res) {
        try {
            const id = req.params.id;
            const { startOdometer, startFuelLevel, handoverNotes } = req.body;

            if (startOdometer === undefined || startOdometer === null || startOdometer < 0) {
                return res.status(400).json({ success: false, error: 'Starting odometer reading is required and must be non-negative.' });
            }

            const result = BillingService.processHandover({
                bookingId: parseInt(id),
                startOdometer: parseInt(startOdometer),
                startFuelLevel,
                handoverNotes,
                currentUser: req.user
            });

            res.json(result);
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async returnVehicle(req, res) {
        try {
            const id = req.params.id;
            const { endOdometer, endFuelLevel, returnNotes, damageCharges, markMaintenance } = req.body;

            if (endOdometer === undefined || endOdometer === null || endOdometer < 0) {
                return res.status(400).json({ success: false, error: 'Final odometer reading is required.' });
            }

            const result = BillingService.processReturn({
                bookingId: parseInt(id),
                endOdometer: parseInt(endOdometer),
                endFuelLevel,
                returnNotes,
                damageCharges: parseFloat(damageCharges) || 0,
                markMaintenance: Boolean(markMaintenance),
                currentUser: req.user
            });

            res.json(result);
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}

module.exports = BookingController;
