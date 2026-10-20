// Authentication Views: Login and Customer Registration
const AuthViews = {
    renderLogin(container) {
        container.innerHTML = `
            <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8 bg-[var(--card-bg)] p-8 rounded-2xl border border-[var(--border)] shadow-xl">
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-900 text-white mb-4 shadow-md">
                            ${window.getIcon('car', 'w-8 h-8')}
                        </div>
                        <h2 class="text-2xl font-extrabold text-[var(--text-main)]">FleetDesk</h2>
                        <p class="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold mt-1">Smart Vehicle Rental & Fleet Management</p>
                        <p class="text-sm text-slate-500 mt-2">Sign in to your account</p>
                    </div>

                    <!-- Quick Demo Role Switcher -->
                    <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3">
                        <span class="text-xs font-semibold text-blue-900 dark:text-blue-300 block mb-2">⚡ Quick Demo Login (KTU PBL PBCST304):</span>
                        <div class="grid grid-cols-3 gap-2">
                            <button id="quick-admin" class="px-2 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded shadow transition-colors">Admin</button>
                            <button id="quick-staff" class="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded shadow transition-colors">Staff</button>
                            <button id="quick-cust" class="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded shadow transition-colors">Customer</button>
                        </div>
                    </div>

                    <form id="login-form" class="mt-6 space-y-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Username or Email</label>
                            <input type="text" id="login-username" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="admin@fleetdesk.com" />
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
                            <input type="password" id="login-password" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="••••••••" />
                        </div>
                        <button type="submit" id="login-submit-btn" class="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2">
                            <span>Sign In</span>
                        </button>
                    </form>

                    <div class="text-center pt-2 border-t border-[var(--border)]">
                        <p class="text-xs text-slate-500">
                            New customer? <a href="#/register" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Register an account</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Wire quick buttons
        const userInput = container.querySelector('#login-username');
        const passInput = container.querySelector('#login-password');

        container.querySelector('#quick-admin').addEventListener('click', () => {
            userInput.value = 'admin@fleetdesk.com';
            passInput.value = 'Admin@123';
        });
        container.querySelector('#quick-staff').addEventListener('click', () => {
            userInput.value = 'staff@fleetdesk.com';
            passInput.value = 'Staff@123';
        });
        container.querySelector('#quick-cust').addEventListener('click', () => {
            userInput.value = 'rahul.sharma@example.com';
            passInput.value = 'Customer@123';
        });

        // Submit form
        container.querySelector('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = container.querySelector('#login-submit-btn');
            btn.disabled = true;
            btn.innerHTML = 'Signing in...';

            try {
                const res = await API.login(userInput.value.trim(), passInput.value);
                AppState.setAuth(res.user, res.token);
                Toast.success(`Welcome back, ${res.user.customer?.full_name || res.user.staff?.full_name || res.user.username}!`);
                window.location.hash = '#/dashboard';
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = 'Sign In';
                Toast.error(err.message || 'Login failed.');
            }
        });
    },

    renderRegister(container) {
        container.innerHTML = `
            <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-xl w-full space-y-6 bg-[var(--card-bg)] p-8 rounded-2xl border border-[var(--border)] shadow-xl">
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900 text-white mb-3 shadow-md">
                            ${window.getIcon('user', 'w-6 h-6')}
                        </div>
                        <h2 class="text-2xl font-extrabold text-[var(--text-main)]">Customer Registration</h2>
                        <p class="text-sm text-slate-500 mt-1">Create an account to reserve vehicles instantly</p>
                    </div>

                    <form id="register-form" class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Username *</label>
                                <input type="text" id="reg-username" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="johndoe" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Email Address *</label>
                                <input type="email" id="reg-email" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="john@example.com" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Full Legal Name *</label>
                                <input type="text" id="reg-fullname" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Johnathan Doe" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Phone Number *</label>
                                <input type="tel" id="reg-phone" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="+91 98765 43210" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Residential Address *</label>
                            <textarea id="reg-address" required rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Street, Building, City, State, PIN"></textarea>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Driving Licence Number *</label>
                                <input type="text" id="reg-licence" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="KL-07-20220011223" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Licence Expiry Date *</label>
                                <input type="date" id="reg-expiry" required class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Account Password *</label>
                            <input type="password" id="reg-password" required minlength="6" class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" placeholder="Minimum 6 characters" />
                        </div>

                        <button type="submit" id="reg-submit-btn" class="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-sm rounded-lg shadow transition-colors">
                            Complete Registration
                        </button>
                    </form>

                    <div class="text-center pt-2 border-t border-[var(--border)]">
                        <p class="text-xs text-slate-500">
                            Already registered? <a href="#/login" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Log in here</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Set default minimum expiry to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        container.querySelector('#reg-expiry').min = tomorrow.toISOString().slice(0, 10);

        container.querySelector('#register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = container.querySelector('#reg-submit-btn');
            btn.disabled = true;
            btn.innerHTML = 'Registering...';

            const payload = {
                username: container.querySelector('#reg-username').value.trim(),
                email: container.querySelector('#reg-email').value.trim(),
                fullName: container.querySelector('#reg-fullname').value.trim(),
                phone: container.querySelector('#reg-phone').value.trim(),
                address: container.querySelector('#reg-address').value.trim(),
                drivingLicenceNumber: container.querySelector('#reg-licence').value.trim().toUpperCase(),
                licenceExpiryDate: container.querySelector('#reg-expiry').value,
                password: container.querySelector('#reg-password').value
            };

            try {
                const res = await API.register(payload);
                AppState.setAuth(res.user, res.token);
                Toast.success('Account created successfully! Welcome to FleetDesk.');
                window.location.hash = '#/dashboard';
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = 'Complete Registration';
                Toast.error(err.message || 'Registration failed.');
            }
        });
    }
};

window.AuthViews = AuthViews;
