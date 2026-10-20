const ReportService = require('../services/reportService');
const { getDb } = require('../../db/connection');

class ReportController {
    static async getDashboard(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const metrics = ReportService.getDashboardMetrics(startDate, endDate);
            res.json({ success: true, data: metrics });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getDetailed(req, res) {
        try {
            const reports = ReportService.getDetailedReports();
            res.json({ success: true, data: reports });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async exportCsv(req, res) {
        try {
            const { type } = req.query;
            const db = getDb();
            let csvContent = '';
            let filename = 'fleetdesk_report.csv';

            if (type === 'vehicles') {
                const vehicles = db.prepare('SELECT id, registration_number, brand, model, category, daily_rental_rate, operational_status, odometer_reading FROM vehicles').all();
                const columns = [
                    { key: 'id', label: 'ID' },
                    { key: 'registration_number', label: 'Registration' },
                    { key: 'brand', label: 'Brand' },
                    { key: 'model', label: 'Model' },
                    { key: 'category', label: 'Category' },
                    { key: 'daily_rental_rate', label: 'Daily Rate (INR)' },
                    { key: 'operational_status', label: 'Status' },
                    { key: 'odometer_reading', label: 'Odometer (KM)' }
                ];
                csvContent = ReportService.exportToCsv(vehicles, columns);
                filename = 'fleet_inventory_report.csv';
            } else if (type === 'bookings') {
                const bookings = db.prepare(`
                    SELECT b.booking_reference, c.full_name, v.registration_number, b.pickup_datetime, b.expected_return_datetime, b.status, b.agreed_daily_rate
                    FROM bookings b
                    JOIN customers c ON b.customer_id = c.id
                    JOIN vehicles v ON b.vehicle_id = v.id
                    ORDER BY b.pickup_datetime DESC
                `).all();
                const columns = [
                    { key: 'booking_reference', label: 'Booking Ref' },
                    { key: 'full_name', label: 'Customer' },
                    { key: 'registration_number', label: 'Vehicle' },
                    { key: 'pickup_datetime', label: 'Pickup Date' },
                    { key: 'expected_return_datetime', label: 'Return Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'agreed_daily_rate', label: 'Daily Rate (INR)' }
                ];
                csvContent = ReportService.exportToCsv(bookings, columns);
                filename = 'bookings_report.csv';
            } else if (type === 'revenue' || type === 'invoices') {
                const invoices = db.prepare(`
                    SELECT i.invoice_number, b.booking_reference, c.full_name, i.billable_days, i.rental_charge, i.late_fee, i.discount_amount, i.extra_charges, i.total_amount, i.paid_amount, i.outstanding_balance, i.payment_status
                    FROM invoices i
                    JOIN bookings b ON i.booking_id = b.id
                    JOIN customers c ON b.customer_id = c.id
                `).all();
                const columns = [
                    { key: 'invoice_number', label: 'Invoice No' },
                    { key: 'booking_reference', label: 'Booking Ref' },
                    { key: 'full_name', label: 'Customer' },
                    { key: 'billable_days', label: 'Billable Days' },
                    { key: 'rental_charge', label: 'Rental Charge' },
                    { key: 'late_fee', label: 'Late Fee' },
                    { key: 'discount_amount', label: 'Discount' },
                    { key: 'extra_charges', label: 'Extra Charges' },
                    { key: 'total_amount', label: 'Total Amount' },
                    { key: 'paid_amount', label: 'Paid Amount' },
                    { key: 'outstanding_balance', label: 'Outstanding Balance' },
                    { key: 'payment_status', label: 'Status' }
                ];
                csvContent = ReportService.exportToCsv(invoices, columns);
                filename = 'financial_invoices_report.csv';
            } else {
                return res.status(400).json({ success: false, error: 'Invalid export type. Must be: vehicles, bookings, or revenue' });
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.end(csvContent);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = ReportController;
