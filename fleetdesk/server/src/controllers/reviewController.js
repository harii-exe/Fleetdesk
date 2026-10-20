const { getDb } = require('../../db/connection');

class ReviewController {
    static async getByVehicleId(req, res) {
        const vehicleId = req.params.id;
        const db = getDb();

        const reviews = db.prepare(`
            SELECT r.*, c.full_name as customer_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.vehicle_id = ?
            ORDER BY r.created_at DESC
        `).all(vehicleId);

        const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE vehicle_id = ?').get(vehicleId);

        res.json({
            success: true,
            data: reviews,
            summary: {
                averageRating: avg.avg ? Number(avg.avg.toFixed(1)) : 5.0,
                reviewCount: avg.cnt || 0
            }
        });
    }

    static async create(req, res) {
        const vehicleId = req.params.id;
        const { bookingId, rating, comment } = req.body;

        if (!bookingId || !rating) {
            return res.status(400).json({ success: false, error: 'Booking ID and rating (1-5) are required.' });
        }

        const numRating = parseInt(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
        }

        const db = getDb();
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        if (booking.vehicle_id !== parseInt(vehicleId)) {
            return res.status(400).json({ success: false, error: 'Booking does not match this vehicle.' });
        }

        if (booking.status !== 'COMPLETED') {
            return res.status(400).json({ success: false, error: 'Reviews can only be submitted after completing the rental.' });
        }

        // Ownership check
        if (req.user && req.user.role === 'CUSTOMER' && booking.customer_id !== req.user.customerId) {
            return res.status(403).json({ success: false, error: 'Unauthorized: You can only review your own rentals.' });
        }

        // Check duplicate review for same booking
        const existing = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(bookingId);
        if (existing) {
            return res.status(409).json({ success: false, error: 'A review has already been submitted for this rental.' });
        }

        const insert = db.prepare(`
            INSERT INTO reviews (booking_id, customer_id, vehicle_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `);

        insert.run(bookingId, booking.customer_id, vehicleId, numRating, comment || '');

        res.status(201).json({ success: true, message: 'Review successfully submitted. Thank you for your feedback!' });
    }
}

module.exports = ReviewController;
