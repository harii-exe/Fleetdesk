const crypto = require('node:crypto');
const { getDb } = require('../../db/connection');

class PaymentService {
    /**
     * Generates a unique internal transaction reference
     */
    static generateTransactionReference(method) {
        const cleanMethod = (method || 'GEN').toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `TXN-${cleanMethod}-${dateStr}-${randomHex}`;
    }

    /**
     * Processes simulated payment for an invoice
     */
    static recordPayment({ invoiceId, amount, paymentMethod, paymentDetails = {}, simulateFailure = false, currentUser }) {
        const db = getDb();
        const numAmount = Number(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('Payment amount must be greater than zero.');
        }

        const validMethods = ['UPI', 'CARD', 'CASH'];
        const method = (paymentMethod || '').toUpperCase();
        if (!validMethods.includes(method)) {
            throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
        }

        // Get invoice
        const invoice = db.prepare(`
            SELECT i.*, b.customer_id, c.user_id as customer_user_id
            FROM invoices i
            JOIN bookings b ON i.booking_id = b.id
            JOIN customers c ON b.customer_id = c.id
            WHERE i.id = ?
        `).get(invoiceId);

        if (!invoice) {
            throw new Error('Invoice not found.');
        }

        // Customer permission check
        if (currentUser && currentUser.role === 'CUSTOMER' && invoice.customer_user_id !== currentUser.id) {
            throw new Error('Unauthorized: You cannot pay invoices belonging to other customers.');
        }

        const outstanding = Number(invoice.outstanding_balance);
        if (numAmount > (outstanding + 0.01)) {
            throw new Error(`Payment amount (₹${numAmount.toFixed(2)}) cannot exceed outstanding balance (₹${outstanding.toFixed(2)}).`);
        }

        const txnRef = this.generateTransactionReference(method);

        // Simulated failure branch
        if (simulateFailure) {
            const failureReason = 'Simulated Payment Error: Transaction declined by issuing gateway/bank.';
            db.prepare(`
                INSERT INTO payments (transaction_reference, invoice_id, amount, payment_method, type, status, payment_details, failure_reason)
                VALUES (?, ?, ?, ?, 'PAYMENT', 'FAILED', ?, ?)
            `).run(txnRef, invoiceId, numAmount, method, JSON.stringify(paymentDetails), failureReason);

            return {
                success: false,
                status: 'FAILED',
                transactionReference: txnRef,
                message: failureReason
            };
        }

        db.exec('BEGIN TRANSACTION');
        try {
            // Record payment transaction
            db.prepare(`
                INSERT INTO payments (transaction_reference, invoice_id, amount, payment_method, type, status, payment_details)
                VALUES (?, ?, ?, ?, 'PAYMENT', 'SUCCESS', ?)
            `).run(txnRef, invoiceId, numAmount, method, JSON.stringify(paymentDetails));

            // Update invoice balances
            const newPaid = Number((Number(invoice.paid_amount) + numAmount).toFixed(2));
            const newOutstanding = Math.max(0, Number((Number(invoice.total_amount) - newPaid + Number(invoice.refunded_amount)).toFixed(2)));

            let newStatus = 'PARTIALLY_PAID';
            if (newOutstanding <= 0.00) {
                newStatus = 'PAID';
            }

            db.prepare(`
                UPDATE invoices
                SET paid_amount = ?,
                    outstanding_balance = ?,
                    payment_status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newPaid, newOutstanding, newStatus, invoiceId);

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'PAYMENT_RECORDED', 'INVOICE', ?, ?)
                `).run(currentUser.id, invoiceId.toString(), `Recorded ${method} payment of ₹${numAmount} for invoice ${invoice.invoice_number} (Ref: ${txnRef})`);
            }

            db.exec('COMMIT');

            return {
                success: true,
                status: 'SUCCESS',
                transactionReference: txnRef,
                amount: numAmount,
                method,
                newPaidAmount: newPaid,
                newOutstandingBalance: newOutstanding,
                paymentStatus: newStatus
            };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }

    /**
     * Records an auditable refund against an invoice
     */
    static recordRefund({ invoiceId, amount, reason, currentUser }) {
        const db = getDb();
        const numAmount = Number(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('Refund amount must be greater than zero.');
        }

        const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found.');
        }

        const maxRefundable = Number(invoice.paid_amount) - Number(invoice.refunded_amount);
        if (numAmount > maxRefundable) {
            throw new Error(`Refund amount (₹${numAmount}) exceeds net paid amount (₹${maxRefundable}).`);
        }

        const txnRef = this.generateTransactionReference('REFUND');

        db.exec('BEGIN TRANSACTION');
        try {
            db.prepare(`
                INSERT INTO payments (transaction_reference, invoice_id, amount, payment_method, type, status, payment_details)
                VALUES (?, ?, ?, 'UPI', 'REFUND', 'REFUNDED', ?)
            `).run(txnRef, invoiceId, numAmount, JSON.stringify({ reason: reason || 'Customer refund adjustment' }));

            const newRefunded = Number((Number(invoice.refunded_amount) + numAmount).toFixed(2));
            const newOutstanding = Number((Number(invoice.outstanding_balance) + numAmount).toFixed(2));
            const newStatus = (newRefunded >= Number(invoice.paid_amount)) ? 'REFUNDED' : invoice.payment_status;

            db.prepare(`
                UPDATE invoices
                SET refunded_amount = ?,
                    outstanding_balance = ?,
                    payment_status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newRefunded, newOutstanding, newStatus, invoiceId);

            // Audit log
            if (currentUser) {
                db.prepare(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (?, 'REFUND_RECORDED', 'INVOICE', ?, ?)
                `).run(currentUser.id, invoiceId.toString(), `Processed refund of ₹${numAmount} for invoice ${invoice.invoice_number}`);
            }

            db.exec('COMMIT');

            return {
                success: true,
                status: 'REFUNDED',
                transactionReference: txnRef,
                refundedAmount: newRefunded,
                outstandingBalance: newOutstanding
            };
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }
}

module.exports = PaymentService;
