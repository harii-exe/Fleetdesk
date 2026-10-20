const { getDb } = require('../../db/connection');
const { hashPassword, verifyPassword, generateToken } = require('../utils/security');

class AuthController {
    static async register(req, res) {
        const { username, email, password, fullName, phone, address, drivingLicenceNumber, licenceExpiryDate } = req.body;

        if (!username || !email || !password || !fullName || !phone || !drivingLicenceNumber || !licenceExpiryDate) {
            return res.status(400).json({ success: false, error: 'All registration fields are required.' });
        }

        // Email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email address format.' });
        }

        // Expiry check
        if (new Date(licenceExpiryDate) < new Date()) {
            return res.status(400).json({ success: false, error: 'Driving licence has already expired. Cannot register.' });
        }

        const db = getDb();

        // Check duplicates
        const existingUser = db.prepare('SELECT id FROM app_users WHERE username = ? OR email = ?').get(username.trim(), email.trim().toLowerCase());
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Username or email already exists in system.' });
        }

        const existingLicence = db.prepare('SELECT id FROM customers WHERE driving_licence_number = ?').get(drivingLicenceNumber.trim());
        if (existingLicence) {
            return res.status(409).json({ success: false, error: 'A customer profile is already registered with this driving licence number.' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const passwordHash = hashPassword(password);
            const userResult = db.prepare(`
                INSERT INTO app_users (username, email, password_hash, role, status)
                VALUES (?, ?, ?, 'CUSTOMER', 'ACTIVE')
            `).run(username.trim(), email.trim().toLowerCase(), passwordHash);

            const userId = userResult.lastInsertRowid;

            const customerResult = db.prepare(`
                INSERT INTO customers (user_id, full_name, phone, address, driving_licence_number, licence_expiry_date, account_status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            `).run(userId, fullName.trim(), phone.trim(), address.trim(), drivingLicenceNumber.trim(), licenceExpiryDate);

            const customerId = customerResult.lastInsertRowid;

            // Audit
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'CUSTOMER_REGISTERED', 'CUSTOMER', ?, 'Self registration via portal')
            `).run(userId, customerId.toString());

            db.exec('COMMIT');

            const token = generateToken({ userId, username, email, role: 'CUSTOMER', customerId });

            res.status(201).json({
                success: true,
                message: 'Registration successful.',
                token,
                user: {
                    id: userId,
                    customerId,
                    username,
                    email,
                    role: 'CUSTOMER',
                    fullName
                }
            });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async login(req, res) {
        const { usernameOrEmail, password } = req.body;
        if (!usernameOrEmail || !password) {
            return res.status(400).json({ success: false, error: 'Username/Email and Password are required.' });
        }

        const db = getDb();
        const user = db.prepare(`
            SELECT id, username, email, password_hash, role, status
            FROM app_users
            WHERE username = ? OR email = ?
        `).get(usernameOrEmail.trim(), usernameOrEmail.trim().toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, error: `Account is ${user.status}. Please contact administrator.` });
        }

        const passwordValid = verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ success: false, error: 'Invalid username or password.' });
        }

        let customer = null;
        let staff = null;
        let customerId = null;

        if (user.role === 'CUSTOMER') {
            customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(user.id);
            if (customer) customerId = customer.id;
        } else if (user.role === 'STAFF') {
            staff = db.prepare('SELECT * FROM staff_profiles WHERE user_id = ?').get(user.id);
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            customerId
        });

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'USER_LOGIN', 'APP_USER', ?, 'Successful authentication')
        `).run(user.id, user.id.toString());

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                customerId,
                customer,
                staff
            }
        });
    }

    static async me(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        const db = getDb();
        let customer = null;
        let staff = null;

        if (req.user.role === 'CUSTOMER') {
            customer = db.prepare('SELECT * FROM customers WHERE user_id = ?').get(req.user.id);
        } else if (req.user.role === 'STAFF') {
            staff = db.prepare('SELECT * FROM staff_profiles WHERE user_id = ?').get(req.user.id);
        }

        res.json({
            success: true,
            user: {
                ...req.user,
                customer,
                staff
            }
        });
    }

    static async logout(req, res) {
        if (req.user) {
            const db = getDb();
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'USER_LOGOUT', 'APP_USER', ?, 'User signed out')
            `).run(req.user.id, req.user.id.toString());
        }
        res.json({ success: true, message: 'Logged out successfully' });
    }
}

module.exports = AuthController;
