// Detailed Vehicle Specification & Live Booking View
const VehicleDetailsView = {
    async render(container, vehicleId) {
        container.innerHTML = `
            <div id="v-detail-loading" class="py-16 text-center text-slate-400">
                <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                <p class="text-xs mt-2 font-medium">Loading vehicle dossier...</p>
            </div>
            <div id="v-detail-content" class="space-y-6 hidden"></div>
        `;

        try {
            const res = await API.getVehicleById(vehicleId);
            const v = res.data;

            const loadingEl = container.querySelector('#v-detail-loading');
            const contentEl = container.querySelector('#v-detail-content');
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');

            const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';

            contentEl.innerHTML = `
                <!-- Navigation Breadcrumb -->
                <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <a href="#/vehicles" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        &larr; Back to Fleet Inventory
                    </a>
                    <div class="flex items-center gap-2">
                        <span class="badge badge-${v.operational_status.toLowerCase()}">${v.operational_status}</span>
                        ${AppState.role === 'ADMIN' ? `
                            <button id="deactivate-vehicle-btn" class="px-2.5 py-1 text-xs border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium">
                                ${v.operational_status === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate'}
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Vehicle Hero Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left: Vehicle Photo & Specs (2 cols) -->
                    <div class="lg:col-span-2 space-y-6">
                        <div class="fleet-card overflow-hidden">
                            <div class="relative h-72 sm:h-96 bg-slate-900">
                                <img src="${v.image_url || fallbackImg}" alt="${v.brand} ${v.model}"
                                    class="w-full h-full object-cover" onerror="this.src='${fallbackImg}'" />
                                <div class="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/20">
                                    <span class="text-xs text-sky-400 uppercase tracking-widest font-bold block">${v.category.replace('_', ' ')}</span>
                                    <h2 class="text-xl font-extrabold">${v.brand} ${v.model}</h2>
                                    <span class="font-mono text-xs opacity-80">${v.registration_number}</span>
                                </div>
                            </div>

                            <div class="p-6">
                                <h3 class="text-sm font-bold text-[var(--text-main)] mb-2">Vehicle Overview</h3>
                                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${v.description || 'Premium commercial fleet vehicle inspected for cross-country reliability.'}</p>

                                <!-- Technical Specs Grid -->
                                <h3 class="text-sm font-bold text-[var(--text-main)] mt-6 mb-3">Technical Specifications</h3>
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Seating</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.seating_capacity} Occupants</span>
                                    </div>
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Powertrain</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.fuel_type}</span>
                                    </div>
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Transmission</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.transmission}</span>
                                    </div>
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Odometer</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${Number(v.odometer_reading).toLocaleString()} KM</span>
                                    </div>
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Model Year</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.manufacturing_year}</span>
                                    </div>
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Insurance Valid</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.insurance_expiry}</span>
                                    </div>
                                    ${v.battery_capacity_kwh ? `
                                        <div class="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-lg">
                                            <span class="text-[10px] text-sky-600 uppercase tracking-wider block">EV Battery</span>
                                            <span class="font-bold text-sky-900 dark:text-sky-300 mt-0.5 block">${v.battery_capacity_kwh} kWh</span>
                                        </div>
                                    ` : ''}
                                    ${v.engine_cc ? `
                                        <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg">
                                            <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Displacement</span>
                                            <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">${v.engine_cc} CC</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Customer Reviews Section -->
                        <div class="fleet-card p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-sm font-bold text-[var(--text-main)]">Customer Ratings & Verified Reviews</h3>
                                <div class="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                    ${window.getIcon('star', 'w-4 h-4')}
                                    <span>${v.ratingInfo?.averageRating || 5.0}</span>
                                    <span class="text-xs text-slate-400 font-normal">(${v.ratingInfo?.totalReviews || 0} reviews)</span>
                                </div>
                            </div>

                            <div class="space-y-3">
                                ${(!v.reviews || v.reviews.length === 0) ? `
                                    <p class="text-xs text-slate-400 py-3 text-center">No reviews submitted yet for this vehicle.</p>
                                ` : v.reviews.map(r => `
                                    <div class="p-3 rounded-lg border border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/40">
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="font-bold text-xs text-[var(--text-main)]">${r.customer_name}</span>
                                            <div class="flex text-amber-400 text-xs">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                                        </div>
                                        <p class="text-xs text-slate-600 dark:text-slate-300">${r.comment}</p>
                                        <span class="text-[10px] text-slate-400 mt-1 block">${r.created_at?.slice(0, 10)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Right: Live Date Availability & Booking Card (1 col) -->
                    <div class="space-y-6">
                        <div class="fleet-card p-6 sticky top-6">
                            <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Agreed Daily Tariff</span>
                            <div class="text-3xl font-black text-blue-900 dark:text-blue-300 mt-1">₹${Number(v.daily_rental_rate).toLocaleString()}<span class="text-sm font-normal text-slate-400"> / day</span></div>

                            <div class="mt-5 space-y-3 pt-4 border-t border-[var(--border)]">
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Live Availability Check</h4>

                                <div>
                                    <label class="block text-[11px] font-medium text-slate-500 mb-1">Pickup Date & Time</label>
                                    <input type="datetime-local" id="check-pickup" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>

                                <div>
                                    <label class="block text-[11px] font-medium text-slate-500 mb-1">Return Date & Time</label>
                                    <input type="datetime-local" id="check-return" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                                </div>

                                <button id="run-check-btn" class="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow transition-colors">
                                    Check Availability
                                </button>

                                <div id="availability-result-box" class="hidden p-3 rounded-lg text-xs font-medium"></div>

                                <button id="direct-book-btn" class="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5">
                                    ${window.getIcon('calendar', 'w-4 h-4')}
                                    <span>Proceed to Reserve</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Default dates
            const now = new Date();
            now.setHours(now.getHours() + 2);
            now.setMinutes(0);
            const later = new Date(now);
            later.setDate(later.getDate() + 3);

            const pickupInput = contentEl.querySelector('#check-pickup');
            const returnInput = contentEl.querySelector('#check-return');

            pickupInput.value = now.toISOString().slice(0, 16);
            returnInput.value = later.toISOString().slice(0, 16);

            // Availability checker button
            const runCheckBtn = contentEl.querySelector('#run-check-btn');
            const resultBox = contentEl.querySelector('#availability-result-box');

            runCheckBtn.addEventListener('click', async () => {
                runCheckBtn.disabled = true;
                runCheckBtn.innerHTML = 'Verifying with database...';

                try {
                    const check = await API.checkAvailability(vehicleId, pickupInput.value, returnInput.value);
                    resultBox.classList.remove('hidden');

                    if (check.available) {
                        resultBox.className = 'p-3 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                        resultBox.innerHTML = `✓ Available for selected dates! No conflicts found.`;
                    } else {
                        resultBox.className = 'p-3 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                        resultBox.innerHTML = `✕ ${check.reason}`;
                    }
                } catch (err) {
                    resultBox.classList.remove('hidden');
                    resultBox.className = 'p-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-800';
                    resultBox.innerHTML = err.message;
                } finally {
                    runCheckBtn.disabled = false;
                    runCheckBtn.innerHTML = 'Check Availability';
                }
            });

            // Direct reserve button
            contentEl.querySelector('#direct-book-btn').addEventListener('click', () => {
                window.location.hash = `#/new-booking?vehicleId=${vehicleId}&pickup=${encodeURIComponent(pickupInput.value)}&return=${encodeURIComponent(returnInput.value)}`;
            });

            // Deactivate button (Admin)
            const deactBtn = contentEl.querySelector('#deactivate-vehicle-btn');
            if (deactBtn) {
                deactBtn.addEventListener('click', async () => {
                    const newStatus = v.operational_status === 'DEACTIVATED' ? 'AVAILABLE' : 'DEACTIVATED';
                    Modal.show({
                        title: `${newStatus === 'DEACTIVATED' ? 'Deactivate' : 'Reactivate'} Vehicle`,
                        content: `Are you sure you want to change the status of ${v.brand} ${v.model} (${v.registration_number}) to <b>${newStatus}</b>? Historical bookings will remain intact.`,
                        confirmText: `Confirm ${newStatus}`,
                        isDestructive: newStatus === 'DEACTIVATED',
                        onConfirm: async () => {
                            await API.updateVehicleStatus(vehicleId, newStatus);
                            Toast.success(`Vehicle status changed to ${newStatus}.`);
                            this.render(container, vehicleId);
                        }
                    });
                });
            }

        } catch (err) {
            container.innerHTML = `
                <div class="p-6 bg-rose-50 text-rose-700 rounded-lg text-xs max-w-md mx-auto my-12">
                    Failed to load vehicle details: ${err.message}
                </div>
            `;
        }
    }
};

window.VehicleDetailsView = VehicleDetailsView;
