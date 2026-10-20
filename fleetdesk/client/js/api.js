// FleetDesk REST API Client
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (AppState.token) {
            headers['Authorization'] = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle file download responses (e.g. CSV export)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/csv')) {
                const text = await response.text();
                return { success: true, csv: text };
            }

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    AppState.clearAuth();
                    window.location.hash = '#/login';
                }
                throw new Error(data.error || 'Server error occurred.');
            }

            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // Auth
    login(usernameOrEmail, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ usernameOrEmail, password })
        });
    },

    register(customerData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    },

    getMe() {
        return this.request('/auth/me');
    },

    logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },

    // Vehicles
    getVehicles(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/vehicles${query ? '?' + query : ''}`);
    },

    getVehicleById(id) {
        return this.request(`/vehicles/${id}`);
    },

    createVehicle(vehicleData) {
        return this.request('/vehicles', {
            method: 'POST',
            body: JSON.stringify(vehicleData)
        });
    },

    updateVehicle(id, vehicleData) {
        return this.request(`/vehicles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(vehicleData)
        });
    },

    updateVehicleStatus(id, status) {
        return this.request(`/vehicles/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    // Bookings
    checkAvailability(vehicleId, pickupDatetime, expectedReturnDatetime) {
        return this.request('/bookings/check-availability', {
            method: 'POST',
            body: JSON.stringify({ vehicleId, pickupDatetime, expectedReturnDatetime })
        });
    },

    getBookings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/bookings${query ? '?' + query : ''}`);
    },

    getBookingById(id) {
        return this.request(`/bookings/${id}`);
    },

    createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    confirmBooking(id) {
        return this.request(`/bookings/${id}/confirm`, { method: 'POST' });
    },

    cancelBooking(id, reason) {
        return this.request(`/bookings/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },

    handoverVehicle(id, handoverData) {
        return this.request(`/bookings/${id}/handover`, {
            method: 'POST',
            body: JSON.stringify(handoverData)
        });
    },

    returnVehicle(id, returnData) {
        return this.request(`/bookings/${id}/return`, {
            method: 'POST',
            body: JSON.stringify(returnData)
        });
    },

    // Customers
    getCustomers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/customers${query ? '?' + query : ''}`);
    },

    getCustomerById(id) {
        return this.request(`/customers/${id}`);
    },

    createCustomer(customerData) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    },

    updateCustomer(id, customerData) {
        return this.request(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    },

    // Invoices & Payments
    getInvoices(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/invoices${query ? '?' + query : ''}`);
    },

    getInvoiceById(id) {
        return this.request(`/invoices/${id}`);
    },

    recordPayment(invoiceId, paymentData) {
        return this.request(`/invoices/${invoiceId}/payments`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    recordRefund(invoiceId, refundData) {
        return this.request(`/invoices/${invoiceId}/refund`, {
            method: 'POST',
            body: JSON.stringify(refundData)
        });
    },

    getPayments() {
        return this.request('/payments');
    },

    // Maintenance
    getMaintenance(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/maintenance${query ? '?' + query : ''}`);
    },

    createMaintenance(data) {
        return this.request('/maintenance', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateMaintenanceStatus(id, data) {
        return this.request(`/maintenance/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Reports
    getDashboardMetrics(startDate, endDate) {
        let query = '';
        if (startDate && endDate) query = `?startDate=${startDate}&endDate=${endDate}`;
        return this.request(`/reports/dashboard${query}`);
    },

    getDetailedReports() {
        return this.request('/reports/detailed');
    },

    exportReportCsv(type) {
        return this.request(`/reports/export?type=${type}`);
    },

    // Reviews
    getVehicleReviews(vehicleId) {
        return this.request(`/vehicles/${vehicleId}/reviews`);
    },

    submitReview(vehicleId, reviewData) {
        return this.request(`/vehicles/${vehicleId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    },

    // Settings & Users
    getSettings() {
        return this.request('/settings');
    },

    updateSettings(data) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getUsers() {
        return this.request('/users');
    },

    createStaff(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateUserStatus(id, status) {
        return this.request(`/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    getAuditLogs() {
        return this.request('/audit-logs');
    }
};

window.API = API;
