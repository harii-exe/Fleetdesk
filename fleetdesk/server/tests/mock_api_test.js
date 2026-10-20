const { router } = require('../src/app');
const { EventEmitter } = require('node:events');

function createMockReq({ method, url, headers = {}, body = null }) {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { ...headers };
    if (body) {
        req.headers['content-type'] = 'application/json';
    }
    process.nextTick(() => {
        if (body) {
            req.emit('data', JSON.stringify(body));
        }
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
        end(data) {
            if (data) responseBody += data;
        },
        get jsonBody() {
            try { return JSON.parse(responseBody); } catch { return responseBody; }
        }
    };
}

async function testMock() {
    // 1. Test GET /api/vehicles
    const req1 = createMockReq({ method: 'GET', url: '/api/vehicles' });
    const res1 = createMockRes();
    await router.handle(req1, res1);
    console.log('GET /api/vehicles status:', res1.statusCode, 'Count:', res1.jsonBody.data.length);

    // 2. Test Login
    const req2 = createMockReq({
        method: 'POST',
        url: '/api/auth/login',
        body: { usernameOrEmail: 'admin', password: 'Admin@123' }
    });
    const res2 = createMockRes();
    await router.handle(req2, res2);
    console.log('POST /api/auth/login status:', res2.statusCode, 'Role:', res2.jsonBody.user?.role, 'Token:', !!res2.jsonBody.token);

    // 3. Test Dashboard with Token
    const token = res2.jsonBody.token;
    const req3 = createMockReq({
        method: 'GET',
        url: '/api/reports/dashboard',
        headers: { 'authorization': `Bearer ${token}` }
    });
    const res3 = createMockRes();
    await router.handle(req3, res3);
    console.log('GET /api/reports/dashboard status:', res3.statusCode, 'Fleet Total:', res3.jsonBody.data.fleet.total);
}

testMock();
