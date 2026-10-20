// Navigation: Responsive Sidebar & Top Navigation Bar
const Nav = {
    renderSidebar(container) {
        const role = AppState.role;
        const currentHash = window.location.hash.split('?')[0] || '#/dashboard';

        const links = [
            { header: 'Overview' },
            { hash: '#/dashboard', label: 'Dashboard', icon: 'barChart', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },

            { header: 'Operations' },
            { hash: '#/vehicles', label: 'Fleet Inventory', icon: 'car', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
            { hash: '#/bookings', label: 'Bookings & Trips', icon: 'calendar', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
            { hash: '#/new-booking', label: 'New Reservation', icon: 'plus', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
            { hash: '#/dispatch-desk', label: 'Dispatch Desk', icon: 'key', roles: ['ADMIN', 'STAFF'] },

            { header: 'Financial & Services' },
            { hash: '#/invoices', label: 'Billing & Invoices', icon: 'fileText', roles: ['ADMIN', 'STAFF', 'CUSTOMER'] },
            { hash: '#/payments', label: 'Payment Records', icon: 'creditCard', roles: ['ADMIN', 'STAFF'] },
            { hash: '#/maintenance', label: 'Maintenance Bay', icon: 'wrench', roles: ['ADMIN', 'STAFF'] },
            { hash: '#/reports', label: 'Reports & Analytics', icon: 'barChart', roles: ['ADMIN', 'STAFF'] },

            { header: 'Administration' },
            { hash: '#/customers', label: 'Customer Directory', icon: 'users', roles: ['ADMIN', 'STAFF'] },
            { hash: '#/users', label: 'Users & Roles', icon: 'shield', roles: ['ADMIN'] },
            { hash: '#/settings', label: 'System Settings', icon: 'settings', roles: ['ADMIN'] }
        ];

        const navItemsHtml = links.map(item => {
            if (item.header) {
                return `<div class="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">${item.header}</div>`;
            }

            if (!item.roles.includes(role)) {
                return ''; // Not permitted
            }

            const isActive = currentHash === item.hash;

            return `
                <a href="${item.hash}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }">
                    <span class="flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}">${window.getIcon(item.icon, 'w-4 h-4')}</span>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        container.innerHTML = `
            <div class="h-full flex flex-col justify-between p-4 bg-[var(--card-bg)] border-r border-[var(--border)]">
                <div class="space-y-4">
                    <!-- Brand -->
                    <div class="flex items-center gap-3 px-2 py-2">
                        <div class="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md">
                            ${window.getIcon('car', 'w-5 h-5')}
                        </div>
                        <div>
                            <span class="font-black text-base tracking-tight text-[var(--text-main)] block">FleetDesk</span>
                            <span class="text-[9px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-extrabold block">Fleet Management ERP</span>
                        </div>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="space-y-1">
                        ${navItemsHtml}
                    </nav>
                </div>

                <!-- User Profile Footbar -->
                <div class="pt-4 border-t border-[var(--border)]">
                    <a href="#/profile" class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div class="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            ${(AppState.user?.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="font-bold text-xs text-[var(--text-main)] truncate block">${AppState.user?.customer?.full_name || AppState.user?.staff?.full_name || AppState.user?.username || 'User'}</span>
                            <span class="text-[10px] text-slate-400 block">${AppState.role}</span>
                        </div>
                    </a>
                </div>
            </div>
        `;
    },

    renderNavbar(container, title = 'FleetDesk') {
        container.innerHTML = `
            <header class="h-16 px-6 bg-[var(--card-bg)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-30">
                <div class="flex items-center gap-4">
                    <!-- Mobile Hamburger -->
                    <button id="mobile-menu-toggle" class="md:hidden text-slate-500 hover:text-slate-800 focus:outline-none">
                        ${window.getIcon('menu', 'w-6 h-6')}
                    </button>
                    <span class="font-extrabold text-sm text-[var(--text-main)]">${title}</span>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Current Role Badge -->
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                        AppState.role === 'ADMIN' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300' :
                        AppState.role === 'STAFF' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                    }">
                        Role: ${AppState.role || 'GUEST'}
                    </span>

                    <!-- Theme Toggle -->
                    <button id="theme-toggle-btn" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Light/Dark Theme">
                        ${window.getIcon(AppState.theme === 'dark' ? 'sun' : 'moon', 'w-4 h-4')}
                    </button>

                    <!-- Logout Button -->
                    <button id="logout-btn" class="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors" title="Sign Out">
                        ${window.getIcon('logOut', 'w-4 h-4')}
                    </button>
                </div>
            </header>
        `;

        container.querySelector('#theme-toggle-btn').addEventListener('click', () => {
            AppState.toggleTheme();
            this.renderNavbar(container, title);
        });

        container.querySelector('#logout-btn').addEventListener('click', async () => {
            await API.logout();
            AppState.clearAuth();
            Toast.info('Signed out successfully.');
            window.location.hash = '#/login';
        });

        const mobileBtn = container.querySelector('#mobile-menu-toggle');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar-container');
                sidebar.classList.toggle('-translate-x-full');
            });
        }
    }
};

window.Nav = Nav;
