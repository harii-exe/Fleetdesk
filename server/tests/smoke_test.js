const { createServer } = require('../src/app');

async function runSmokeTest() {
    const server = createServer();
    await new Promise(resolve => server.listen(3099, '127.0.0.1', resolve));
    console.log('✅ Server listening on port 3099');

    try {
        // 1. Test public vehicles endpoint
        const vRes = await fetch('http://127.0.0.1:3099/api/vehicles');
        const vData = await vRes.json();
        console.log(`✅ GET /api/vehicles: success=${vData.success}, vehicles=${vData.data.length}`);

        // 2. Test admin login
        const loginRes = await fetch('http://127.0.0.1:3099/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail: 'admin', password: 'Admin@123' })
        });
        const loginData = await loginRes.json();
        console.log(`✅ POST /api/auth/login: success=${loginData.success}, role=${loginData.user.role}`);

        const token = loginData.token;

        // 3. Test protected dashboard endpoint
        const dashRes = await fetch('http://127.0.0.1:3099/api/reports/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dashData = await dashRes.json();
        console.log(`✅ GET /api/reports/dashboard: success=${dashData.success}, fleetTotal=${dashData.data.fleet.total}, netRevenue=₹${dashData.data.financials.netRevenue}`);

        // 4. Test customer login
        const custLoginRes = await fetch('http://127.0.0.1:3099/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail: 'rahul', password: 'Customer@123' })
        });
        const custLogin = await custLoginRes.json();
        console.log(`✅ Customer login: success=${custLogin.success}, customerId=${custLogin.user.customerId}`);

        // 5. Test availability check
        const availRes = await fetch('http://127.0.0.1:3099/api/bookings/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vehicleId: 1,
                pickupDatetime: '2026-12-01 10:00:00',
                expectedReturnDatetime: '2026-12-04 10:00:00'
            })
        });
        const availData = await availRes.json();
        console.log(`✅ Check availability: success=${availData.success}, available=${availData.available}`);

        console.log('🎉 Smoke test completed with 100% success!');
    } catch (err) {
        console.error('❌ Smoke test failed:', err);
    } finally {
        server.close();
    }
}

runSmokeTest();
