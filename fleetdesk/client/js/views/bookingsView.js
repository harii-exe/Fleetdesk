// Bookings, Reservations & Details Views
const BookingsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">
                            ${AppState.role === 'CUSTOMER' ? 'My Reservations & Rental History' : 'Booking Management'}
                        </h1>
                        <p class="text-xs text-slate-500 mt-1">
                            ${AppState.role === 'CUSTOMER' ? 'Track your active and past vehicle reservations' : 'Manage date-based fleet reservations, handovers, and returns'}
                        </p>
                    </div>
                    <div>
                        <a href="#/new-booking" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                            ${window.getIcon('plus', 'w-4 h-4')}
                            <span>New Reservation</span>
                        </a>
                    </div>
                </div>

                <!-- Status Filter Pills -->
                <div class="fleet-card p-3 flex flex-wrap items-center gap-1.5" id="booking-status-filters">
                    <button data-status="" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 text-white">All Bookings</button>
                    <button data-status="ACTIVE" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Active Rentals</button>
                    <button data-status="OVERDUE" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Overdue Returns</button>
                    <button data-status="CONFIRMED" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Confirmed</button>
                    <button data-status="PENDING" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Pending</button>
                    <button data-status="COMPLETED" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Completed</button>
                    <button data-status="CANCELLED" class="b-status-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Cancelled</button>
                </div>

                <!-- Bookings Table Container -->
                <div class="fleet-card overflow-hidden">
                    <div id="bookings-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Fetching reservations from data layer...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="bookings-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">Ref #</th>
                                    <th class="py-3 px-4">Vehicle</th>
                                    ${AppState.role !== 'CUSTOMER' ? '<th class="py-3 px-4">Customer</th>' : ''}
                                    <th class="py-3 px-4">Pickup Date</th>
                                    <th class="py-3 px-4">Return Date</th>
                                    <th class="py-3 px-4">Invoice Total</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="bookings-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents(container);
        await this.loadBookings(container);
    },

    attachEvents(container) {
        container.querySelectorAll('.b-status-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.b-status-pill').forEach(b => {
                    b.classList.remove('bg-blue-900', 'text-white');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                });
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                btn.classList.add('bg-blue-900', 'text-white');
                this.loadBookings(container, btn.dataset.status);
            });
        });
    },

    async loadBookings(container, status = '') {
        const loadingEl = container.querySelector('#bookings-loading');
        const tbody = container.querySelector('#bookings-tbody');

        try {
            const params = {};
            if (status) params.status = status;

            const res = await API.getBookings(params);
            const bookings = res.data || [];

            loadingEl.classList.add('hidden');

            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 text-xs">No bookings found for this filter.</td></tr>`;
                return;
            }

            tbody.innerHTML = bookings.map(b => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-mono font-bold text-blue-900 dark:text-blue-300">
                        <a href="#/bookings/${b.id}" class="hover:underline">${b.booking_reference}</a>
                    </td>
                    <td class="py-3 px-4">
                        <span class="font-semibold text-slate-800 dark:text-slate-200 block">${b.brand} ${b.model}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${b.registration_number}</span>
                    </td>
                    ${AppState.role !== 'CUSTOMER' ? `
                        <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            ${b.customer_name}
                            <span class="text-[10px] text-slate-400 block">${b.customer_phone || ''}</span>
                        </td>
                    ` : ''}
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${b.pickup_datetime?.slice(0, 16)}</td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">${b.expected_return_datetime?.slice(0, 16)}</td>
                    <td class="py-3 px-4">
                        <span class="font-bold text-slate-800 dark:text-slate-200">₹${Number(b.total_amount || 0).toLocaleString()}</span>
                        ${b.outstanding_balance > 0 ? `<span class="text-[10px] text-rose-500 block">₹${b.outstanding_balance} due</span>` : '<span class="text-[10px] text-emerald-500 block">Fully settled</span>'}
                    </td>
                    <td class="py-3 px-4">
                        <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <a href="#/bookings/${b.id}" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors">
                            Manage &rarr;
                        </a>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading bookings: ${err.message}</p>`;
        }
    }
};

// New Booking Creation View
const NewBookingView = {
    async render(container) {
        // Parse search params for pre-selected vehicle
        const hashParts = window.location.hash.split('?');
        const searchParams = new URLSearchParams(hashParts[1] || '');
        const preSelectedVehicleId = searchParams.get('vehicleId');
        const preSelectedPickup = searchParams.get('pickup');
        const preSelectedReturn = searchParams.get('return');

        container.innerHTML = `
            <div class="max-w-3xl mx-auto space-y-6">
                <!-- Breadcrumb -->
                <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <a href="#/bookings" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        &larr; Back to Bookings
                    </a>
                    <span class="text-xs text-slate-400">Step 1 of 1: Reservation Details</span>
                </div>

                <div class="fleet-card p-6 sm:p-8">
                    <div class="mb-6">
                        <h2 class="text-xl font-extrabold text-[var(--text-main)]">Create Date-Based Reservation</h2>
                        <p class="text-xs text-slate-500 mt-1">Real-time interval conflict checking and 24-hour block billing</p>
                    </div>

                    <form id="new-booking-form" class="space-y-5">
                        <!-- Vehicle Selector -->
                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Select Fleet Vehicle *</label>
                            <select id="book-vehicle-select" required class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:ring-2 focus:ring-blue-600 focus:outline-none">
                                <option value="">Loading available fleet...</option>
                            </select>
                        </div>

                        <!-- Customer Selector (Staff/Admin only) -->
                        ${AppState.role !== 'CUSTOMER' ? `
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Select Customer *</label>
                                <select id="book-customer-select" required class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:ring-2 focus:ring-blue-600 focus:outline-none">
                                    <option value="">Loading customers...</option>
                                </select>
                            </div>
                        ` : ''}

                        <!-- Date Time Pickers -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pickup Date & Time *</label>
                                <input type="datetime-local" id="book-pickup" required class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Return Date & Time *</label>
                                <input type="datetime-local" id="book-return" required class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                            </div>
                        </div>

                        <!-- Discount Code Voucher Input -->
                        <div>
                            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Promotional Voucher Code</label>
                            <div class="flex gap-2">
                                <input type="text" id="book-discount-code" placeholder="WELCOME10, WEEKEND20, FESTIVE500" class="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent uppercase font-mono focus:outline-none" />
                                <button type="button" id="apply-discount-btn" class="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors">
                                    Apply
                                </button>
                            </div>
                            <span class="text-[11px] text-slate-400 mt-1 block">Try code <b>WELCOME10</b> (10% off) or <b>FESTIVE500</b> (₹500 flat off)</span>
                        </div>

                        <!-- Live Billing Calculator Breakdown Box -->
                        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-[var(--border)] space-y-2 text-xs">
                            <div class="flex justify-between text-slate-500">
                                <span>Billable Duration (24-hr blocks):</span>
                                <span id="calc-days" class="font-bold text-slate-800 dark:text-slate-200">1 Day</span>
                            </div>
                            <div class="flex justify-between text-slate-500">
                                <span>Vehicle Daily Rate:</span>
                                <span id="calc-rate" class="font-bold text-slate-800 dark:text-slate-200">₹0</span>
                            </div>
                            <div class="flex justify-between text-slate-500">
                                <span>Rental Charge:</span>
                                <span id="calc-rental-charge" class="font-bold text-slate-800 dark:text-slate-200">₹0</span>
                            </div>
                            <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
                                <span>Discount Applied:</span>
                                <span id="calc-discount" class="font-bold">-₹0</span>
                            </div>
                            <div class="pt-2 border-t border-[var(--border)] flex justify-between text-base font-extrabold text-blue-900 dark:text-blue-300">
                                <span>Estimated Total:</span>
                                <span id="calc-total">₹0</span>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" id="book-submit-btn" class="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2">
                            ${window.getIcon('checkCircle', 'w-4 h-4')}
                            <span>Confirm & Create Reservation</span>
                        </button>
                    </form>
                </div>
            </div>
        `;

        // Load vehicles into select
        const vSelect = container.querySelector('#book-vehicle-select');
        let vehiclesList = [];
        try {
            const vRes = await API.getVehicles();
            vehiclesList = vRes.data || [];
            vSelect.innerHTML = vehiclesList.map(v => `
                <option value="${v.id}" data-rate="${v.daily_rental_rate}" ${String(v.id) === String(preSelectedVehicleId) ? 'selected' : ''}>
                    ${v.brand} ${v.model} (${v.registration_number}) - ₹${v.daily_rental_rate}/day [${v.operational_status}]
                </option>
            `).join('');
        } catch (e) {
            vSelect.innerHTML = '<option value="">Error loading vehicles</option>';
        }

        // If staff/admin, load customers
        if (AppState.role !== 'CUSTOMER') {
            const cSelect = container.querySelector('#book-customer-select');
            try {
                const cRes = await API.getCustomers();
                cSelect.innerHTML = (cRes.data || []).map(c => `
                    <option value="${c.id}">${c.full_name} (${c.driving_licence_number}) - ${c.phone}</option>
                `).join('');
            } catch (e) {
                cSelect.innerHTML = '<option value="">Error loading customers</option>';
            }
        }

        // Setup default dates
        const now = new Date();
        now.setHours(now.getHours() + 2);
        now.setMinutes(0);
        const later = new Date(now);
        later.setDate(later.getDate() + 2);

        const pickupInput = container.querySelector('#book-pickup');
        const returnInput = container.querySelector('#book-return');

        pickupInput.value = preSelectedPickup || now.toISOString().slice(0, 16);
        returnInput.value = preSelectedReturn || later.toISOString().slice(0, 16);

        // Recalculator function
        let appliedDiscount = 0;
        const recalculate = () => {
            const selectedOpt = vSelect.options[vSelect.selectedIndex];
            const dailyRate = selectedOpt ? parseFloat(selectedOpt.dataset.rate) || 0 : 0;

            const pDate = new Date(pickupInput.value);
            const rDate = new Date(returnInput.value);

            let billableDays = 1;
            if (!isNaN(pDate) && !isNaN(rDate) && rDate > pDate) {
                const hours = (rDate - pDate) / 36e5;
                billableDays = Math.max(1, Math.ceil(hours / 24));
            }

            const rentalCharge = billableDays * dailyRate;
            const total = Math.max(0, rentalCharge - appliedDiscount);

            container.querySelector('#calc-days').innerText = `${billableDays} Day${billableDays > 1 ? 's' : ''}`;
            container.querySelector('#calc-rate').innerText = `₹${dailyRate.toLocaleString()}`;
            container.querySelector('#calc-rental-charge').innerText = `₹${rentalCharge.toLocaleString()}`;
            container.querySelector('#calc-discount').innerText = `-₹${appliedDiscount.toLocaleString()}`;
            container.querySelector('#calc-total').innerText = `₹${total.toLocaleString()}`;
        };

        vSelect.addEventListener('change', recalculate);
        pickupInput.addEventListener('change', recalculate);
        returnInput.addEventListener('change', recalculate);

        // Voucher apply button
        container.querySelector('#apply-discount-btn').addEventListener('click', () => {
            const code = container.querySelector('#book-discount-code').value.trim().toUpperCase();
            if (code === 'WELCOME10') {
                appliedDiscount = 300; // Simulated voucher
                Toast.success('Voucher WELCOME10 applied!');
            } else if (code === 'FESTIVE500') {
                appliedDiscount = 500;
                Toast.success('Voucher FESTIVE500 applied!');
            } else if (code) {
                appliedDiscount = 250;
                Toast.info(`Promotional code ${code} recorded.`);
            }
            recalculate();
        });

        recalculate();

        // Submit form
        container.querySelector('#new-booking-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = container.querySelector('#book-submit-btn');
            btn.disabled = true;
            btn.innerHTML = 'Verifying and creating reservation...';

            try {
                const payload = {
                    vehicleId: vSelect.value,
                    pickupDatetime: pickupInput.value,
                    expectedReturnDatetime: returnInput.value,
                    discountCode: container.querySelector('#book-discount-code').value.trim()
                };

                if (AppState.role !== 'CUSTOMER') {
                    payload.customerId = container.querySelector('#book-customer-select').value;
                }

                const res = await API.createBooking(payload);
                Toast.success(`Reservation ${res.data.bookingReference} confirmed!`);
                window.location.hash = `#/bookings/${res.data.bookingId}`;
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm & Create Reservation';
                Toast.error(err.message || 'Booking creation failed.');
            }
        });
    }
};

// Booking Details Dossier View
const BookingDetailsView = {
    async render(container, bookingId) {
        container.innerHTML = `
            <div id="b-detail-loading" class="py-16 text-center text-slate-400">
                <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                <p class="text-xs mt-2 font-medium">Loading reservation record...</p>
            </div>
            <div id="b-detail-content" class="space-y-6 hidden"></div>
        `;

        try {
            const res = await API.getBookingById(bookingId);
            const b = res.data;

            const loadingEl = container.querySelector('#b-detail-loading');
            const contentEl = container.querySelector('#b-detail-content');
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');

            const isStaffOrAdmin = AppState.role === 'ADMIN' || AppState.role === 'STAFF';
            const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';
            const canHandover = isStaffOrAdmin && (b.status === 'CONFIRMED' || b.status === 'PENDING');
            const canReturn = isStaffOrAdmin && (b.status === 'ACTIVE' || b.status === 'OVERDUE');

            contentEl.innerHTML = `
                <!-- Top Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <div class="flex items-center gap-2">
                            <a href="#/bookings" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">&larr; Bookings</a>
                            <span class="text-slate-300">/</span>
                            <span class="font-mono text-sm font-bold text-blue-900 dark:text-blue-300">${b.booking_reference}</span>
                            <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">Created on ${b.created_at?.slice(0, 16)}</p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap items-center gap-2">
                        ${canCancel ? `
                            <button id="cancel-booking-btn" class="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors">
                                Cancel Reservation
                            </button>
                        ` : ''}

                        ${canHandover ? `
                            <button id="handover-booking-btn" class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5">
                                ${window.getIcon('key', 'w-4 h-4')}
                                <span>Record Handover</span>
                            </button>
                        ` : ''}

                        ${canReturn ? `
                            <button id="return-booking-btn" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5">
                                ${window.getIcon('car', 'w-4 h-4')}
                                <span>Process Return</span>
                            </button>
                        ` : ''}

                        ${b.status === 'COMPLETED' ? `
                            <button id="review-booking-btn" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1">
                                ${window.getIcon('star', 'w-4 h-4')}
                                <span>Rate Rental</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Two-Column Overview -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column: Details & Chronology (2 cols) -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Vehicle & Customer Cards -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Vehicle Card -->
                            <div class="fleet-card p-5">
                                <span class="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold block">Assigned Vehicle</span>
                                <h3 class="font-extrabold text-base text-[var(--text-main)] mt-1">${b.brand} ${b.model}</h3>
                                <div class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mt-2 font-semibold">
                                    ${b.registration_number}
                                </div>
                                <div class="mt-4 pt-3 border-t border-[var(--border)] text-xs space-y-1 text-slate-500">
                                    <div class="flex justify-between"><span>Category:</span> <span class="font-medium text-slate-700 dark:text-slate-300">${b.category}</span></div>
                                    <div class="flex justify-between"><span>Daily Tariff:</span> <span class="font-bold text-slate-800 dark:text-slate-200">₹${b.agreed_daily_rate}/day</span></div>
                                </div>
                            </div>

                            <!-- Customer Card -->
                            <div class="fleet-card p-5">
                                <span class="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Customer Information</span>
                                <h3 class="font-extrabold text-base text-[var(--text-main)] mt-1">${b.customer_name}</h3>
                                <p class="text-xs text-slate-500 mt-1">${b.customer_phone}</p>
                                <div class="mt-4 pt-3 border-t border-[var(--border)] text-xs space-y-1 text-slate-500">
                                    <div class="flex justify-between"><span>Driving Licence:</span> <span class="font-mono font-medium text-slate-700 dark:text-slate-300">${b.driving_licence_number}</span></div>
                                    <div class="flex justify-between"><span>Licence Expiry:</span> <span class="font-medium text-slate-700 dark:text-slate-300">${b.licence_expiry_date}</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Rental Schedule Timeline -->
                        <div class="fleet-card p-5">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Rental Duration & Telematics</h3>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span class="text-slate-400 block text-[11px]">Scheduled Pickup</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${b.pickup_datetime}</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block text-[11px]">Expected Return</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${b.expected_return_datetime}</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block text-[11px]">Start Odometer</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${b.start_odometer ? b.start_odometer + ' KM' : 'Pending handover'}</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block text-[11px]">Final Odometer</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${b.end_odometer ? b.end_odometer + ' KM' : 'In rental'}</span>
                                </div>
                            </div>

                            ${b.handover_notes || b.return_notes ? `
                                <div class="mt-4 pt-3 border-t border-[var(--border)] text-xs space-y-2">
                                    ${b.handover_notes ? `<p><b class="text-slate-600 dark:text-slate-300">Handover Notes:</b> ${b.handover_notes}</p>` : ''}
                                    ${b.return_notes ? `<p><b class="text-slate-600 dark:text-slate-300">Return Notes:</b> ${b.return_notes}</p>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Right Column: Line-Item Invoice (1 col) -->
                    <div class="space-y-6">
                        <div class="fleet-card p-6" id="printable-invoice">
                            <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                                <div>
                                    <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Billing Statement</span>
                                    <h4 class="font-bold text-sm text-[var(--text-main)] font-mono">${b.invoice_number || 'INV-PENDING'}</h4>
                                </div>
                                <span class="badge badge-${(b.payment_status || 'UNPAID').toLowerCase()}">${b.payment_status || 'UNPAID'}</span>
                            </div>

                            <div class="py-4 space-y-2.5 text-xs">
                                <div class="flex justify-between text-slate-500">
                                    <span>Billable Rental Days:</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200">${b.billable_days || 1} Days</span>
                                </div>
                                <div class="flex justify-between text-slate-500">
                                    <span>Tariff (₹${b.agreed_daily_rate} / day):</span>
                                    <span class="font-bold text-slate-800 dark:text-slate-200">₹${Number(b.rental_charge || 0).toLocaleString()}</span>
                                </div>
                                ${b.discount_amount > 0 ? `
                                    <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>Discount Deducted:</span>
                                        <span class="font-bold">-₹${Number(b.discount_amount).toLocaleString()}</span>
                                    </div>
                                ` : ''}
                                ${b.extra_charges > 0 ? `
                                    <div class="flex justify-between text-rose-600 dark:text-rose-400">
                                        <span>Damage / Extra Charges:</span>
                                        <span class="font-bold">+₹${Number(b.extra_charges).toLocaleString()}</span>
                                    </div>
                                ` : ''}
                                ${b.late_fee > 0 ? `
                                    <div class="flex justify-between text-rose-600 dark:text-rose-400">
                                        <span>Overdue Late Fee (${b.late_days}d @ 1.5x):</span>
                                        <span class="font-bold">+₹${Number(b.late_fee).toLocaleString()}</span>
                                    </div>
                                ` : ''}
                                <div class="pt-3 border-t border-[var(--border)] flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                    <span>Total Invoice Amount:</span>
                                    <span>₹${Number(b.total_amount || 0).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Amount Paid:</span>
                                    <span class="font-bold">₹${Number(b.paid_amount || 0).toLocaleString()}</span>
                                </div>
                                <div class="pt-2 border-t border-[var(--border)] flex justify-between font-black text-base ${b.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                                    <span>Outstanding Due:</span>
                                    <span>₹${Number(b.outstanding_balance || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <!-- Payment Button / Invoice Actions -->
                            <div class="pt-3 border-t border-[var(--border)] space-y-2 no-print">
                                ${b.outstanding_balance > 0 ? `
                                    <button id="pay-invoice-btn" class="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1.5">
                                        ${window.getIcon('creditCard', 'w-4 h-4')}
                                        <span>Pay Balance (₹${b.outstanding_balance})</span>
                                    </button>
                                ` : ''}
                                <button onclick="window.print()" class="w-full py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                    ${window.getIcon('printer', 'w-3.5 h-3.5')}
                                    <span>Print Invoice</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Wire Cancel Button
            const cancelBtn = contentEl.querySelector('#cancel-booking-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    Modal.show({
                        title: 'Cancel Reservation',
                        content: `
                            <p class="text-xs text-slate-600 dark:text-slate-300 mb-3">Please provide a reason for cancelling reservation ${b.booking_reference}:</p>
                            <input type="text" id="cancel-reason" placeholder="Schedule changed, etc." class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                        `,
                        confirmText: 'Confirm Cancellation',
                        isDestructive: true,
                        onConfirm: async () => {
                            const reason = document.getElementById('cancel-reason').value.trim();
                            await API.cancelBooking(bookingId, reason);
                            Toast.success('Reservation successfully cancelled.');
                            this.render(container, bookingId);
                        }
                    });
                });
            }

            // Wire Handover Button
            const handoverBtn = contentEl.querySelector('#handover-booking-btn');
            if (handoverBtn) {
                handoverBtn.addEventListener('click', () => {
                    Modal.show({
                        title: `Vehicle Handover: ${b.brand} ${b.model}`,
                        content: `
                            <div class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-medium mb-1">Current Vehicle Odometer Reading (KM) *</label>
                                    <input type="number" id="ho-odo" value="${b.current_vehicle_odometer || 0}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Fuel / Battery Condition</label>
                                    <select id="ho-fuel" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                                        <option value="100%">100% Full</option>
                                        <option value="75%">75% Fuel</option>
                                        <option value="50%">50% Fuel</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Handover Checklist & Condition Notes</label>
                                    <textarea id="ho-notes" rows="2" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" placeholder="Verified DL, spare tyre checked, vehicle clean"></textarea>
                                </div>
                            </div>
                        `,
                        confirmText: 'Complete Handover & Activate',
                        onConfirm: async () => {
                            await API.handoverVehicle(bookingId, {
                                startOdometer: parseInt(document.getElementById('ho-odo').value),
                                startFuelLevel: document.getElementById('ho-fuel').value,
                                handoverNotes: document.getElementById('ho-notes').value.trim()
                            });
                            Toast.success('Vehicle handed over. Rental is now ACTIVE.');
                            this.render(container, bookingId);
                        }
                    });
                });
            }

            // Wire Return Button
            const returnBtn = contentEl.querySelector('#return-booking-btn');
            if (returnBtn) {
                returnBtn.addEventListener('click', () => {
                    Modal.show({
                        title: `Process Vehicle Return: ${b.brand} ${b.model}`,
                        content: `
                            <div class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-medium mb-1">Final Odometer Reading (KM) *</label>
                                    <input type="number" id="ret-odo" value="${(b.start_odometer || 0) + 150}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Fuel / Battery Level</label>
                                    <select id="ret-fuel" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                                        <option value="100%">100% Full</option>
                                        <option value="90%">90% Full</option>
                                        <option value="75%">75% Fuel</option>
                                        <option value="50%">50% Fuel</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Damage / Cleaning Extra Charges (₹)</label>
                                    <input type="number" id="ret-damage" value="0" min="0" step="100" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                                <div class="flex items-center gap-2 pt-1">
                                    <input type="checkbox" id="ret-maint" class="rounded" />
                                    <label for="ret-maint" class="text-slate-600 dark:text-slate-300">Route vehicle to Maintenance Bay for repair/inspection</label>
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Return Inspection Notes</label>
                                    <textarea id="ret-notes" rows="2" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" placeholder="Checked body panels, tyres, toolkit"></textarea>
                                </div>
                            </div>
                        `,
                        confirmText: 'Reconcile Return & Generate Final Invoice',
                        onConfirm: async () => {
                            await API.returnVehicle(bookingId, {
                                endOdometer: parseInt(document.getElementById('ret-odo').value),
                                endFuelLevel: document.getElementById('ret-fuel').value,
                                damageCharges: parseFloat(document.getElementById('ret-damage').value) || 0,
                                markMaintenance: document.getElementById('ret-maint').checked,
                                returnNotes: document.getElementById('ret-notes').value.trim()
                            });
                            Toast.success('Vehicle return reconciled. Final invoice updated!');
                            this.render(container, bookingId);
                        }
                    });
                });
            }

            // Wire Payment Button
            const payBtn = contentEl.querySelector('#pay-invoice-btn');
            if (payBtn) {
                payBtn.addEventListener('click', () => {
                    Modal.show({
                        title: `Simulated Payment: ${b.invoice_number}`,
                        content: `
                            <div class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-medium mb-1">Outstanding Balance: ₹${b.outstanding_balance}</label>
                                    <input type="number" id="pay-amt" value="${b.outstanding_balance}" max="${b.outstanding_balance}" min="1" step="50" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Select Payment Simulation Method</label>
                                    <select id="pay-method" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                                        <option value="UPI">UPI (Google Pay, PhonePe, BHIM)</option>
                                        <option value="CARD">Debit / Credit Card</option>
                                        <option value="CASH">Cash Over-the-Counter</option>
                                    </select>
                                </div>
                                <div class="flex items-center gap-2 pt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                                    <input type="checkbox" id="pay-sim-fail" class="rounded" />
                                    <label for="pay-sim-fail" class="text-amber-800 dark:text-amber-300 font-semibold">Simulate Gateway Failure (Test error handling)</label>
                                </div>
                            </div>
                        `,
                        confirmText: 'Execute Payment Simulation',
                        onConfirm: async () => {
                            const res = await API.recordPayment(b.invoice_id, {
                                amount: parseFloat(document.getElementById('pay-amt').value),
                                paymentMethod: document.getElementById('pay-method').value,
                                simulateFailure: document.getElementById('pay-sim-fail').checked
                            });
                            if (res.status === 'FAILED') {
                                Toast.error(res.message);
                            } else {
                                Toast.success(`Payment ₹${res.amount} successful! (Ref: ${res.transactionReference})`);
                            }
                            this.render(container, bookingId);
                        }
                    });
                });
            }

            // Wire Review Button
            const revBtn = contentEl.querySelector('#review-booking-btn');
            if (revBtn) {
                revBtn.addEventListener('click', () => {
                    Modal.show({
                        title: `Rate Your Rental Experience: ${b.brand} ${b.model}`,
                        content: `
                            <div class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-medium mb-1">Rating (1 to 5 Stars) *</label>
                                    <select id="rev-rating" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)]">
                                        <option value="5">★★★★★ - Excellent (5 Stars)</option>
                                        <option value="4">★★★★☆ - Very Good (4 Stars)</option>
                                        <option value="3">★★★☆☆ - Average (3 Stars)</option>
                                        <option value="2">★★☆☆☆ - Poor (2 Stars)</option>
                                        <option value="1">★☆☆☆☆ - Terrible (1 Star)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-medium mb-1">Customer Review Comments</label>
                                    <textarea id="rev-comment" rows="3" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" placeholder="Vehicle condition, comfort, handover experience..."></textarea>
                                </div>
                            </div>
                        `,
                        confirmText: 'Submit Review',
                        onConfirm: async () => {
                            await API.submitReview(b.vehicle_id, {
                                bookingId,
                                rating: parseInt(document.getElementById('rev-rating').value),
                                comment: document.getElementById('rev-comment').value.trim()
                            });
                            Toast.success('Review submitted successfully!');
                            this.render(container, bookingId);
                        }
                    });
                });
            }

        } catch (err) {
            container.innerHTML = `
                <div class="p-6 bg-rose-50 text-rose-700 rounded-lg text-xs max-w-md mx-auto my-12">
                    Failed to load booking details: ${err.message}
                </div>
            `;
        }
    }
};

window.BookingsView = BookingsView;
window.NewBookingView = NewBookingView;
window.BookingDetailsView = BookingDetailsView;
