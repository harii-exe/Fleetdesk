const { verifyToken } = require('../utils/security');
const { getDb } = require('../../db/connection');

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const payload = verifyToken(token);
    if (!payload) {
        req.user = null;
        return next();
    }

    const db = getDb();
    const user = db.prepare('SELECT id, username, email, role, status FROM app_users WHERE id = ?').get(payload.userId);
    if (!user || user.status !== 'ACTIVE') {
        req.user = null;
        return next();
    }

    // If customer, attach customerId
    if (user.role === 'CUSTOMER') {
        const cust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(user.id);
        if (cust) {
            user.customerId = cust.id;
        }
    } else if (user.role === 'STAFF') {
        const staff = db.prepare('SELECT id, employee_code, full_name, department FROM staff_profiles WHERE user_id = ?').get(user.id);
        if (staff) {
            user.staffProfile = staff;
        }
    }

    req.user = user;
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }
    next();
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access Denied: Role '${req.user.role}' is not authorized to perform this operation.`
            });
        }
        next();
    };
}

module.exports = {
    authenticate,
    requireAuth,
    requireRole
};
