// Client-side Hash Router for 20 Enterprise Pages
const ClientRouter = {
    routes: [
        { path: '#/login', view: 'Login', roles: null, public: true },
        { path: '#/register', view: 'Register', roles: null, public: true },
        { path: '#/dashboard', title: 'Dashboard', view: 'Dashboard', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/vehicles', title: 'Fleet Inventory', view: 'Vehicles', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/vehicles/:id', title: 'Vehicle Dossier', view: 'VehicleDetails', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/customers', title: 'Customer Management', view: 'Customers', roles: ['ADMIN', 'STAFF'] },
        { path: '#/bookings', title: 'Booking Management', view: 'Bookings', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/new-booking', title: 'New Reservation', view: 'NewBooking', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/bookings/:id', title: 'Booking Dossier', view: 'BookingDetails', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/dispatch-desk', title: 'Dispatch & Return Desk', view: 'DispatchDesk', roles: ['ADMIN', 'STAFF'] },
        { path: '#/invoices', title: 'Billing & Invoices', view: 'Billing', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/payments', title: 'Payment Records', view: 'Payments', roles: ['ADMIN', 'STAFF'] },
        { path: '#/maintenance', title: 'Maintenance Bay', view: 'Maintenance', roles: ['ADMIN', 'STAFF'] },
        { path: '#/reports', title: 'Reports & Analytics', view: 'Reports', roles: ['ADMIN', 'STAFF'] },
        { path: '#/profile', title: 'My Account', view: 'Profile', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
        { path: '#/users', title: 'User & Role Management', view: 'Users', roles: ['ADMIN'] },
        { path: '#/settings', title: 'System Settings', view: 'Settings', roles: ['ADMIN'] },
        { path: '#/access-denied', title: 'Access Denied', view: 'AccessDenied', roles: null },
        { path: '#/404', title: 'Page Not Found', view: 'NotFound', roles: null }
    ],

    init() {
        window.addEventListener('hashchange', () => this.navigate());
        this.navigate();
    },

    navigate() {
        const fullHash = window.location.hash || '#/dashboard';
        const hashPath = fullHash.split('?')[0];

        // Match route
        let matchedRoute = null;
        let routeParams = {};

        for (const r of this.routes) {
            const patternParts = r.path.split('/');
            const hashParts = hashPath.split('/');

            if (patternParts.length === hashParts.length) {
                let match = true;
                const params = {};
                for (let i = 0; i < patternParts.length; i++) {
                    if (patternParts[i].startsWith(':')) {
                        params[patternParts[i].slice(1)] = hashParts[i];
                    } else if (patternParts[i] !== hashParts[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    matchedRoute = r;
                    routeParams = params;
                    break;
                }
            }
        }

        if (!matchedRoute) {
            matchedRoute = { path: '#/404', title: 'Not Found', view: 'NotFound', roles: null };
        }

        // Auth checks
        if (!matchedRoute.public && !AppState.token) {
            window.location.hash = '#/login';
            return;
        }

        if (matchedRoute.public && AppState.token && (hashPath === '#/login' || hashPath === '#/register')) {
            window.location.hash = '#/dashboard';
            return;
        }

        if (matchedRoute.roles && !matchedRoute.roles.includes(AppState.role)) {
            matchedRoute = { path: '#/access-denied', title: 'Access Denied', view: 'AccessDenied', roles: null };
        }

        this.renderView(matchedRoute, routeParams);
    },

    renderView(route, params) {
        const appLayout = document.getElementById('app-layout');
        const authLayout = document.getElementById('auth-layout');
        const mainContent = document.getElementById('main-content');
        const sidebarContainer = document.getElementById('sidebar-container');
        const navbarContainer = document.getElementById('navbar-container');

        if (route.view === 'Login' || route.view === 'Register') {
            appLayout.classList.add('hidden');
            authLayout.classList.remove('hidden');

            if (route.view === 'Login') {
                AuthViews.renderLogin(authLayout);
            } else {
                AuthViews.renderRegister(authLayout);
            }
            return;
        }

        authLayout.classList.add('hidden');
        appLayout.classList.remove('hidden');

        // Render Sidebar and Navbar
        Nav.renderSidebar(sidebarContainer);
        Nav.renderNavbar(navbarContainer, route.title);

        // Render Main View
        switch (route.view) {
            case 'Dashboard':
                DashboardView.render(mainContent);
                break;
            case 'Vehicles':
                VehiclesView.render(mainContent);
                break;
            case 'VehicleDetails':
                VehicleDetailsView.render(mainContent, params.id);
                break;
            case 'Customers':
                CustomersView.render(mainContent);
                break;
            case 'Bookings':
                BookingsView.render(mainContent);
                break;
            case 'NewBooking':
                NewBookingView.render(mainContent);
                break;
            case 'BookingDetails':
                BookingDetailsView.render(mainContent, params.id);
                break;
            case 'DispatchDesk':
                HandoverReturnView.render(mainContent);
                break;
            case 'Billing':
                BillingView.render(mainContent);
                break;
            case 'Payments':
                PaymentsView.render(mainContent);
                break;
            case 'Maintenance':
                MaintenanceView.render(mainContent);
                break;
            case 'Reports':
                ReportsView.render(mainContent);
                break;
            case 'Profile':
                ProfileView.render(mainContent);
                break;
            case 'Users':
                UsersView.render(mainContent);
                break;
            case 'Settings':
                SettingsView.render(mainContent);
                break;
            case 'AccessDenied':
                AccessDeniedView.render(mainContent);
                break;
            case 'NotFound':
            default:
                NotFoundView.render(mainContent);
                break;
        }
    }
};

window.ClientRouter = ClientRouter;
