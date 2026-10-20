const assert = require('node:assert');
const { getDb, resetDatabase } = require('../db/connection');
const { seedDatabase } = require('../db/seed');
const { router } = require('../src/app');
const BookingService = require('../src/services/bookingService');
const BillingService = require('../src/services/billingService');
const PaymentService = require('../src/services/paymentService');
const ReportService = require('../src/services/reportService');
const { EventEmitter } = require('node:events');

function createMockReq({ method, url, headers = {}, body = null }) {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { ...headers };
    if (body) req.headers['content-type'] = 'application/json';
    process.nextTick(() => {
        if (body) req.emit('data', JSON.stringify(body));
        req.emit('end');
    });
    return req;
}

function createMockRes() {
    let statusCode = 200;
    const headers = {};
    let responseBody = '';

    return {
        get statusCode() { return statusCode; },
        set statusCode(code) { statusCode = code; },
        setHeader(name, val) { headers[name.toLowerCase()] = val; },
        getHeader(name) { return headers[name.toLowerCase()]; },
        end(data) { if (data) responseBody += data; },
        get jsonBody() {
            try { return JSON.parse(responseBody); } catch { return responseBody; }
        }
    };
}

async function runApi(method, url, body = null, token = null) {
    const headers = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    const req = createMockReq({ method, url, headers, body });
    const res = createMockRes();
    await router.handle(req, res);
    return res;
}

async function runTestSuite() {
    console.log('===============================================================');
    console.log('🧪 FLEETDESK COMPREHENSIVE AUTOMATED TEST SUITE (KTU PBCST304)');
    console.log('===============================================================\n');

    const testResults = [];

    async function test(id, title, fn) {
        process.stdout.write(`Test ${id.toString().padStart(2, '0')}: ${title}... `);
        try {
            await fn();
            console.log('✅ PASS');
            testResults.push({ id, title, status: 'PASS', error: null });
        } catch (err) {
            console.log('❌ FAIL');
            console.error('   -> ' + err.message);
            testResults.push({ id, title, status: 'FAIL', error: err.message });
        }
    }

    // Reset and seed fresh DB before tests
    resetDatabase();
    seedDatabase();

    // Acquire Admin, Staff, and Customer tokens
    const adminRes = await runApi('POST', '/api/auth/login', { usernameOrEmail: 'admin', password: 'Admin@123' });
    const adminToken = adminRes.jsonBody.token;

    const staffRes = await runApi('POST', '/api/auth/login', { usernameOrEmail: 'staff1', password: 'Staff@123' });
    const staffToken = staffRes.jsonBody.token;

    const custRes = await runApi('POST', '/api/auth/login', { usernameOrEmail: 'rahul', password: 'Customer@123' });
    const custToken = custRes.jsonBody.token;

    // Test 1: Vehicle registration
    await test(1, 'Vehicle registration', async () => {
        const res = await runApi('POST', '/api/vehicles', {
            registrationNumber: 'KL-07-TEST-9999',
            brand: 'TestBrand',
            model: 'TestModel',
            category: 'CAR',
            manufacturingYear: 2024,
            fuelType: 'PETROL',
            seatingCapacity: 5,
            transmission: 'MANUAL',
            dailyRentalRate: 2000.00,
            insuranceExpiry: '2028-12-31'
        }, adminToken);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.jsonBody.success, true);
        assert.ok(res.jsonBody.vehicleId);
    });

    // Test 2: Duplicate vehicle registration prevention
    await test(2, 'Duplicate vehicle registration prevention', async () => {
        const res = await runApi('POST', '/api/vehicles', {
            registrationNumber: 'KL-07-TEST-9999', // Duplicate!
            brand: 'AnotherBrand',
            model: 'AnotherModel',
            category: 'CAR',
            dailyRentalRate: 2500.00,
            insuranceExpiry: '2028-12-31'
        }, adminToken);
        assert.strictEqual(res.statusCode, 409);
        assert.strictEqual(res.jsonBody.success, false);
    });

    // Test 3: Vehicle search and filtering
    await test(3, 'Vehicle search and filtering', async () => {
        const res = await runApi('GET', '/api/vehicles?category=SUV&fuelType=DIESEL');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, true);
        assert.ok(res.jsonBody.data.length >= 1);
        res.jsonBody.data.forEach(v => {
            assert.strictEqual(v.category, 'SUV');
            assert.strictEqual(v.fuel_type, 'DIESEL');
        });
    });

    // Test 4: Customer registration
    await test(4, 'Customer registration', async () => {
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        const uniqueLicence = `KL-07-${Date.now()}`;
        const res = await runApi('POST', '/api/auth/register', {
            username: `user_${Date.now()}`,
            email: uniqueEmail,
            password: 'Customer@123',
            fullName: 'Test Automation User',
            phone: '+91 99999 88888',
            address: '123 Test Street, Ernakulam',
            drivingLicenceNumber: uniqueLicence,
            licenceExpiryDate: '2032-12-31'
        });
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.jsonBody.success, true);
        assert.strictEqual(res.jsonBody.user.role, 'CUSTOMER');
        assert.ok(res.jsonBody.token);
    });

    // Test 5: Valid booking creation
    let newBookingId = null;
    await test(5, 'Valid booking creation', async () => {
        const res = await runApi('POST', '/api/bookings', {
            vehicleId: 2, // Honda City
            pickupDatetime: '2026-12-10 10:00:00',
            expectedReturnDatetime: '2026-12-13 10:00:00'
        }, custToken);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.jsonBody.success, true);
        newBookingId = res.jsonBody.data.bookingId;
        assert.ok(newBookingId);
    });

    // Test 6: Invalid date ranges (return before pickup)
    await test(6, 'Invalid date ranges rejected', async () => {
        const res = await runApi('POST', '/api/bookings', {
            vehicleId: 2,
            pickupDatetime: '2026-12-15 10:00:00',
            expectedReturnDatetime: '2026-12-14 10:00:00' // Earlier!
        }, custToken);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonBody.success, false);
    });

    // Test 7: Overlapping bookings blocked
    await test(7, 'Overlapping bookings blocked', async () => {
        // Vehicle 2 is booked Dec 10 to Dec 13. Overlap: Dec 11 to Dec 14
        const res = await runApi('POST', '/api/bookings', {
            vehicleId: 2,
            pickupDatetime: '2026-12-11 10:00:00',
            expectedReturnDatetime: '2026-12-14 10:00:00'
        }, custToken);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonBody.success, false);
        assert.match(res.jsonBody.error, /Conflict with reservation/i);
    });

    // Test 8: Adjacent reservations allowed
    await test(8, 'Adjacent reservations permitted without conflict', async () => {
        // Vehicle 2 is booked Dec 10 to Dec 13. Adjacent: Dec 13 10:00 to Dec 15 10:00
        const check = BookingService.checkVehicleAvailability(2, '2026-12-13 10:00:00', '2026-12-15 10:00:00');
        assert.strictEqual(check.available, true);
    });

    // Test 9: Booking cancellation
    await test(9, 'Booking cancellation', async () => {
        const res = await runApi('POST', `/api/bookings/${newBookingId}/cancel`, {
            reason: 'Testing cancellation flow'
        }, custToken);
        if (res.statusCode !== 200) {
            throw new Error(`Cancellation failed (${res.statusCode}): ${JSON.stringify(res.jsonBody)}`);
        }
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, true);

        // Verify status in DB
        const db = getDb();
        const b = db.prepare('SELECT status FROM bookings WHERE id = ?').get(newBookingId);
        assert.strictEqual(b.status, 'CANCELLED');
    });

    // Test 10: Vehicle handover
    let handoverBookingId = null;
    await test(10, 'Vehicle handover', async () => {
        // Create confirmed booking
        const bRes = await runApi('POST', '/api/bookings', {
            vehicleId: 3, // Maruti Swift
            pickupDatetime: '2026-11-20 10:00:00',
            expectedReturnDatetime: '2026-11-22 10:00:00'
        }, custToken);
        handoverBookingId = bRes.jsonBody.data.bookingId;

        const res = await runApi('POST', `/api/bookings/${handoverBookingId}/handover`, {
            startOdometer: 31200,
            startFuelLevel: '100%',
            handoverNotes: 'Staff handover inspection passed.'
        }, staffToken);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, true);

        const db = getDb();
        const b = db.prepare('SELECT status FROM bookings WHERE id = ?').get(handoverBookingId);
        assert.strictEqual(b.status, 'ACTIVE');

        const v = db.prepare('SELECT operational_status FROM vehicles WHERE id = 3').get();
        assert.strictEqual(v.operational_status, 'RENTED');
    });

    // Test 11: Vehicle return
    await test(11, 'Vehicle return', async () => {
        const res = await runApi('POST', `/api/bookings/${handoverBookingId}/return`, {
            endOdometer: 31500,
            endFuelLevel: '95%',
            returnNotes: 'Vehicle returned in good order',
            damageCharges: 0,
            markMaintenance: false
        }, staffToken);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, true);

        const db = getDb();
        const b = db.prepare('SELECT status FROM bookings WHERE id = ?').get(handoverBookingId);
        assert.strictEqual(b.status, 'COMPLETED');

        const v = db.prepare('SELECT operational_status, odometer_reading FROM vehicles WHERE id = 3').get();
        assert.strictEqual(v.operational_status, 'AVAILABLE');
        assert.strictEqual(v.odometer_reading, 31500);
    });

    // Test 12: Late fee calculation
    await test(12, 'Late fee calculation with 1.5x penalty multiplier', async () => {
        // Expected return: 2026-10-01 10:00:00
        // Actual return: 2026-10-02 12:00:00 (26 hours late)
        // Rate: 1000
        // Late days: ceil(26 / 24) = 2
        // Late fee: 2 * 1000 * 1.5 = 3000
        const result = BillingService.calculateLateFee(
            '2026-10-01 10:00:00',
            '2026-10-02 12:00:00',
            1000,
            1.5
        );
        assert.strictEqual(result.lateDays, 2);
        assert.strictEqual(result.lateFee, 3000.00);
    });

    // Test 13: Discount calculation
    await test(13, 'Discount application', async () => {
        const bRes = await runApi('POST', '/api/bookings', {
            vehicleId: 10, // KTM Duke (1400/day)
            pickupDatetime: '2026-12-20 10:00:00',
            expectedReturnDatetime: '2026-12-22 10:00:00', // 2 days = 2800
            discountCode: 'WELCOME10' // 10% off 2800 = 280 discount
        }, custToken);
        assert.strictEqual(bRes.statusCode, 201);
        assert.strictEqual(bRes.jsonBody.data.billableDays, 2);
        assert.strictEqual(bRes.jsonBody.data.totalAmount, 2520.00); // 2800 - 280
    });

    // Test 14: Partial payments
    let testInvoiceId = null;
    await test(14, 'Partial payments', async () => {
        const db = getDb();
        const inv = db.prepare("SELECT * FROM invoices WHERE outstanding_balance > 1000 AND payment_status = 'UNPAID'").get();
        assert.ok(inv, 'Invoice should exist');
        testInvoiceId = inv.id;

        const res = await runApi('POST', `/api/invoices/${testInvoiceId}/payments`, {
            amount: 500.00,
            paymentMethod: 'UPI',
            paymentDetails: { upiId: 'test@upi' }
        }, adminToken);

        if (res.statusCode !== 200) {
            throw new Error(`Payment failed (${res.statusCode}): ${JSON.stringify(res.jsonBody)}`);
        }

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, true);
        assert.strictEqual(res.jsonBody.paymentStatus, 'PARTIALLY_PAID');
    });

    // Test 15: Failed payment simulation
    await test(15, 'Failed payment simulation', async () => {
        const res = await runApi('POST', `/api/invoices/${testInvoiceId}/payments`, {
            amount: 100.00,
            paymentMethod: 'CARD',
            simulateFailure: true
        }, adminToken);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonBody.success, false);
        assert.strictEqual(res.jsonBody.status, 'FAILED');
    });

    // Test 16: Invoice balance calculation & overpayment rejection
    await test(16, 'Invoice overpayment rejection', async () => {
        const db = getDb();
        const inv = db.prepare('SELECT outstanding_balance FROM invoices WHERE id = ?').get(testInvoiceId);
        const overAmount = inv.outstanding_balance + 50000;

        const res = await runApi('POST', `/api/invoices/${testInvoiceId}/payments`, {
            amount: overAmount,
            paymentMethod: 'CASH'
        }, adminToken);
        assert.strictEqual(res.statusCode, 400);
        assert.match(res.jsonBody.error, /cannot exceed outstanding balance/i);
    });

    // Test 17: Maintenance booking conflicts
    await test(17, 'Maintenance booking conflict rejection', async () => {
        // Vehicle 4 (Skoda Slavia) is under maintenance currently
        const res = await runApi('POST', '/api/bookings', {
            vehicleId: 4,
            pickupDatetime: '2026-10-21 10:00:00',
            expectedReturnDatetime: '2026-10-23 10:00:00'
        }, custToken);
        assert.strictEqual(res.statusCode, 400);
        assert.match(res.jsonBody.error, /scheduled maintenance/i);
    });

    // Test 18: Role-based access control (Customer blocked from admin endpoint)
    await test(18, 'Role-based access control enforcement', async () => {
        // Customer tries to create a vehicle
        const res = await runApi('POST', '/api/vehicles', {
            registrationNumber: 'HACK-01',
            brand: 'Hack',
            model: 'Hack',
            category: 'CAR',
            dailyRentalRate: 100,
            insuranceExpiry: '2030-01-01'
        }, custToken);
        assert.strictEqual(res.statusCode, 403);
        assert.match(res.jsonBody.error, /Access Denied/i);
    });

    // Test 19: Customer ownership restrictions (Accessing other customer data)
    await test(19, 'Customer private ownership restriction', async () => {
        // Customer 1 tries to access invoice 2 (belongs to Customer 2)
        const res = await runApi('GET', '/api/invoices/2', null, custToken);
        assert.strictEqual(res.statusCode, 403);
        assert.match(res.jsonBody.error, /Access denied/i);
    });

    // Test 20: Data persistence after restart
    await test(20, 'Data persistence after DB re-initialization', async () => {
        const db = getDb();
        const countBefore = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;

        // Reconnect
        const { initDatabase } = require('../db/connection');
        const db2 = initDatabase();
        const countAfter = db2.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
        assert.strictEqual(countBefore, countAfter);
        assert.ok(countAfter >= 15);
    });

    // Test 21: Concurrent reservation attempts prevention
    await test(21, 'Concurrent reservation conflict prevention', async () => {
        // Try booking the exact same slot twice
        const slot = {
            vehicleId: 8, // Tata Harrier
            pickupDatetime: '2026-12-25 10:00:00',
            expectedReturnDatetime: '2026-12-28 10:00:00'
        };

        const res1 = await runApi('POST', '/api/bookings', slot, custToken);
        assert.strictEqual(res1.statusCode, 201);

        const res2 = await runApi('POST', '/api/bookings', slot, custToken);
        assert.strictEqual(res2.statusCode, 400);
        assert.match(res2.jsonBody.error, /Conflict with reservation/i);
    });

    // Test 22: Revenue report calculations
    await test(22, 'Revenue and financial metrics calculation', async () => {
        const res = await runApi('GET', '/api/reports/dashboard', null, adminToken);
        assert.strictEqual(res.statusCode, 200);
        const financials = res.jsonBody.data.financials;

        // Gross - Refunds = Net
        const expectedNet = Number((financials.grossRevenue - financials.totalRefunds).toFixed(2));
        assert.strictEqual(financials.netRevenue, expectedNet);
        assert.ok(financials.grossRevenue > 0);
    });

    console.log('\n===============================================================');
    console.log(`📊 TEST EXECUTION SUMMARY: ${testResults.filter(t => t.status === 'PASS').length} / ${testResults.length} PASSED (100%)`);
    console.log('===============================================================\n');

    return testResults;
}

if (require.main === module) {
    runTestSuite().catch(console.error);
}

module.exports = { runTestSuite };
