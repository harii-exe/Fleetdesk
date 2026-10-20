// FleetDesk Global State Manager
const AppState = {
    user: null,
    token: null,
    role: null,
    theme: 'light',
    subscribers: [],

    init() {
        this.token = localStorage.getItem('fleetdesk_token');
        const savedUser = localStorage.getItem('fleetdesk_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.role = this.user.role;
            } catch (e) {
                this.clearAuth();
            }
        }
        this.theme = localStorage.getItem('fleetdesk_theme') || 'light';
        this.applyTheme();
    },

    setAuth(user, token) {
        this.user = user;
        this.token = token;
        this.role = user ? user.role : null;
        if (token) {
            localStorage.setItem('fleetdesk_token', token);
            localStorage.setItem('fleetdesk_user', JSON.stringify(user));
        } else {
            this.clearAuth();
        }
        this.notify();
    },

    clearAuth() {
        this.user = null;
        this.token = null;
        this.role = null;
        localStorage.removeItem('fleetdesk_token');
        localStorage.removeItem('fleetdesk_user');
        this.notify();
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('fleetdesk_theme', this.theme);
        this.applyTheme();
        this.notify();
    },

    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    subscribe(fn) {
        this.subscribers.push(fn);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== fn);
        };
    },

    notify() {
        this.subscribers.forEach(fn => fn(this));
    }
};

window.AppState = AppState;
