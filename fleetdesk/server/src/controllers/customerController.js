const { getDb } = require('../../db/connection');
const { hashPassword } = require('../utils/security');

class CustomerController {
    static async getAll(req, res) {
        const db = getDb();
        const { search, status } = req.query;

        let query = `
            SELECT c.*, u.username, u.email
            FROM customers c
            JOIN app_users u ON c.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND c.account_status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.driving_licence_number LIKE ? OR u.email LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY c.id DESC';
        const customers = db.prepare(query).all(...params);

        res.json({ success: true, data: customers });
    }

    static async getById(req, res) {
        const id = req.params.id;
        const db = getDb();

        const customer = db.prepare(`
            SELECT c.*, u.username, u.email
            FROM customers c
            JOIN app_users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(id);

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Ownership restriction: customers can only view their own profile
        if (req.user && req.user.role === 'CUSTOMER' && req.user.customerId !== parseInt(id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized access to customer record.' });
        }

        // Fetch customer booking history
        const bookings = db.prepare(`
            SELECT b.*, v.brand, v.model, v.registration_number, v.category
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE b.customer_id = ?
            ORDER BY b.created_at DESC
        `).all(id);

        // Fetch customer invoices
        const invoices = db.prepare(`
            SELECT i.*, b.booking_reference
            FROM invoices i
            JOIN bookings b ON i.booking_id = b.id
            WHERE b.customer_id = ?
            ORDER BY i.issued_at DESC
        `).all(id);

        res.json({
            success: true,
            data: {
                ...customer,
                bookings,
                invoices
            }
        });
    }

    static async create(req, res) {
        const { username, email, password, fullName, phone, address, drivingLicenceNumber, licenceExpiryDate } = req.body;

        if (!username || !email || !password || !fullName || !phone || !drivingLicenceNumber || !licenceExpiryDate) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }

        const db = getDb();

        const existingLicence = db.prepare('SELECT id FROM customers WHERE driving_licence_number = ?').get(drivingLicenceNumber.trim());
        if (existingLicence) {
            return res.status(409).json({ success: false, error: 'Driving licence number already registered.' });
        }

        const existingUser = db.prepare('SELECT id FROM app_users WHERE username = ? OR email = ?').get(username.trim(), email.trim().toLowerCase());
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Username or email already in use.' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const passwordHash = hashPassword(password);
            const userResult = db.prepare(`
                INSERT INTO app_users (username, email, password_hash, role, status)
                VALUES (?, ?, ?, 'CUSTOMER', 'ACTIVE')
            `).run(username.trim(), email.trim().toLowerCase(), passwordHash);

            const userId = userResult.lastInsertRowid;

            const custResult = db.prepare(`
                INSERT INTO customers (user_id, full_name, phone, address, driving_licence_number, licence_expiry_date, account_status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            `).run(userId, fullName.trim(), phone.trim(), address.trim(), drivingLicenceNumber.trim(), licenceExpiryDate);

            // Audit
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'STAFF_CREATED_CUSTOMER', 'CUSTOMER', ?, ?)
            `).run(req.user.id, custResult.lastInsertRowid.toString(), `Registered customer ${fullName}`);

            db.exec('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Customer profile successfully created.',
                customerId: custResult.lastInsertRowid
            });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async update(req, res) {
        const id = req.params.id;
        const db = getDb();
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Ownership restriction
        if (req.user && req.user.role === 'CUSTOMER' && req.user.customerId !== parseInt(id)) {
            return res.status(403).json({ success: false, error: 'Unauthorized to modify this profile.' });
        }

        const { fullName, phone, address, licenceExpiryDate, accountStatus } = req.body;

        const newStatus = (req.user.role === 'ADMIN' && accountStatus) ? accountStatus : customer.account_status;

        db.prepare(`
            UPDATE customers
            SET full_name = ?,
                phone = ?,
                address = ?,
                licence_expiry_date = ?,
                account_status = ?
            WHERE id = ?
        `).run(
            fullName || customer.full_name,
            phone || customer.phone,
            address || customer.address,
            licenceExpiryDate || customer.licence_expiry_date,
            newStatus,
            id
        );

        res.json({ success: true, message: 'Customer profile updated successfully.' });
    }
}

module.exports = CustomerController;
