const { getDb } = require('../../db/connection');
const PaymentService = require('../services/paymentService');

class BillingController {
    static async getAllInvoices(req, res) {
        const db = getDb();
        const { status, bookingId } = req.query;

        let query = `
            SELECT
                i.*,
                b.booking_reference, b.pickup_datetime, b.expected_return_datetime, b.agreed_daily_rate,
                c.id as customer_id, c.full_name as customer_name, c.phone as customer_phone,
                v.brand as vehicle_brand, v.model as vehicle_model, v.registration_number
            FROM invoices i
            JOIN bookings b ON i.booking_id = b.id
            JOIN customers c ON b.customer_id = c.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        // Role restriction
        if (req.user && req.user.role === 'CUSTOMER') {
            query += ' AND c.id = ?';
            params.push(req.user.customerId);
        }

        if (status) {
            query += ' AND i.payment_status = ?';
            params.push(status);
        }

        if (bookingId) {
            query += ' AND i.booking_id = ?';
            params.push(parseInt(bookingId));
        }

        query += ' ORDER BY i.issued_at DESC';
        const invoices = db.prepare(query).all(...params);

        res.json({ success: true, data: invoices });
    }

    static async getInvoiceById(req, res) {
        const id = req.params.id;
        const db = getDb();

        const invoice = db.prepare(`
            SELECT
                i.*,
                b.booking_reference, b.pickup_datetime, b.expected_return_datetime,
                b.actual_pickup_datetime, b.actual_return_datetime, b.agreed_daily_rate, b.status as booking_status,
                c.id as customer_id, c.full_name as customer_name, c.phone as customer_phone,
                c.address as customer_address, c.driving_licence_number, c.user_id as customer_user_id,
                v.brand as vehicle_brand, v.model as vehicle_model, v.registration_number, v.category
            FROM invoices i
            JOIN bookings b ON i.booking_id = b.id
            JOIN customers c ON b.customer_id = c.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE i.id = ?
        `).get(id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found.' });
        }

        // Ownership restriction
        if (req.user && req.user.role === 'CUSTOMER' && invoice.customer_user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Access denied: You cannot view this invoice.' });
        }

        const payments = db.prepare(`
            SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC
        `).all(id);

        res.json({
            success: true,
            data: {
                ...invoice,
                payments
            }
        });
    }

    static async recordPayment(req, res) {
        try {
            const invoiceId = req.params.id;
            const { amount, paymentMethod, paymentDetails, simulateFailure } = req.body;

            const result = PaymentService.recordPayment({
                invoiceId: parseInt(invoiceId),
                amount,
                paymentMethod,
                paymentDetails,
                simulateFailure: Boolean(simulateFailure),
                currentUser: req.user
            });

            res.json(result);
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async recordRefund(req, res) {
        try {
            const invoiceId = req.params.id;
            const { amount, reason } = req.body;

            const result = PaymentService.recordRefund({
                invoiceId: parseInt(invoiceId),
                amount,
                reason,
                currentUser: req.user
            });

            res.json(result);
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getAllPayments(req, res) {
        const db = getDb();
        let query = `
            SELECT
                p.*,
                i.invoice_number, i.total_amount as invoice_total,
                b.booking_reference,
                c.full_name as customer_name
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            JOIN bookings b ON i.booking_id = b.id
            JOIN customers c ON b.customer_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user && req.user.role === 'CUSTOMER') {
            query += ' AND c.id = ?';
            params.push(req.user.customerId);
        }

        query += ' ORDER BY p.created_at DESC';
        const payments = db.prepare(query).all(...params);

        res.json({ success: true, data: payments });
    }
}

module.exports = BillingController;
