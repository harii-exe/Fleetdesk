// Management Views: Customers, Users, Settings, Profile, Access Denied, 404

// 1. Customer Directory (Admin / Staff)
const CustomersView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Customer Profiles & Accounts</h1>
                        <p class="text-xs text-slate-500 mt-1">Driving licence records and customer rental history</p>
                    </div>
                    <div>
                        <button id="add-cust-btn" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                            ${window.getIcon('plus', 'w-4 h-4')}
                            <span>Register Customer</span>
                        </button>
                    </div>
                </div>

                <div class="fleet-card overflow-hidden">
                    <div id="cust-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading customer database...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="cust-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">Name</th>
                                    <th class="py-3 px-4">Contact</th>
                                    <th class="py-3 px-4">Driving Licence</th>
                                    <th class="py-3 px-4">Licence Expiry</th>
                                    <th class="py-3 px-4">Address</th>
                                    <th class="py-3 px-4">Account Status</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="cust-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const loadingEl = container.querySelector('#cust-loading');
        const tbody = container.querySelector('#cust-tbody');

        try {
            const res = await API.getCustomers();
            const customers = res.data || [];
            loadingEl.classList.add('hidden');

            tbody.innerHTML = customers.map(c => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">${c.full_name}</td>
                    <td class="py-3 px-4">
                        <span class="block">${c.phone}</span>
                        <span class="text-[10px] text-slate-400">${c.email}</span>
                    </td>
                    <td class="py-3 px-4 font-mono font-semibold text-blue-900 dark:text-blue-300">${c.driving_licence_number}</td>
                    <td class="py-3 px-4">${c.licence_expiry_date}</td>
                    <td class="py-3 px-4 text-slate-500 max-w-xs truncate">${c.address}</td>
                    <td class="py-3 px-4">
                        <span class="badge badge-${c.account_status.toLowerCase()}">${c.account_status}</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button data-id="${c.id}" class="view-cust-dossier-btn px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md">
                            Dossier &rarr;
                        </button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.view-cust-dossier-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const cData = await API.getCustomerById(btn.dataset.id);
                    const cust = cData.data;
                    Modal.show({
                        title: `Customer Dossier: ${cust.full_name}`,
                        content: `
                            <div class="space-y-4 text-xs">
                                <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div><b>Phone:</b> ${cust.phone}</div>
                                    <div><b>Email:</b> ${cust.email}</div>
                                    <div><b>Driving Licence:</b> ${cust.driving_licence_number}</div>
                                    <div><b>Licence Expiry:</b> ${cust.licence_expiry_date}</div>
                                    <div class="col-span-2"><b>Address:</b> ${cust.address}</div>
                                </div>
                                <h4 class="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Rental History (${cust.bookings?.length || 0} Bookings)</h4>
                                <div class="max-h-40 overflow-y-auto space-y-1.5">
                                    ${(cust.bookings || []).map(b => `
                                        <div class="flex justify-between p-2 border border-[var(--border)] rounded text-[11px]">
                                            <span class="font-mono font-bold">${b.booking_reference}</span>
                                            <span>${b.brand} ${b.model}</span>
                                            <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `,
                        confirmText: 'Close',
                        onConfirm: () => {}
                    });
                });
            });

            // Register Customer Button
            container.querySelector('#add-cust-btn').addEventListener('click', () => {
                window.location.hash = '#/register';
            });

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading customers: ${err.message}</p>`;
        }
    }
};

// 2. User & Role Management (Admin only)
const UsersView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">User Accounts & Roles</h1>
                        <p class="text-xs text-slate-500 mt-1">Manage system security, roles, and administrative staff profiles</p>
                    </div>
                    <div>
                        <button id="add-staff-btn" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                            ${window.getIcon('plus', 'w-4 h-4')}
                            <span>Add Staff Account</span>
                        </button>
                    </div>
                </div>

                <div class="fleet-card overflow-hidden">
                    <div id="users-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading user directory...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="users-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">User ID</th>
                                    <th class="py-3 px-4">Username</th>
                                    <th class="py-3 px-4">Email</th>
                                    <th class="py-3 px-4">Profile Name</th>
                                    <th class="py-3 px-4">Role</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const loadingEl = container.querySelector('#users-loading');
        const tbody = container.querySelector('#users-tbody');

        try {
            const res = await API.getUsers();
            const users = res.data || [];
            loadingEl.classList.add('hidden');

            tbody.innerHTML = users.map(u => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td class="py-3 px-4 font-mono font-bold text-slate-400">#${u.id}</td>
                    <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">${u.username}</td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${u.email}</td>
                    <td class="py-3 px-4">${u.customer_name || u.staff_name || 'System Admin'}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            u.role === 'STAFF' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }">
                            ${u.role}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="badge badge-${u.status.toLowerCase()}">${u.status}</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        ${u.id !== AppState.user.id ? `
                            <button data-id="${u.id}" data-status="${u.status}" class="toggle-user-status-btn px-2.5 py-1 text-xs font-semibold rounded-md border ${u.status === 'ACTIVE' ? 'border-rose-300 text-rose-600 hover:bg-rose-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}">
                                ${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                        ` : '<span class="text-xs text-slate-400 italic">Current User</span>'}
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.toggle-user-status-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const newStatus = btn.dataset.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                    await API.updateUserStatus(btn.dataset.id, newStatus);
                    Toast.success(`User status updated to ${newStatus}.`);
                    this.render(container);
                });
            });

            // Create Staff Modal
            container.querySelector('#add-staff-btn').addEventListener('click', () => {
                const formHtml = `
                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="block font-medium mb-1">Employee Code *</label>
                            <input type="text" id="st-code" placeholder="FD-STAFF-103" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                        </div>
                        <div>
                            <label class="block font-medium mb-1">Full Legal Name *</label>
                            <input type="text" id="st-name" placeholder="Staff Name" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-medium mb-1">Username *</label>
                                <input type="text" id="st-user" placeholder="staff3" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-medium mb-1">Email *</label>
                                <input type="email" id="st-email" placeholder="staff3@fleetdesk.com" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-medium mb-1">Temporary Password *</label>
                                <input type="password" id="st-pass" value="Staff@123" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-medium mb-1">Department</label>
                                <input type="text" id="st-dept" value="Operations" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>
                        </div>
                    </div>
                `;

                Modal.show({
                    title: 'Create Operational Staff Account',
                    content: formHtml,
                    confirmText: 'Create Account',
                    onConfirm: async () => {
                        await API.createStaff({
                            employeeCode: document.getElementById('st-code').value.trim(),
                            fullName: document.getElementById('st-name').value.trim(),
                            username: document.getElementById('st-user').value.trim(),
                            email: document.getElementById('st-email').value.trim(),
                            password: document.getElementById('st-pass').value,
                            department: document.getElementById('st-dept').value.trim()
                        });
                        Toast.success('Staff account created successfully!');
                        this.render(container);
                    }
                });
            });

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading users: ${err.message}</p>`;
        }
    }
};

// 3. Settings View (Admin)
const SettingsView = {
    async render(container) {
        container.innerHTML = `
            <div class="max-w-4xl space-y-6">
                <!-- Header -->
                <div class="pb-2 border-b border-[var(--border)]">
                    <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">System Settings & Business Rules</h1>
                    <p class="text-xs text-slate-500 mt-1">Configure pricing algorithms, late fee penalty multipliers, and audit logs</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Pricing Rules Card -->
                    <div class="md:col-span-2 fleet-card p-6">
                        <h3 class="font-bold text-sm text-[var(--text-main)] mb-4">Rental & Penalty Business Rules</h3>
                        <form id="settings-form" class="space-y-4 text-xs">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Overdue Penalty Multiplier *</label>
                                    <input type="number" id="s-multiplier" step="0.1" min="1.0" max="5.0" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent font-bold focus:outline-none" />
                                    <span class="text-[10px] text-slate-400 mt-1 block">Default: 1.5x daily tariff per late day</span>
                                </div>
                                <div>
                                    <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Standard Cancellation Fee (₹) *</label>
                                    <input type="number" id="s-cancelfee" step="50" min="0" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent font-bold focus:outline-none" />
                                    <span class="text-[10px] text-slate-400 mt-1 block">Charged for late customer cancellations</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Company Legal Name</label>
                                    <input type="text" id="s-company" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Support Telephone Hotline</label>
                                    <input type="text" id="s-phone" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Customer Support Email</label>
                                <input type="email" id="s-email" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>

                            <button type="submit" class="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg shadow transition-colors">
                                Save Business Rules
                            </button>
                        </form>
                    </div>

                    <!-- System Info Card -->
                    <div class="fleet-card p-6 flex flex-col justify-between text-xs space-y-4">
                        <div>
                            <h3 class="font-bold text-sm text-[var(--text-main)] mb-2">PBL Project Metadata</h3>
                            <div class="space-y-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                <p><b>Subject:</b> KTU PBCST304 (2024 Scheme)</p>
                                <p><b>System:</b> FleetDesk Smart Fleet ERP</p>
                                <p><b>Database:</b> SQLite 3 (node:sqlite) + MySQL 8 JPA</p>
                                <p><b>Architecture:</b> RESTful decoupled SPA</p>
                                <p><b>Status:</b> Fully Operational</p>
                            </div>
                        </div>
                        <div class="pt-4 border-t border-[var(--border)]">
                            <span class="text-[10px] text-slate-400 block font-mono">Build 2.4.0-KTU-RELEASE</span>
                        </div>
                    </div>
                </div>

                <!-- Audit Logs Viewer -->
                <div class="fleet-card p-6">
                    <h3 class="font-bold text-sm text-[var(--text-main)] mb-3">Security & System Audit Logs</h3>
                    <div class="max-h-64 overflow-y-auto" id="audit-logs-container">
                        <p class="text-xs text-slate-400">Loading audit trail...</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const [sRes, aRes] = await Promise.all([
                API.getSettings(),
                API.getAuditLogs()
            ]);

            const settings = sRes.data || {};
            container.querySelector('#s-multiplier').value = settings.penalty_multiplier || '1.5';
            container.querySelector('#s-cancelfee').value = settings.cancellation_fee || '200.00';
            container.querySelector('#s-company').value = settings.company_name || 'FleetDesk Mobility Pvt Ltd';
            container.querySelector('#s-phone').value = settings.support_phone || '+91 484 290 8800';
            container.querySelector('#s-email').value = settings.support_email || 'support@fleetdesk.com';

            // Wire form
            container.querySelector('#settings-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await API.updateSettings({
                    penaltyMultiplier: container.querySelector('#s-multiplier').value,
                    cancellationFee: container.querySelector('#s-cancelfee').value,
                    companyName: container.querySelector('#s-company').value,
                    supportPhone: container.querySelector('#s-phone').value,
                    supportEmail: container.querySelector('#s-email').value
                });
                Toast.success('Settings updated successfully.');
            });

            // Render Audit Logs
            const logs = aRes.data || [];
            const logsContainer = container.querySelector('#audit-logs-container');
            if (logs.length === 0) {
                logsContainer.innerHTML = '<p class="text-xs text-slate-400">No audit records recorded.</p>';
            } else {
                logsContainer.innerHTML = `
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="border-b border-[var(--border)] text-slate-400 uppercase font-semibold">
                                <th class="py-2 px-3">Timestamp</th>
                                <th class="py-2 px-3">User</th>
                                <th class="py-2 px-3">Action</th>
                                <th class="py-2 px-3">Details</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--border)]">
                            ${logs.map(l => `
                                <tr>
                                    <td class="py-2 px-3 text-slate-400 font-mono text-[10px]">${l.timestamp}</td>
                                    <td class="py-2 px-3 font-semibold">${l.username || 'System'}</td>
                                    <td class="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">${l.action}</td>
                                    <td class="py-2 px-3 text-slate-500">${l.details || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

        } catch (err) {
            console.error('Settings load error:', err);
        }
    }
};

// 4. Customer Profile View
const ProfileView = {
    async render(container) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-6">
                <div class="pb-2 border-b border-[var(--border)]">
                    <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Account Profile</h1>
                    <p class="text-xs text-slate-500 mt-1">Manage personal contact info and verified credentials</p>
                </div>

                <div class="fleet-card p-6" id="profile-card">
                    <p class="text-xs text-slate-400 py-6 text-center">Loading profile details...</p>
                </div>
            </div>
        `;

        try {
            const res = await API.getMe();
            const u = res.user;
            const c = u.customer;

            const card = container.querySelector('#profile-card');
            if (!c) {
                card.innerHTML = `
                    <div class="space-y-4 text-xs">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                                ${u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 class="font-bold text-base text-[var(--text-main)]">${u.staff?.full_name || u.username}</h3>
                                <p class="text-slate-400">${u.email} (${u.role})</p>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Customer Profile
            card.innerHTML = `
                <div class="space-y-6">
                    <div class="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
                        <div class="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                            ${c.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="font-bold text-base text-[var(--text-main)]">${c.full_name}</h3>
                            <p class="text-xs text-slate-400">${u.email} (Customer ID #${c.id})</p>
                        </div>
                    </div>

                    <form id="profile-edit-form" class="space-y-4 text-xs">
                        <div>
                            <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Full Legal Name</label>
                            <input type="text" id="p-name" value="${c.full_name}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
                                <input type="text" id="p-phone" value="${c.phone}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Driving Licence Number</label>
                                <input type="text" value="${c.driving_licence_number}" disabled class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" />
                            </div>
                        </div>
                        <div>
                            <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Residential Address</label>
                            <textarea id="p-addr" rows="2" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none">${c.address}</textarea>
                        </div>
                        <button type="submit" class="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg shadow transition-colors">
                            Update Contact Information
                        </button>
                    </form>
                </div>
            `;

            container.querySelector('#profile-edit-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await API.updateCustomer(c.id, {
                    fullName: container.querySelector('#p-name').value.trim(),
                    phone: container.querySelector('#p-phone').value.trim(),
                    address: container.querySelector('#p-addr').value.trim()
                });
                Toast.success('Profile details updated!');
            });

        } catch (err) {
            console.error('Profile load error:', err);
        }
    }
};

// 5. Access Denied (403)
const AccessDeniedView = {
    render(container) {
        container.innerHTML = `
            <div class="py-20 text-center max-w-md mx-auto">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mb-4">
                    ${window.getIcon('shield', 'w-8 h-8')}
                </div>
                <h2 class="text-2xl font-extrabold text-[var(--text-main)]">403 Access Denied</h2>
                <p class="text-xs text-slate-500 mt-2">
                    Your current authenticated role (<b>${AppState.role || 'GUEST'}</b>) is not authorized to access this module.
                </p>
                <div class="mt-6">
                    <a href="#/dashboard" class="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow transition-colors">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        `;
    }
};

// 6. Not Found (404)
const NotFoundView = {
    render(container) {
        container.innerHTML = `
            <div class="py-20 text-center max-w-md mx-auto">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                    ${window.getIcon('alertCircle', 'w-8 h-8')}
                </div>
                <h2 class="text-2xl font-extrabold text-[var(--text-main)]">404 Page Not Found</h2>
                <p class="text-xs text-slate-500 mt-2">The requested view does not exist or has been relocated.</p>
                <div class="mt-6">
                    <a href="#/dashboard" class="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow transition-colors">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        `;
    }
};

window.CustomersView = CustomersView;
window.UsersView = UsersView;
window.SettingsView = SettingsView;
window.ProfileView = ProfileView;
window.AccessDeniedView = AccessDeniedView;
window.NotFoundView = NotFoundView;
