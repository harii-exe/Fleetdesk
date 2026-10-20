// Reusable Enterprise Modal Dialog
const Modal = {
    overlay: null,

    show({ title, content, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm = null, isDestructive = false, width = 'max-w-xl' }) {
        this.close();

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity';
        overlay.id = 'active-modal';

        overlay.innerHTML = `
            <div class="bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border)] rounded-xl shadow-2xl w-full ${width} overflow-hidden transform transition-transform animate-scaleUp">
                <div class="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 class="font-semibold text-lg">${title}</h3>
                    <button id="modal-close-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">&times;</button>
                </div>
                <div class="p-6 max-h-[75vh] overflow-y-auto">
                    ${typeof content === 'string' ? content : ''}
                </div>
                <div class="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border)] flex justify-end gap-3">
                    <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        ${cancelText}
                    </button>
                    ${onConfirm ? `
                        <button id="modal-confirm-btn" class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-900 hover:bg-blue-950'}">
                            ${confirmText}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // If content is DOM element, append it
        if (typeof content !== 'string') {
            overlay.querySelector('.max-h-\\[75vh\\]').appendChild(content);
        }

        const closeBtn = overlay.querySelector('#modal-close-btn');
        const cancelBtn = overlay.querySelector('#modal-cancel-btn');
        const confirmBtn = overlay.querySelector('#modal-confirm-btn');

        const handleClose = () => {
            this.close();
        };

        closeBtn.addEventListener('click', handleClose);
        cancelBtn.addEventListener('click', handleClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) handleClose();
        });

        if (confirmBtn && onConfirm) {
            confirmBtn.addEventListener('click', async () => {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = 'Processing...';
                try {
                    await onConfirm();
                    this.close();
                } catch (err) {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = confirmText;
                    Toast.error(err.message || 'Operation failed');
                }
            });
        }

        document.body.appendChild(overlay);
        this.overlay = overlay;
    },

    close() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }
    }
};

window.Modal = Modal;
