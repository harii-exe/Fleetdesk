// Maintenance & Fleet Service Management View
const MaintenanceView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Fleet Maintenance & Service Bay</h1>
                        <p class="text-xs text-slate-500 mt-1">Vehicle health, scheduled checkups, and workshop expenditure tracking</p>
                    </div>
                    <div>
                        <button id="add-maintenance-btn" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                            ${window.getIcon('plus', 'w-4 h-4')}
                            <span>Schedule Service</span>
                        </button>
                    </div>
                </div>

                <!-- Maintenance Records Table -->
                <div class="fleet-card overflow-hidden">
                    <div id="maint-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading maintenance bay...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="maint-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">Vehicle</th>
                                    <th class="py-3 px-4">Service Type</th>
                                    <th class="py-3 px-4">Start Date</th>
                                    <th class="py-3 px-4">Completion Date</th>
                                    <th class="py-3 px-4">Service Center</th>
                                    <th class="py-3 px-4">Cost (INR)</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="maint-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents(container);
        await this.loadRecords(container);
    },

    attachEvents(container) {
        container.querySelector('#add-maintenance-btn').addEventListener('click', () => {
            this.showScheduleModal(container);
        });
    },

    async loadRecords(container) {
        const loadingEl = container.querySelector('#maint-loading');
        const tbody = container.querySelector('#maint-tbody');

        try {
            const res = await API.getMaintenance();
            const records = res.data || [];

            loadingEl.classList.add('hidden');

            if (records.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 text-xs">No maintenance records logged.</td></tr>`;
                return;
            }

            tbody.innerHTML = records.map(r => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                        <span class="font-bold text-slate-800 dark:text-slate-200 block">${r.brand} ${r.model}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${r.registration_number}</span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="font-semibold text-slate-700 dark:text-slate-300 block">${r.service_type}</span>
                        <span class="text-[11px] text-slate-400 truncate max-w-xs block">${r.description}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${r.start_date}</td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${r.completion_date || '<span class="text-amber-500 font-semibold">In Progress</span>'}</td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${r.service_center || 'In-House Bay'}</td>
                    <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">₹${Number(r.cost).toLocaleString()}</td>
                    <td class="py-3 px-4">
                        <span class="badge badge-${r.status.toLowerCase()}">${r.status}</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        ${r.status !== 'COMPLETED' ? `
                            <button data-id="${r.id}" data-curr="${r.status}" class="update-maint-status-btn px-2.5 py-1 text-xs font-semibold bg-blue-900 text-white rounded-md shadow hover:bg-blue-950 transition-colors">
                                Update Status
                            </button>
                        ` : `
                            <span class="text-[11px] text-slate-400 italic">Completed</span>
                        `}
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.update-maint-status-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.showUpdateModal(container, btn.dataset.id, btn.dataset.curr);
                });
            });

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading maintenance: ${err.message}</p>`;
        }
    },

    async showScheduleModal(container) {
        let vehicles = [];
        try {
            const vRes = await API.getVehicles();
            vehicles = vRes.data || [];
        } catch(e) {}

        const formHtml = `
            <div class="space-y-3 text-xs">
                <div>
                    <label class="block font-medium mb-1">Select Fleet Vehicle *</label>
                    <select id="m-veh" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                        ${vehicles.map(v => `<option value="${v.id}">${v.brand} ${v.model} (${v.registration_number})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block font-medium mb-1">Service Job Type *</label>
                    <input type="text" id="m-type" required placeholder="10,000 KM Periodic Service, Brake Pad Replacement, etc." class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Detailed Description *</label>
                    <textarea id="m-desc" rows="2" required placeholder="Oil change, suspension overhaul, fluid levels check" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1">Estimated Cost (₹)</label>
                        <input type="number" id="m-cost" value="2500" min="0" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Start Date *</label>
                        <input type="date" id="m-start" value="${new Date().toISOString().slice(0, 10)}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-1">Service Workshop / Bay</label>
                    <input type="text" id="m-center" placeholder="Authorized Brand Service Center / FleetDesk Central Bay" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                </div>
                <div class="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="m-take-down" checked class="rounded" />
                    <label for="m-take-down" class="text-slate-600 dark:text-slate-300">Set vehicle operational status to MAINTENANCE immediately</label>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Schedule Vehicle Maintenance',
            content: formHtml,
            confirmText: 'Schedule Service',
            onConfirm: async () => {
                await API.createMaintenance({
                    vehicleId: document.getElementById('m-veh').value,
                    serviceType: document.getElementById('m-type').value.trim(),
                    description: document.getElementById('m-desc').value.trim(),
                    cost: parseFloat(document.getElementById('m-cost').value) || 0,
                    startDate: document.getElementById('m-start').value,
                    serviceCenter: document.getElementById('m-center').value.trim(),
                    setVehicleStatus: document.getElementById('m-take-down').checked
                });
                Toast.success('Maintenance scheduled successfully!');
                await this.loadRecords(container);
            }
        });
    },

    showUpdateModal(container, recordId, currentStatus) {
        const formHtml = `
            <div class="space-y-3 text-xs">
                <div>
                    <label class="block font-medium mb-1">Target Status *</label>
                    <select id="u-status" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                        <option value="IN_PROGRESS" ${currentStatus === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS - Work undergoing in bay</option>
                        <option value="COMPLETED">COMPLETED - Service done, ready for return-to-service check</option>
                    </select>
                </div>
                <div>
                    <label class="block font-medium mb-1">Actual Final Workshop Cost (₹)</label>
                    <input type="number" id="u-cost" placeholder="Reconciled service bill" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Technician / Inspection Notes</label>
                    <textarea id="u-notes" rows="2" placeholder="Quality check done, oil pressure normal, test driven" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none"></textarea>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Update Maintenance Job Status',
            content: formHtml,
            confirmText: 'Save Update',
            onConfirm: async () => {
                const status = document.getElementById('u-status').value;
                const cost = document.getElementById('u-cost').value ? parseFloat(document.getElementById('u-cost').value) : undefined;
                const notes = document.getElementById('u-notes').value.trim();

                await API.updateMaintenanceStatus(recordId, {
                    status,
                    cost,
                    technicianNotes: notes
                });
                Toast.success(`Maintenance record updated to ${status}.`);
                await this.loadRecords(container);
            }
        });
    }
};

window.MaintenanceView = MaintenanceView;
