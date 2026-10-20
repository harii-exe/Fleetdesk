// Vehicle Inventory & Fleet Management View
const VehiclesView = {
    currentCategory: '',
    currentFuel: '',
    searchQuery: '',
    viewMode: 'grid', // 'grid' | 'table'

    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Fleet Inventory</h1>
                        <p class="text-xs text-slate-500 mt-1">Explore, filter, and manage cars, SUVs, bikes, and electric vehicles</p>
                    </div>
                    <div class="flex items-center gap-3">
                        ${AppState.role === 'ADMIN' ? `
                            <button id="add-vehicle-btn" class="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-colors">
                                ${window.getIcon('plus', 'w-4 h-4')}
                                <span>Add Vehicle</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Filters & Search Toolbar -->
                <div class="fleet-card p-4 space-y-3">
                    <div class="flex flex-col md:flex-row items-center justify-between gap-3">
                        <!-- Category Pills -->
                        <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto" id="category-pills">
                            <button data-cat="" class="cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-blue-900 text-white">All Categories</button>
                            <button data-cat="CAR" class="cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">Cars</button>
                            <button data-cat="SUV" class="cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">SUVs</button>
                            <button data-cat="BIKE" class="cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">Bikes & Scooters</button>
                            <button data-cat="ELECTRIC_VEHICLE" class="cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">EVs & Green Fleet</button>
                        </div>

                        <!-- Search & Fuel Filter -->
                        <div class="flex items-center gap-2 w-full md:w-auto">
                            <div class="relative flex-1 md:w-64">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                                    ${window.getIcon('search', 'w-4 h-4')}
                                </span>
                                <input type="text" id="vehicle-search" placeholder="Search brand, model, registration..." class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                            </div>
                            <select id="fuel-filter" class="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none">
                                <option value="">All Fuel</option>
                                <option value="PETROL">Petrol</option>
                                <option value="DIESEL">Diesel</option>
                                <option value="ELECTRIC">Electric</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Vehicles Grid / Table -->
                <div id="vehicles-container" class="min-h-[300px]">
                    <div class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading inventory...</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents(container);
        await this.loadVehicles(container);
    },

    attachEvents(container) {
        // Category Pills
        container.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.cat-pill').forEach(b => {
                    b.classList.remove('bg-blue-900', 'text-white');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                });
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                btn.classList.add('bg-blue-900', 'text-white');
                this.currentCategory = btn.dataset.cat;
                this.loadVehicles(container);
            });
        });

        // Search
        let debounceTimer;
        container.querySelector('#vehicle-search').addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.loadVehicles(container);
            }, 300);
        });

        // Fuel filter
        container.querySelector('#fuel-filter').addEventListener('change', (e) => {
            this.currentFuel = e.target.value;
            this.loadVehicles(container);
        });

        // Add Vehicle Button (Admin)
        const addBtn = container.querySelector('#add-vehicle-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddVehicleModal(container));
        }
    },

    async loadVehicles(container) {
        const vContainer = container.querySelector('#vehicles-container');
        try {
            const params = {};
            if (this.currentCategory) params.category = this.currentCategory;
            if (this.currentFuel) params.fuelType = this.currentFuel;
            if (this.searchQuery) params.search = this.searchQuery;

            const res = await API.getVehicles(params);
            const vehicles = res.data || [];

            if (vehicles.length === 0) {
                vContainer.innerHTML = `
                    <div class="fleet-card py-16 text-center text-slate-400">
                        ${window.getIcon('car', 'w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3')}
                        <h4 class="font-bold text-sm text-[var(--text-main)]">No vehicles found</h4>
                        <p class="text-xs text-slate-500 mt-1">Try adjusting your category, fuel filters, or search terms.</p>
                    </div>
                `;
                return;
            }

            vContainer.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    ${vehicles.map(v => this.renderVehicleCard(v)).join('')}
                </div>
            `;

            // Attach card buttons
            vContainer.querySelectorAll('.view-vehicle-details-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.location.hash = `#/vehicles/${btn.dataset.id}`;
                });
            });

            vContainer.querySelectorAll('.book-vehicle-now-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.location.hash = `#/new-booking?vehicleId=${btn.dataset.id}`;
                });
            });

        } catch (err) {
            vContainer.innerHTML = `
                <div class="p-4 bg-rose-50 text-rose-700 rounded-lg text-xs max-w-md mx-auto">
                    Failed to load vehicles: ${err.message}
                </div>
            `;
        }
    },

    renderVehicleCard(v) {
        const isAvailable = v.operational_status === 'AVAILABLE';
        const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';

        return `
            <div class="fleet-card flex flex-col justify-between overflow-hidden group">
                <div>
                    <!-- Vehicle Image Frame -->
                    <div class="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img src="${v.image_url || fallbackImg}" alt="${v.brand} ${v.model}"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onerror="this.src='${fallbackImg}'" />
                        <div class="absolute top-2.5 right-2.5">
                            <span class="badge badge-${v.operational_status.toLowerCase()} shadow-sm">${v.operational_status}</span>
                        </div>
                        <div class="absolute bottom-2.5 left-2.5 bg-slate-900/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold">
                            ${v.registration_number}
                        </div>
                    </div>

                    <!-- Body Content -->
                    <div class="p-4">
                        <div class="flex items-baseline justify-between">
                            <span class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">${v.category.replace('_', ' ')}</span>
                            <span class="text-xs text-slate-400">${v.manufacturing_year}</span>
                        </div>
                        <h3 class="font-bold text-base text-[var(--text-main)] mt-0.5 truncate">${v.brand} ${v.model}</h3>

                        <!-- Specs Pills -->
                        <div class="grid grid-cols-3 gap-1.5 py-3 border-y border-[var(--border)] my-3 text-[11px] text-slate-500">
                            <div class="flex items-center gap-1">
                                <span class="opacity-70">${window.getIcon('user', 'w-3.5 h-3.5')}</span>
                                <span>${v.seating_capacity} Seats</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="opacity-70">${window.getIcon('zap', 'w-3.5 h-3.5')}</span>
                                <span>${v.fuel_type}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="opacity-70">${window.getIcon('car', 'w-3.5 h-3.5')}</span>
                                <span>${v.transmission}</span>
                            </div>
                        </div>

                        <!-- Price Section -->
                        <div class="flex items-baseline justify-between">
                            <div>
                                <span class="text-xs text-slate-400">Daily Rate</span>
                                <div class="text-lg font-extrabold text-blue-900 dark:text-blue-300">₹${Number(v.daily_rental_rate).toLocaleString()}<span class="text-xs font-normal text-slate-400">/day</span></div>
                            </div>
                            <span class="text-[11px] text-slate-400 font-mono">${Number(v.odometer_reading).toLocaleString()} km</span>
                        </div>
                    </div>
                </div>

                <!-- Footer Buttons -->
                <div class="p-4 pt-0 grid grid-cols-2 gap-2">
                    <button data-id="${v.id}" class="view-vehicle-details-btn py-2 text-center text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        Details & Specs
                    </button>
                    <button data-id="${v.id}" ${!isAvailable ? 'disabled' : ''} class="book-vehicle-now-btn py-2 text-center text-xs font-semibold rounded-lg text-white transition-colors ${isAvailable ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'}">
                        ${isAvailable ? 'Book Now' : v.operational_status}
                    </button>
                </div>
            </div>
        `;
    },

    showAddVehicleModal(container) {
        const formHtml = `
            <form id="add-vehicle-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Registration Number *</label>
                        <input type="text" id="add-reg" required placeholder="KL-07-AB-1234" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Category *</label>
                        <select id="add-category" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none">
                            <option value="CAR">Car</option>
                            <option value="SUV">SUV</option>
                            <option value="BIKE">Bike</option>
                            <option value="ELECTRIC_VEHICLE">Electric Vehicle</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Brand *</label>
                        <input type="text" id="add-brand" required placeholder="Hyundai, Toyota, etc." class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Model *</label>
                        <input type="text" id="add-model" required placeholder="Creta SX, City, etc." class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Daily Rate (₹) *</label>
                        <input type="number" id="add-rate" required min="100" step="50" placeholder="2500" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Fuel Type</label>
                        <select id="add-fuel" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none">
                            <option value="PETROL">Petrol</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="ELECTRIC">Electric</option>
                            <option value="CNG">CNG</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Transmission</label>
                        <select id="add-transmission" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] focus:outline-none">
                            <option value="AUTOMATIC">Automatic</option>
                            <option value="MANUAL">Manual</option>
                            <option value="SINGLE_SPEED">Single Speed (EV)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Seats</label>
                        <input type="number" id="add-seats" value="5" min="1" max="15" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mfg Year</label>
                        <input type="number" id="add-year" value="2024" min="2010" max="2026" class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Insurance Expiry *</label>
                        <input type="date" id="add-insurance" required class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Image URL</label>
                    <input type="url" id="add-img" placeholder="https://images.unsplash.com/..." class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description & Features</label>
                    <textarea id="add-desc" rows="2" placeholder="Vehicle highlights, ADAS, sunroof, condition notes..." class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:outline-none"></textarea>
                </div>
            </form>
        `;

        Modal.show({
            title: 'Add New Fleet Vehicle',
            content: formHtml,
            confirmText: 'Register Vehicle',
            width: 'max-w-xl',
            onConfirm: async () => {
                const payload = {
                    registrationNumber: document.getElementById('add-reg').value.trim().toUpperCase(),
                    category: document.getElementById('add-category').value,
                    brand: document.getElementById('add-brand').value.trim(),
                    model: document.getElementById('add-model').value.trim(),
                    dailyRentalRate: parseFloat(document.getElementById('add-rate').value),
                    fuelType: document.getElementById('add-fuel').value,
                    transmission: document.getElementById('add-transmission').value,
                    seatingCapacity: parseInt(document.getElementById('add-seats').value),
                    manufacturingYear: parseInt(document.getElementById('add-year').value),
                    insuranceExpiry: document.getElementById('add-insurance').value,
                    imageUrl: document.getElementById('add-img').value.trim(),
                    description: document.getElementById('add-desc').value.trim()
                };

                await API.createVehicle(payload);
                Toast.success('Vehicle registered into fleet successfully!');
                await this.loadVehicles(container);
            }
        });
    }
};

window.VehiclesView = VehiclesView;
