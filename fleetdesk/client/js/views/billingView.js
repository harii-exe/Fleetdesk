// Billing, Invoices & Payment Ledger Views
const BillingView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">
                            ${AppState.role === 'CUSTOMER' ? 'My Billing & Invoices' : 'Invoices & Financial Management'}
                        </h1>
                        <p class="text-xs text-slate-500 mt-1">Itemized commercial rental invoices and balance reconciliation</p>
                    </div>
                </div>

                <!-- Invoices Table -->
                <div class="fleet-card overflow-hidden">
                    <div id="invoices-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Loading invoices...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="invoices-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">Invoice #</th>
                                    <th class="py-3 px-4">Booking Ref</th>
                                    ${AppState.role !== 'CUSTOMER' ? '<th class="py-3 px-4">Customer</th>' : ''}
                                    <th class="py-3 px-4">Vehicle</th>
                                    <th class="py-3 px-4">Days</th>
                                    <th class="py-3 px-4">Total Amount</th>
                                    <th class="py-3 px-4">Paid</th>
                                    <th class="py-3 px-4">Outstanding</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invoices-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.loadInvoices(container);
    },

    async loadInvoices(container) {
        const loadingEl = container.querySelector('#invoices-loading');
        const tbody = container.querySelector('#invoices-tbody');

        try {
            const res = await API.getInvoices();
            const invoices = res.data || [];

            loadingEl.classList.add('hidden');

            if (invoices.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" class="py-12 text-center text-slate-400 text-xs">No invoices found.</td></tr>`;
                return;
            }

            tbody.innerHTML = invoices.map(i => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-mono font-bold text-blue-900 dark:text-blue-300">
                        ${i.invoice_number}
                    </td>
                    <td class="py-3 px-4 font-mono font-medium">
                        <a href="#/bookings/${i.booking_id}" class="text-blue-600 dark:text-blue-400 hover:underline">${i.booking_reference}</a>
                    </td>
                    ${AppState.role !== 'CUSTOMER' ? `
                        <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">${i.customer_name}</td>
                    ` : ''}
                    <td class="py-3 px-4">${i.vehicle_brand} ${i.vehicle_model}</td>
                    <td class="py-3 px-4">${i.billable_days}</td>
                    <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">₹${Number(i.total_amount).toLocaleString()}</td>
                    <td class="py-3 px-4 font-semibold text-emerald-600">₹${Number(i.paid_amount).toLocaleString()}</td>
                    <td class="py-3 px-4 font-semibold ${i.outstanding_balance > 0 ? 'text-rose-600' : 'text-slate-400'}">₹${Number(i.outstanding_balance).toLocaleString()}</td>
                    <td class="py-3 px-4">
                        <span class="badge badge-${i.payment_status.toLowerCase()}">${i.payment_status}</span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <a href="#/bookings/${i.booking_id}" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors">
                            View & Pay &rarr;
                        </a>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading invoices: ${err.message}</p>`;
        }
    }
};

// Payment Ledger View
const PaymentsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-main)]">Payment Records & Audit Ledger</h1>
                        <p class="text-xs text-slate-500 mt-1">Simulated payment and refund transaction audit trail</p>
                    </div>
                </div>

                <div class="fleet-card overflow-hidden">
                    <div id="payments-loading" class="py-16 text-center text-slate-400">
                        <div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-900 rounded-full" role="status"></div>
                        <p class="text-xs mt-2 font-medium">Fetching payment records...</p>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs" id="payments-table">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border)] text-slate-500 uppercase tracking-wider font-semibold">
                                    <th class="py-3 px-4">Txn Reference</th>
                                    <th class="py-3 px-4">Invoice #</th>
                                    <th class="py-3 px-4">Customer</th>
                                    <th class="py-3 px-4">Method</th>
                                    <th class="py-3 px-4">Type</th>
                                    <th class="py-3 px-4">Amount</th>
                                    <th class="py-3 px-4">Date & Time</th>
                                    <th class="py-3 px-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody id="payments-tbody" class="divide-y divide-[var(--border)]"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.loadPayments(container);
    },

    async loadPayments(container) {
        const loadingEl = container.querySelector('#payments-loading');
        const tbody = container.querySelector('#payments-tbody');

        try {
            const res = await API.getPayments();
            const payments = res.data || [];

            loadingEl.classList.add('hidden');

            if (payments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 text-xs">No payment transactions recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = payments.map(p => `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">${p.transaction_reference}</td>
                    <td class="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">${p.invoice_number}</td>
                    <td class="py-3 px-4 font-medium">${p.customer_name}</td>
                    <td class="py-3 px-4 font-semibold">${p.payment_method}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.type === 'REFUND' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                            ${p.type}
                        </span>
                    </td>
                    <td class="py-3 px-4 font-bold ${p.type === 'REFUND' ? 'text-amber-600' : 'text-emerald-600'}">
                        ${p.type === 'REFUND' ? '-' : '+'}₹${Number(p.amount).toLocaleString()}
                    </td>
                    <td class="py-3 px-4 text-slate-500">${p.created_at}</td>
                    <td class="py-3 px-4 text-right">
                        <span class="badge badge-${p.status.toLowerCase()}">${p.status}</span>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            loadingEl.innerHTML = `<p class="text-rose-500 text-xs py-4">Error loading payments: ${err.message}</p>`;
        }
    }
};

window.BillingView = BillingView;
window.PaymentsView = PaymentsView;
