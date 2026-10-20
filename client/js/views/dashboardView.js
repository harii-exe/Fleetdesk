// Executive Dashboard View
const DashboardView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Page Title -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Operations Dashboard</h1>
                        <p class="text-xs text-slate-500 mt-1">Live telematics and rental fleet performance overview</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live System Active
                        </span>
                        <a href="#/new-booking" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                            ${window.getIcon('plus', 'w-4 h-4')}
                            <span>New Reservation</span>
                        </a>
                    </div>
                </div>

                <div id="dashboard-loading" class="py-16 text-center text-slate-400">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                    <p class="text-xs mt-2 font-medium">Computing metrics from database...</p>
                </div>

                <div id="dashboard-content" class="space-y-6 hidden">
                    <!-- Stat Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stat-cards"></div>

                    <!-- Charts Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 fleet-card p-5">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="font-bold text-sm text-[var(--text-main)]">Monthly Revenue Trend (INR)</h3>
                                    <p class="text-[11px] text-slate-400">Net revenue collected after discounts & refunds</p>
                                </div>
                                <span class="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-md">FY 2026-27</span>
                            </div>
                            <div id="revenue-chart-container" class="h-60 w-full flex items-center justify-center"></div>
                        </div>

                        <div class="fleet-card p-5 flex flex-col justify-between">
                            <div class="mb-2">
                                <h3 class="font-bold text-sm text-[var(--text-main)]">Fleet Category Mix</h3>
                                <p class="text-[11px] text-slate-400">Active operational vehicle distribution</p>
                            </div>
                            <div id="category-donut-container" class="py-2"></div>
                            <div class="pt-3 border-t border-[var(--border)] text-center">
                                <a href="#/vehicles" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Manage Fleet Inventory &rarr;</a>
                            </div>
                        </div>
                    </div>

                    <!-- Operational Tables Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Recent Bookings Table (2 Columns) -->
                        <div class="lg:col-span-2 fleet-card p-5">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="font-bold text-sm text-[var(--text-main)]">Recent Bookings & Reservations</h3>
                                    <p class="text-[11px] text-slate-400">Latest date-based customer bookings</p>
                                </div>
                                <a href="#/bookings" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View All &rarr;</a>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead>
                                        <tr class="border-b border-[var(--border)] text-slate-400 uppercase tracking-wider font-semibold">
                                            <th class="py-2.5 px-3">Reference</th>
                                            <th class="py-2.5 px-3">Customer</th>
                                            <th class="py-2.5 px-3">Vehicle</th>
                                            <th class="py-2.5 px-3">Pickup</th>
                                            <th class="py-2.5 px-3">Daily Rate</th>
                                            <th class="py-2.5 px-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recent-bookings-tbody" class="divide-y divide-[var(--border)]"></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Maintenance & Alert Notifications (1 Column) -->
                        <div class="fleet-card p-5">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="font-bold text-sm text-[var(--text-main)]">Maintenance Bay</h3>
                                    <p class="text-[11px] text-slate-400">Vehicles currently in service</p>
                                </div>
                                <a href="#/maintenance" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Manage &rarr;</a>
                            </div>
                            <div id="maintenance-alerts-list" class="space-y-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            // Customer role optimization: if customer, load bookings directly or dashboard
            let metrics = null;
            if (AppState.role === 'ADMIN' || AppState.role === 'STAFF') {
                const res = await API.getDashboardMetrics();
                metrics = res.data;
            } else {
                // Fetch customer's personal bookings
                const bRes = await API.getBookings();
                const vRes = await API.getVehicles();
                const totalFleet = vRes.data?.length || 0;
                const custBookings = bRes.data || [];

                metrics = {
                    fleet: {
                        total: totalFleet,
                        available: vRes.data.filter(v => v.operational_status === 'AVAILABLE').length,
                        rented: custBookings.filter(b => b.status === 'ACTIVE').length,
                        maintenance: 0,
                        utilisationRate: 65
                    },
                    bookings: {
                        total: custBookings.length,
                        active: custBookings.filter(b => b.status === 'ACTIVE').length,
                        confirmed: custBookings.filter(b => b.status === 'CONFIRMED').length,
                        overdue: custBookings.filter(b => b.status === 'OVERDUE').length,
                        completed: custBookings.filter(b => b.status === 'COMPLETED').length
                    },
                    financials: {
                        netRevenue: custBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
                        outstandingBalance: custBookings.reduce((sum, b) => sum + (Number(b.outstanding_balance) || 0), 0)
                    },
                    categoryDistribution: [
                        { category: 'CAR', count: 4 },
                        { category: 'SUV', count: 4 },
                        { category: 'BIKE', count: 4 },
                        { category: 'ELECTRIC_VEHICLE', count: 3 }
                    ],
                    recentBookings: custBookings.slice(0, 6),
                    maintenanceAlerts: [],
                    monthlyRevenue: [
                        { month: 'May 2026', revenue: 1500, bookings: 1 },
                        { month: 'Jun 2026', revenue: 2200, bookings: 1 },
                        { month: 'Jul 2026', revenue: 3800, bookings: 2 },
                        { month: 'Aug 2026', revenue: 4500, bookings: 2 },
                        { month: 'Sep 2026', revenue: 4050, bookings: 2 },
                        { month: 'Oct 2026', revenue: 4400, bookings: 2 }
                    ]
                };
            }

            container.querySelector('#dashboard-loading').classList.add('hidden');
            container.querySelector('#dashboard-content').classList.remove('hidden');

            // Render Stat Cards
            const statCardsEl = container.querySelector('#stat-cards');
            statCardsEl.innerHTML = `
                <div class="fleet-card p-4 flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-500 font-medium">Available Fleet</p>
                        <h4 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">${metrics.fleet.available} <span class="text-xs font-normal text-slate-400">/ ${metrics.fleet.total}</span></h4>
                        <span class="text-[11px] text-emerald-600 font-medium mt-1 inline-block">● Ready for reservation</span>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center">
                        ${window.getIcon('car', 'w-5 h-5')}
                    </div>
                </div>

                <div class="fleet-card p-4 flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-500 font-medium">Active Rentals</p>
                        <h4 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">${metrics.bookings.active}</h4>
                        <span class="text-[11px] text-sky-600 font-medium mt-1 inline-block">● On the road</span>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                        ${window.getIcon('key', 'w-5 h-5')}
                    </div>
                </div>

                <div class="fleet-card p-4 flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-500 font-medium">Overdue Returns</p>
                        <h4 class="text-2xl font-bold ${metrics.bookings.overdue > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'} mt-1">${metrics.bookings.overdue}</h4>
                        <span class="text-[11px] ${metrics.bookings.overdue > 0 ? 'text-rose-500' : 'text-slate-400'} font-medium mt-1 inline-block">● Late penalty 1.5x active</span>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                        ${window.getIcon('clock', 'w-5 h-5')}
                    </div>
                </div>

                <div class="fleet-card p-4 flex items-center justify-between">
                    <div>
                        <p class="text-xs text-slate-500 font-medium">Net Revenue Collected</p>
                        <h4 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">₹${metrics.financials.netRevenue.toLocaleString()}</h4>
                        <span class="text-[11px] text-amber-600 font-medium mt-1 inline-block">Outstanding: ₹${metrics.financials.outstandingBalance.toLocaleString()}</span>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        ${window.getIcon('dollarSign', 'w-5 h-5')}
                    </div>
                </div>
            `;

            // Render Charts
            Charts.renderRevenueLineChart(metrics.monthlyRevenue, 'revenue-chart-container');
            Charts.renderCategoryDonut(metrics.categoryDistribution, 'category-donut-container');

            // Render Recent Bookings Table
            const tbody = container.querySelector('#recent-bookings-tbody');
            if (!metrics.recentBookings || metrics.recentBookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">No bookings recorded yet.</td></tr>`;
            } else {
                tbody.innerHTML = metrics.recentBookings.map(b => `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td class="py-2.5 px-3 font-semibold text-blue-900 dark:text-blue-300">
                            <a href="#/bookings/${b.id}" class="hover:underline">${b.booking_reference}</a>
                        </td>
                        <td class="py-2.5 px-3 font-medium">${b.customer_name || 'N/A'}</td>
                        <td class="py-2.5 px-3">
                            <span class="font-medium">${b.brand || b.vehicle_brand || ''} ${b.model || b.vehicle_model || ''}</span>
                            <span class="text-[10px] text-slate-400 block">${b.registration_number || ''}</span>
                        </td>
                        <td class="py-2.5 px-3 text-slate-500">${b.pickup_datetime?.slice(0, 16) || ''}</td>
                        <td class="py-2.5 px-3 font-semibold">₹${Number(b.agreed_daily_rate).toLocaleString()}</td>
                        <td class="py-2.5 px-3 text-right">
                            <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                        </td>
                    </tr>
                `).join('');
            }

            // Render Maintenance Bay
            const maintList = container.querySelector('#maintenance-alerts-list');
            if (!metrics.maintenanceAlerts || metrics.maintenanceAlerts.length === 0) {
                maintList.innerHTML = `
                    <div class="py-6 text-center text-slate-400 text-xs">
                        ${window.getIcon('checkCircle', 'w-8 h-8 mx-auto text-emerald-500 mb-2')}
                        All operational vehicles are fully serviced!
                    </div>
                `;
            } else {
                maintList.innerHTML = metrics.maintenanceAlerts.map(m => `
                    <div class="p-3 rounded-lg border border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/50 flex items-start gap-3">
                        <div class="w-8 h-8 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            ${window.getIcon('wrench', 'w-4 h-4')}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <span class="font-semibold text-xs text-[var(--text-main)] truncate">${m.brand} ${m.model}</span>
                                <span class="badge badge-${m.status.toLowerCase()}">${m.status}</span>
                            </div>
                            <p class="text-[11px] text-slate-500 mt-0.5">${m.service_type}</p>
                            <span class="text-[10px] text-slate-400 mt-1 block">Scheduled: ${m.start_date} | Est: ₹${Number(m.cost).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('');
            }

        } catch (err) {
            container.querySelector('#dashboard-loading').innerHTML = `
                <div class="p-4 bg-rose-50 text-rose-700 rounded-lg max-w-md mx-auto text-xs">
                    Failed to load dashboard metrics: ${err.message}
                </div>
            `;
        }
    }
};

window.DashboardView = DashboardView;
