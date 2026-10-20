const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const Router = require('./router');
const { initDatabase } = require('../db/connection');
const { authenticate, requireAuth, requireRole } = require('./middleware/auth');

// Controllers
const AuthController = require('./controllers/authController');
const VehicleController = require('./controllers/vehicleController');
const CustomerController = require('./controllers/customerController');
const BookingController = require('./controllers/bookingController');
const BillingController = require('./controllers/billingController');
const MaintenanceController = require('./controllers/maintenanceController');
const ReportController = require('./controllers/reportController');
const ReviewController = require('./controllers/reviewController');
const SettingController = require('./controllers/settingController');

const router = new Router();

// Apply auth middleware globally
router.use(authenticate);

// ==================== ROUTE DEFINITIONS ====================

// 1. Authentication
router.post('/api/auth/register', AuthController.register);
router.post('/api/auth/login', AuthController.login);
router.get('/api/auth/me', requireAuth, AuthController.me);
router.post('/api/auth/logout', requireAuth, AuthController.logout);

// 2. Vehicles
router.get('/api/vehicles', VehicleController.getAll);
router.get('/api/vehicles/:id', VehicleController.getById);
router.post('/api/vehicles', requireRole(['ADMIN']), VehicleController.create);
router.put('/api/vehicles/:id', requireRole(['ADMIN']), VehicleController.update);
router.patch('/api/vehicles/:id/status', requireRole(['ADMIN']), VehicleController.updateStatus);

// 3. Customers
router.get('/api/customers', requireRole(['ADMIN', 'STAFF']), CustomerController.getAll);
router.get('/api/customers/:id', requireAuth, CustomerController.getById);
router.post('/api/customers', requireRole(['ADMIN', 'STAFF']), CustomerController.create);
router.put('/api/customers/:id', requireAuth, CustomerController.update);

// 4. Bookings
router.post('/api/bookings/check-availability', BookingController.checkAvailability);
router.get('/api/bookings', requireAuth, BookingController.getAll);
router.get('/api/bookings/:id', requireAuth, BookingController.getById);
router.post('/api/bookings', requireAuth, BookingController.create);
router.post('/api/bookings/:id/confirm', requireRole(['ADMIN', 'STAFF']), BookingController.confirm);
router.post('/api/bookings/:id/cancel', requireAuth, BookingController.cancel);
router.post('/api/bookings/:id/handover', requireRole(['ADMIN', 'STAFF']), BookingController.handover);
router.post('/api/bookings/:id/return', requireRole(['ADMIN', 'STAFF']), BookingController.returnVehicle);

// 5. Billing & Invoices
router.get('/api/invoices', requireAuth, BillingController.getAllInvoices);
router.get('/api/invoices/:id', requireAuth, BillingController.getInvoiceById);
router.post('/api/invoices/:id/payments', requireAuth, BillingController.recordPayment);
router.post('/api/invoices/:id/refund', requireRole(['ADMIN']), BillingController.recordRefund);
router.get('/api/payments', requireAuth, BillingController.getAllPayments);

// 6. Maintenance
router.get('/api/maintenance', requireRole(['ADMIN', 'STAFF']), MaintenanceController.getAll);
router.post('/api/maintenance', requireRole(['ADMIN', 'STAFF']), MaintenanceController.create);
router.patch('/api/maintenance/:id/status', requireRole(['ADMIN', 'STAFF']), MaintenanceController.updateStatus);

// 7. Reports & Analytics
router.get('/api/reports/dashboard', requireRole(['ADMIN', 'STAFF']), ReportController.getDashboard);
router.get('/api/reports/detailed', requireRole(['ADMIN', 'STAFF']), ReportController.getDetailed);
router.get('/api/reports/export', requireRole(['ADMIN', 'STAFF']), ReportController.exportCsv);

// 8. Reviews
router.get('/api/vehicles/:id/reviews', ReviewController.getByVehicleId);
router.post('/api/vehicles/:id/reviews', requireAuth, ReviewController.create);

// 9. Settings & User Management
router.get('/api/settings', SettingController.getSettings);
router.put('/api/settings', requireRole(['ADMIN']), SettingController.updateSettings);
router.get('/api/users', requireRole(['ADMIN']), SettingController.getUsers);
router.post('/api/users', requireRole(['ADMIN']), SettingController.createStaffUser);
router.patch('/api/users/:id/status', requireRole(['ADMIN']), SettingController.updateUserStatus);
router.get('/api/audit-logs', requireRole(['ADMIN']), SettingController.getAuditLogs);

// ==================== STATIC FILE SERVER ====================
const CLIENT_DIR = path.join(__dirname, '..', '..', 'client');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
    const parsed = url.parse(req.url);
    let filePath = path.join(CLIENT_DIR, parsed.pathname === '/' ? 'index.html' : parsed.pathname);

    // Normalize path to prevent directory traversal
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(CLIENT_DIR)) {
        res.statusCode = 403;
        return res.end('Access Denied');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        // Fallback to index.html for client-side routing
        const indexFile = path.join(CLIENT_DIR, 'index.html');
        if (fs.existsSync(indexFile)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(indexFile).pipe(res);
        } else {
            res.statusCode = 404;
            res.end('File Not Found');
        }
    }
}

// Create HTTP Server
function createServer() {
    initDatabase();

    const server = http.createServer(async (req, res) => {
        try {
            const parsed = url.parse(req.url);
            if (parsed.pathname.startsWith('/api/')) {
                const handled = await router.handle(req, res);
                if (handled === false) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: `API endpoint not found: ${req.method} ${parsed.pathname}` }));
                }
            } else {
                serveStatic(req, res);
            }
        } catch (err) {
            console.error('Unhandled Server Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Internal server error occurred.' }));
        }
    });

    return server;
}

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = createServer();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 FleetDesk Server running at http://localhost:${PORT}`);
        console.log(`   - REST API available at http://localhost:${PORT}/api/`);
        console.log(`   - Web Portal served at http://localhost:${PORT}/`);
    });
}

module.exports = { createServer, router };
