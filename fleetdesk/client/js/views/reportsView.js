// Comprehensive Reports & Executive Business Analytics View
const ReportsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Reports & Business Analytics</h1>
                        <p class="text-xs text-slate-500 mt-1">Fleet utilisation, financial audits, customer activity, and CSV export utilities</p>
                    </div>

                    <!-- CSV Export Menu -->
                    <div class="flex items-center gap-2">
                        <button id="export-vehicles-csv" class="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                            ${window.getIcon('download', 'w-3.5 h-3.5')}
                            <span>Fleet CSV</span>
                        </button>
                        <button id="export-bookings-csv" class="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                            ${window.getIcon('download', 'w-3.5 h-3.5')}
                            <span>Bookings CSV</span>
                        </button>
                        <button id="export-revenue-csv" class="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5">
                            ${window.getIcon('download', 'w-3.5 h-3.5')}
                            <span>Revenue CSV</span>
                        </button>
                    </div>
                </div>

                <div id="reports-loading" class="py-16 text-center text-slate-400">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                    <p class="text-xs mt-2 font-medium">Computing financial analytics...</p>
                </div>

                <div id="reports-content" class="space-y-6 hidden">
                    <!-- Key KPI Banner -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="report-kpis"></div>

                    <!-- Two Detailed Leaderboard Tables -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Top Rented Vehicles -->
                        <div class="fleet-card p-5">
                            <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Most Frequently Rented Vehicles</h3>
                            <p class="text-[11px] text-slate-400 mb-4">Ranked by total completed booking contracts</p>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead>
                                        <tr class="border-b border-[var(--border)] text-slate-500 uppercase font-semibold">
                                            <th class="py-2 px-3">Vehicle</th>
                                            <th class="py-2 px-3">Category</th>
                                            <th class="py-2 px-3 text-center">Bookings</th>
                                            <th class="py-2 px-3 text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody id="top-vehicles-tbody" class="divide-y divide-[var(--border)]"></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Most Active Customers -->
                        <div class="fleet-card p-5">
                            <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Top Active Customers</h3>
                            <p class="text-[11px] text-slate-400 mb-4">Ranked by volume of completed reservations</p>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead>
                                        <tr class="border-b border-[var(--border)] text-slate-500 uppercase font-semibold">
                                            <th class="py-2 px-3">Customer</th>
                                            <th class="py-2 px-3">Contact</th>
                                            <th class="py-2 px-3 text-center">Trips</th>
                                            <th class="py-2 px-3 text-right">Total Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody id="top-customers-tbody" class="divide-y divide-[var(--border)]"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Maintenance Expenditure by Category -->
                    <div class="fleet-card p-5">
                        <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Maintenance Expenditure by Vehicle Category</h3>
                        <p class="text-[11px] text-slate-400 mb-4">Cumulative workshop spending across vehicle classes</p>
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" id="maint-exp-grid"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachCsvEvents(container);
        await this.loadReports(container);
    },

    attachCsvEvents(container) {
        const triggerDownload = async (type) => {
            try {
                Toast.info(`Generating ${type} report CSV...`);
                const res = await API.exportReportCsv(type);
                if (res.csv) {
                    const blob = new Blob([res.csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fleetdesk_${type}_export.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    Toast.success(`Downloaded ${type} CSV export!`);
                }
            } catch (err) {
                Toast.error(`Export failed: ${err.message}`);
            }
        };

        container.querySelector('#export-vehicles-csv').addEventListener('click', () => triggerDownload('vehicles'));
        container.querySelector('#export-bookings-csv').addEventListener('click', () => triggerDownload('bookings'));
        container.querySelector('#export-revenue-csv').addEventListener('click', () => triggerDownload('revenue'));
    },

    async loadReports(container) {
        try {
            const [dashRes, detailRes] = await Promise.all([
                API.getDashboardMetrics(),
                API.getDetailedReports()
            ]);

            const d = dashRes.data;
            const det = detailRes.data;

            container.querySelector('#reports-loading').classList.add('hidden');
            container.querySelector('#reports-content').classList.remove('hidden');

            // Render KPIs
            container.querySelector('#report-kpis').innerHTML = `
                <div class="fleet-card p-4">
                    <span class="text-xs text-slate-500 font-medium">Fleet Utilisation</span>
                    <h4 class="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">${d.fleet.utilisationRate}%</h4>
                    <span class="text-[11px] text-slate-400">Rented vs available operational hours</span>
                </div>
                <div class="fleet-card p-4">
                    <span class="text-xs text-slate-500 font-medium">Gross Revenue</span>
                    <h4 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">₹${Number(d.financials.grossRevenue).toLocaleString()}</h4>
                    <span class="text-[11px] text-emerald-600 font-medium">Total successful receipts</span>
                </div>
                <div class="fleet-card p-4">
                    <span class="text-xs text-slate-500 font-medium">Refunds & Adjustments</span>
                    <h4 class="text-2xl font-bold text-amber-600 mt-1">₹${Number(d.financials.totalRefunds).toLocaleString()}</h4>
                    <span class="text-[11px] text-slate-400">Auditable returned credits</span>
                </div>
                <div class="fleet-card p-4">
                    <span class="text-xs text-slate-500 font-medium">Outstanding Balances</span>
                    <h4 class="text-2xl font-bold text-rose-600 mt-1">₹${Number(d.financials.outstandingBalance).toLocaleString()}</h4>
                    <span class="text-[11px] text-slate-400">Accounts receivable</span>
                </div>
            `;

            // Render Top Vehicles
            const vTbody = container.querySelector('#top-vehicles-tbody');
            vTbody.innerHTML = (det.topVehicles || []).map(v => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td class="py-2.5 px-3">
                        <span class="font-bold text-slate-800 dark:text-slate-200 block">${v.brand} ${v.model}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${v.registration_number}</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">${v.category}</td>
                    <td class="py-2.5 px-3 text-center font-bold text-blue-900 dark:text-blue-300">${v.bookingCount}</td>
                    <td class="py-2.5 px-3 text-right font-semibold">₹${Number(v.totalRentalRevenue).toLocaleString()}</td>
                </tr>
            `).join('');

            // Render Top Customers
            const cTbody = container.querySelector('#top-customers-tbody');
            cTbody.innerHTML = (det.topCustomers || []).map(c => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${c.full_name}</td>
                    <td class="py-2.5 px-3 text-slate-500">${c.phone}</td>
                    <td class="py-2.5 px-3 text-center font-bold text-blue-900 dark:text-blue-300">${c.bookingCount}</td>
                    <td class="py-2.5 px-3 text-right font-semibold text-emerald-600">₹${Number(c.totalSpent).toLocaleString()}</td>
                </tr>
            `).join('');

            // Render Maintenance Expenditure Grid
            const mGrid = container.querySelector('#maint-exp-grid');
            mGrid.innerHTML = (det.maintenanceExpenditure || []).map(m => `
                <div class="p-4 rounded-xl border border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${m.category}</span>
                    <h4 class="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">₹${Number(m.totalCost).toLocaleString()}</h4>
                    <span class="text-xs text-slate-500 mt-0.5 block">${m.serviceCount} service job${m.serviceCount > 1 ? 's' : ''} completed</span>
                </div>
            `).join('');

        } catch (err) {
            container.querySelector('#reports-loading').innerHTML = `
                <p class="text-rose-500 text-xs py-4">Error loading reports: ${err.message}</p>
            `;
        }
    }
};

window.ReportsView = ReportsView;
