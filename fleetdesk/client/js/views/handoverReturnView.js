// Staff Workstation: Vehicle Handover and Check-in Return Desk
const HandoverReturnView = {
    activeTab: 'dispatch', // 'dispatch' | 'checkin'

    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Fleet Dispatch & Check-in Desk</h1>
                        <p class="text-xs text-slate-500 mt-1">Staff operations console for recording physical vehicle handovers and customer returns</p>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex items-center gap-2 border-b border-[var(--border)]">
                    <button id="tab-dispatch" class="px-4 py-2 text-xs font-bold border-b-2 border-blue-900 text-blue-900 dark:text-blue-400">
                        Dispatch Desk (Pending Handovers)
                    </button>
                    <button id="tab-checkin" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        Check-in Desk (Active & Overdue Returns)
                    </button>
                </div>

                <!-- Content Area -->
                <div id="desk-content" class="min-h-[300px]">
                    <div class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading desk queue...</p>
                    </div>
                </div>
            </div>
        `;

        const tabDispatch = container.querySelector('#tab-dispatch');
        const tabCheckin = container.querySelector('#tab-checkin');

        tabDispatch.addEventListener('click', () => {
            this.activeTab = 'dispatch';
            tabDispatch.className = 'px-4 py-2 text-xs font-bold border-b-2 border-blue-900 text-blue-900 dark:text-blue-400';
            tabCheckin.className = 'px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
            this.loadDesk(container);
        });

        tabCheckin.addEventListener('click', () => {
            this.activeTab = 'checkin';
            tabCheckin.className = 'px-4 py-2 text-xs font-bold border-b-2 border-blue-900 text-blue-900 dark:text-blue-400';
            tabDispatch.className = 'px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
            this.loadDesk(container);
        });

        await this.loadDesk(container);
    },

    async loadDesk(container) {
        const deskContent = container.querySelector('#desk-content');
        try {
            const res = await API.getBookings();
            const bookings = res.data || [];

            if (this.activeTab === 'dispatch') {
                const pendingHandovers = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
                if (pendingHandovers.length === 0) {
                    deskContent.innerHTML = `
                        <div class="fleet-card py-16 text-center text-slate-400">
                            ${window.getIcon('checkCircle', 'w-10 h-10 mx-auto text-emerald-500 mb-2')}
                            <h4 class="font-bold text-sm text-[var(--text-main)]">No pending vehicle handovers</h4>
                            <p class="text-xs text-slate-500 mt-1">All confirmed customer bookings have been dispatched.</p>
                        </div>
                    `;
                    return;
                }

                deskContent.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${pendingHandovers.map(b => `
                            <div class="fleet-card p-5 flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                                        <span class="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">${b.booking_reference}</span>
                                        <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                                    </div>
                                    <div class="mt-3">
                                        <span class="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">${b.category}</span>
                                        <h3 class="font-bold text-base text-[var(--text-main)]">${b.brand} ${b.model}</h3>
                                        <span class="text-xs font-mono text-slate-400 font-semibold">${b.registration_number}</span>
                                    </div>
                                    <div class="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                                        <p><b>Customer:</b> ${b.customer_name} (${b.customer_phone})</p>
                                        <p><b>Pickup:</b> ${b.pickup_datetime}</p>
                                        <p><b>Return:</b> ${b.expected_return_datetime}</p>
                                    </div>
                                </div>
                                <div class="mt-4 pt-3 border-t border-[var(--border)]">
                                    <button data-id="${b.id}" class="dispatch-action-btn w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5">
                                        ${window.getIcon('key', 'w-4 h-4')}
                                        <span>Dispatch Vehicle Now</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                deskContent.querySelectorAll('.dispatch-action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        window.location.hash = `#/bookings/${btn.dataset.id}`;
                    });
                });

            } else {
                // Check-in Desk
                const awaitingReturns = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'OVERDUE');
                if (awaitingReturns.length === 0) {
                    deskContent.innerHTML = `
                        <div class="fleet-card py-16 text-center text-slate-400">
                            ${window.getIcon('checkCircle', 'w-10 h-10 mx-auto text-emerald-500 mb-2')}
                            <h4 class="font-bold text-sm text-[var(--text-main)]">No vehicles awaiting return</h4>
                            <p class="text-xs text-slate-500 mt-1">All active rentals are checked in or no trips are ongoing.</p>
                        </div>
                    `;
                    return;
                }

                deskContent.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${awaitingReturns.map(b => `
                            <div class="fleet-card p-5 flex flex-col justify-between ${b.status === 'OVERDUE' ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20' : ''}">
                                <div>
                                    <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                                        <span class="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">${b.booking_reference}</span>
                                        <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                                    </div>
                                    <div class="mt-3">
                                        <span class="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">${b.category}</span>
                                        <h3 class="font-bold text-base text-[var(--text-main)]">${b.brand} ${b.model}</h3>
                                        <span class="text-xs font-mono text-slate-400 font-semibold">${b.registration_number}</span>
                                    </div>
                                    <div class="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                                        <p><b>Customer:</b> ${b.customer_name} (${b.customer_phone})</p>
                                        <p><b>Expected Return:</b> <span class="${b.status === 'OVERDUE' ? 'text-rose-600 font-bold' : ''}">${b.expected_return_datetime}</span></p>
                                        ${b.status === 'OVERDUE' ? `<p class="text-[11px] text-rose-600 font-semibold mt-1">⚠️ Trip Overdue - 1.5x Late Penalty will apply</p>` : ''}
                                    </div>
                                </div>
                                <div class="mt-4 pt-3 border-t border-[var(--border)]">
                                    <button data-id="${b.id}" class="checkin-action-btn w-full py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5">
                                        ${window.getIcon('car', 'w-4 h-4')}
                                        <span>Process Check-in & Return</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                deskContent.querySelectorAll('.checkin-action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        window.location.hash = `#/bookings/${btn.dataset.id}`;
                    });
                });
            }

        } catch (err) {
            deskContent.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading desk: ${err.message}</p>`;
        }
    }
};

window.HandoverReturnView = HandoverReturnView;
