const { getDb } = require('../../db/connection');
const { hashPassword } = require('../utils/security');

class SettingController {
    static async getSettings(req, res) {
        const db = getDb();
        const rows = db.prepare('SELECT key, value, description FROM system_settings').all();
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        res.json({ success: true, data: settings, list: rows });
    }

    static async updateSettings(req, res) {
        const { penaltyMultiplier, cancellationFee, taxRate, companyName, supportPhone, supportEmail } = req.body;
        const db = getDb();

        const updateStmt = db.prepare(`
            INSERT INTO system_settings (key, value, description, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `);

        db.exec('BEGIN TRANSACTION');
        try {
            if (penaltyMultiplier !== undefined) updateStmt.run('penalty_multiplier', String(penaltyMultiplier), 'Overdue penalty multiplier');
            if (cancellationFee !== undefined) updateStmt.run('cancellation_fee', String(cancellationFee), 'Standard cancellation charge');
            if (taxRate !== undefined) updateStmt.run('tax_rate', String(taxRate), 'Applicable tax rate');
            if (companyName !== undefined) updateStmt.run('company_name', String(companyName), 'Company legal name');
            if (supportPhone !== undefined) updateStmt.run('support_phone', String(supportPhone), 'Support telephone');
            if (supportEmail !== undefined) updateStmt.run('support_email', String(supportEmail), 'Support email address');

            // Audit
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'SETTINGS_UPDATED', 'SYSTEM_SETTINGS', 'ALL', 'Business rules and operational settings modified')
            `).run(req.user.id);

            db.exec('COMMIT');
            res.json({ success: true, message: 'Settings successfully updated.' });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // User management (Admin only)
    static async getUsers(req, res) {
        const db = getDb();
        const users = db.prepare(`
            SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
                   c.full_name as customer_name,
                   s.full_name as staff_name, s.employee_code, s.department
            FROM app_users u
            LEFT JOIN customers c ON u.id = c.user_id
            LEFT JOIN staff_profiles s ON u.id = s.user_id
            ORDER BY u.id DESC
        `).all();

        res.json({ success: true, data: users });
    }

    static async createStaffUser(req, res) {
        const { username, email, password, fullName, employeeCode, department, phone } = req.body;

        if (!username || !email || !password || !fullName || !employeeCode) {
            return res.status(400).json({ success: false, error: 'Username, email, password, full name, and employee code are required.' });
        }

        const db = getDb();

        const existing = db.prepare('SELECT id FROM app_users WHERE username = ? OR email = ?').get(username.trim(), email.trim().toLowerCase());
        if (existing) {
            return res.status(409).json({ success: false, error: 'Username or email already exists.' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const hash = hashPassword(password);
            const userResult = db.prepare(`
                INSERT INTO app_users (username, email, password_hash, role, status)
                VALUES (?, ?, ?, 'STAFF', 'ACTIVE')
            `).run(username.trim(), email.trim().toLowerCase(), hash);

            const userId = userResult.lastInsertRowid;

            db.prepare(`
                INSERT INTO staff_profiles (user_id, employee_code, full_name, department, phone)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, employeeCode.trim().toUpperCase(), fullName.trim(), department || 'Operations', phone || '');

            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'STAFF_ACCOUNT_CREATED', 'APP_USER', ?, ?)
            `).run(req.user.id, userId.toString(), `Created staff account for ${fullName} (${employeeCode})`);

            db.exec('COMMIT');
            res.status(201).json({ success: true, message: 'Staff user created successfully.' });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async updateUserStatus(req, res) {
        const id = req.params.id;
        const { status } = req.body;

        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid user status.' });
        }

        const db = getDb();

        // Prevent self-suspension of currently logged in admin
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, error: 'You cannot deactivate your own administrative account.' });
        }

        db.prepare("UPDATE app_users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);

        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'USER_STATUS_UPDATED', 'APP_USER', ?, ?)
        `).run(req.user.id, id.toString(), `Updated status to ${status}`);

        res.json({ success: true, message: `User status updated to ${status}.` });
    }

    static async getAuditLogs(req, res) {
        const db = getDb();
        const logs = db.prepare(`
            SELECT a.*, u.username, u.role
            FROM audit_logs a
            LEFT JOIN app_users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT 100
        `).all();

        res.json({ success: true, data: logs });
    }
}

module.exports = SettingController;
