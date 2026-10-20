// Toast Notification Manager
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 max-w-md ${
            type === 'success' ? 'bg-emerald-600 text-white' :
            type === 'error' ? 'bg-rose-600 text-white' :
            type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-slate-800 text-white'
        }`;

        let iconName = 'checkCircle';
        if (type === 'error') iconName = 'alertCircle';
        if (type === 'warning') iconName = 'alertCircle';

        toast.innerHTML = `
            <span class="flex-shrink-0">${window.getIcon(iconName, 'w-5 h-5')}</span>
            <div class="flex-1 leading-snug">${message}</div>
            <button class="opacity-70 hover:opacity-100 transition-opacity ml-2 focus:outline-none">&times;</button>
        `;

        toast.querySelector('button').addEventListener('click', () => {
            this.dismiss(toast);
        });

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }
    },

    dismiss(toast) {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 5000); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

window.Toast = Toast;
