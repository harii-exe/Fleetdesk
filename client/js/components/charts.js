// Zero-dependency Pure SVG Enterprise Charts
const Charts = {
    renderRevenueLineChart(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !data || data.length === 0) return;

        const width = 600;
        const height = 240;
        const padding = { top: 20, right: 30, bottom: 40, left: 60 };

        const maxVal = Math.max(...data.map(d => d.revenue), 10000) * 1.15;
        const minVal = 0;

        const points = data.map((d, i) => {
            const x = padding.left + (i * ((width - padding.left - padding.right) / (data.length - 1)));
            const y = height - padding.bottom - ((d.revenue - minVal) / (maxVal - minVal) * (height - padding.top - padding.bottom));
            return { x, y, ...d };
        });

        // Path string
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding.bottom} L ${points[0].x.toFixed(1)} ${height - padding.bottom} Z`;

        // Horizontal gridlines
        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = height - padding.bottom - (ratio * (height - padding.top - padding.bottom));
            const val = Math.round(minVal + (ratio * (maxVal - minVal)));
            return `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
                <text x="${padding.left - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="currentColor" opacity="0.6">₹${val.toLocaleString()}</text>
            `;
        }).join('');

        // X-axis labels and points
        const pointElements = points.map(p => `
            <g class="cursor-pointer group">
                <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="2" class="transition-transform group-hover:scale-150" />
                <text x="${p.x}" y="${height - 15}" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">${p.month.split(' ')[0]}</text>
                <title>${p.month}: ₹${p.revenue.toLocaleString()} (${p.bookings} bookings)</title>
            </g>
        `).join('');

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25" />
                        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                ${gridLines}
                <path d="${areaPath}" fill="url(#revenueGrad)" />
                <path d="${linePath}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                ${pointElements}
            </svg>
        `;
    },

    renderCategoryDonut(categories, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !categories || categories.length === 0) return;

        const size = 180;
        const strokeWidth = 24;
        const radius = (size - strokeWidth) / 2;
        const center = size / 2;
        const circumference = 2 * Math.PI * radius;

        const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;
        const colors = ['#1e3a8a', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6'];

        let offset = 0;
        const slices = categories.map((cat, idx) => {
            const ratio = cat.count / total;
            const strokeDasharray = `${ratio * circumference} ${circumference}`;
            const strokeDashoffset = -offset;
            offset += ratio * circumference;
            const color = colors[idx % colors.length];

            return `
                <circle cx="${center}" cy="${center}" r="${radius}" fill="none"
                    stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
                    class="transition-all duration-500 hover:opacity-80 cursor-pointer">
                    <title>${cat.category}: ${cat.count} vehicles (${Math.round(ratio * 100)}%)</title>
                </circle>
            `;
        }).join('');

        const legend = categories.map((cat, idx) => {
            const color = colors[idx % colors.length];
            const ratio = Math.round((cat.count / total) * 100);
            return `
                <div class="flex items-center justify-between text-xs py-1 border-b border-[var(--border)] last:border-0">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                        <span class="font-medium">${cat.category.replace('_', ' ')}</span>
                    </div>
                    <span class="text-slate-500 dark:text-slate-400 font-semibold">${cat.count} (${ratio}%)</span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <div class="relative w-44 h-44 flex items-center justify-center">
                    <svg viewBox="0 0 ${size} ${size}" class="w-full h-full transform -rotate-90">
                        ${slices}
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span class="text-2xl font-bold text-slate-800 dark:text-slate-100">${total}</span>
                        <span class="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Fleet</span>
                    </div>
                </div>
                <div class="flex-1 w-full max-w-xs flex flex-col justify-center">
                    ${legend}
                </div>
            </div>
        `;
    }
};

window.Charts = Charts;
