const { getDb } = require('../../db/connection');

class VehicleController {
    static async getAll(req, res) {
        const db = getDb();
        const { search, category, fuelType, status, minRate, maxRate, sort = 'brand', order = 'ASC', page = 1, limit = 50 } = req.query;

        let query = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];

        // For customers or public browsing, don't show DEACTIVATED vehicles
        if (req.user && req.user.role === 'ADMIN') {
            if (status) {
                query += ' AND operational_status = ?';
                params.push(status);
            }
        } else {
            // Non-admin sees active fleet
            query += " AND operational_status != 'DEACTIVATED'";
            if (status) {
                query += ' AND operational_status = ?';
                params.push(status);
            }
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (fuelType) {
            query += ' AND fuel_type = ?';
            params.push(fuelType);
        }

        if (minRate) {
            query += ' AND daily_rental_rate >= ?';
            params.push(Number(minRate));
        }

        if (maxRate) {
            query += ' AND daily_rental_rate <= ?';
            params.push(Number(maxRate));
        }

        if (search) {
            query += ' AND (registration_number LIKE ? OR brand LIKE ? OR model LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        // Sorting safe whitelist
        const allowedSort = ['daily_rental_rate', 'brand', 'manufacturing_year', 'model', 'id', 'created_at'];
        const sortCol = allowedSort.includes(sort) ? sort : 'brand';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortCol} ${sortOrder}`;

        const numLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const numOffset = (Math.max(1, parseInt(page) || 1) - 1) * numLimit;
        query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

        const vehicles = db.prepare(query).all(...params);

        // Total count for pagination
        const countQuery = 'SELECT COUNT(*) as total FROM vehicles WHERE 1=1' + (req.user && req.user.role === 'ADMIN' ? '' : " AND operational_status != 'DEACTIVATED'");
        const totalCount = db.prepare(countQuery).get().total;

        res.json({
            success: true,
            data: vehicles,
            pagination: {
                total: totalCount,
                page: parseInt(page) || 1,
                limit: numLimit
            }
        });
    }

    static async getById(req, res) {
        const db = getDb();
        const id = req.params.id;
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

        if (!vehicle) {
            return res.status(404).json({ success: false, error: 'Vehicle not found' });
        }

        // Fetch maintenance history
        const maintenance = db.prepare(`
            SELECT * FROM maintenance_records
            WHERE vehicle_id = ?
            ORDER BY start_date DESC
        `).all(id);

        // Fetch reviews
        const reviews = db.prepare(`
            SELECT r.*, c.full_name as customer_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.vehicle_id = ?
            ORDER BY r.created_at DESC
        `).all(id);

        // Average rating
        const avgRatingRow = db.prepare('SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount FROM reviews WHERE vehicle_id = ?').get(id);

        res.json({
            success: true,
            data: {
                ...vehicle,
                maintenance,
                reviews,
                ratingInfo: {
                    averageRating: avgRatingRow.avgRating ? Number(avgRatingRow.avgRating.toFixed(1)) : 5.0,
                    totalReviews: avgRatingRow.reviewCount || 0
                }
            }
        });
    }

    static async create(req, res) {
        const {
            registrationNumber, brand, model, category, manufacturingYear,
            fuelType, seatingCapacity, transmission, dailyRentalRate,
            description, imageUrl, odometerReading, insuranceExpiry,
            batteryCapacityKwh, engineCc
        } = req.body;

        if (!registrationNumber || !brand || !model || !category || !dailyRentalRate || !insuranceExpiry) {
            return res.status(400).json({ success: false, error: 'Required vehicle fields are missing.' });
        }

        const rate = parseFloat(dailyRentalRate);
        if (isNaN(rate) || rate <= 0) {
            return res.status(400).json({ success: false, error: 'Daily rental rate must be a positive number.' });
        }

        const validCategories = ['CAR', 'BIKE', 'SUV', 'ELECTRIC_VEHICLE'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
        }

        const db = getDb();

        // Check duplicate reg
        const existing = db.prepare('SELECT id FROM vehicles WHERE registration_number = ?').get(registrationNumber.trim().toUpperCase());
        if (existing) {
            return res.status(409).json({ success: false, error: `A vehicle is already registered with registration number ${registrationNumber}.` });
        }

        const insert = db.prepare(`
            INSERT INTO vehicles (
                registration_number, brand, model, category, manufacturing_year, fuel_type,
                seating_capacity, transmission, daily_rental_rate, operational_status,
                description, image_url, odometer_reading, insurance_expiry, battery_capacity_kwh, engine_cc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?, ?, ?)
        `);

        const result = insert.run(
            registrationNumber.trim().toUpperCase(),
            brand.trim(),
            model.trim(),
            category,
            parseInt(manufacturingYear) || new Date().getFullYear(),
            fuelType || 'PETROL',
            parseInt(seatingCapacity) || 5,
            transmission || 'MANUAL',
            rate,
            description || '',
            imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            parseInt(odometerReading) || 0,
            insuranceExpiry,
            batteryCapacityKwh ? parseFloat(batteryCapacityKwh) : null,
            engineCc ? parseInt(engineCc) : null
        );

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'VEHICLE_CREATED', 'VEHICLE', ?, ?)
        `).run(req.user.id, result.lastInsertRowid.toString(), `Created vehicle ${brand} ${model} (${registrationNumber})`);

        res.status(201).json({
            success: true,
            message: 'Vehicle registered successfully.',
            vehicleId: result.lastInsertRowid
        });
    }

    static async update(req, res) {
        const id = req.params.id;
        const db = getDb();
        const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

        if (!existing) {
            return res.status(404).json({ success: false, error: 'Vehicle not found' });
        }

        const {
            registrationNumber, brand, model, category, manufacturingYear,
            fuelType, seatingCapacity, transmission, dailyRentalRate,
            operationalStatus, description, imageUrl, odometerReading, insuranceExpiry,
            batteryCapacityKwh, engineCc
        } = req.body;

        const rate = dailyRentalRate ? parseFloat(dailyRentalRate) : existing.daily_rental_rate;
        if (rate <= 0) {
            return res.status(400).json({ success: false, error: 'Rental rate must be greater than zero.' });
        }

        // Check registration collision if updated
        if (registrationNumber && registrationNumber.trim().toUpperCase() !== existing.registration_number) {
            const conflict = db.prepare('SELECT id FROM vehicles WHERE registration_number = ? AND id != ?').get(registrationNumber.trim().toUpperCase(), id);
            if (conflict) {
                return res.status(409).json({ success: false, error: 'Another vehicle already exists with that registration number.' });
            }
        }

        db.prepare(`
            UPDATE vehicles
            SET registration_number = ?,
                brand = ?,
                model = ?,
                category = ?,
                manufacturing_year = ?,
                fuel_type = ?,
                seating_capacity = ?,
                transmission = ?,
                daily_rental_rate = ?,
                operational_status = ?,
                description = ?,
                image_url = ?,
                odometer_reading = ?,
                insurance_expiry = ?,
                battery_capacity_kwh = ?,
                engine_cc = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            (registrationNumber || existing.registration_number).trim().toUpperCase(),
            brand || existing.brand,
            model || existing.model,
            category || existing.category,
            manufacturingYear || existing.manufacturing_year,
            fuelType || existing.fuel_type,
            seatingCapacity || existing.seating_capacity,
            transmission || existing.transmission,
            rate,
            operationalStatus || existing.operational_status,
            description !== undefined ? description : existing.description,
            imageUrl || existing.image_url,
            odometerReading !== undefined ? odometerReading : existing.odometer_reading,
            insuranceExpiry || existing.insurance_expiry,
            batteryCapacityKwh !== undefined ? batteryCapacityKwh : existing.battery_capacity_kwh,
            engineCc !== undefined ? engineCc : existing.engine_cc,
            id
        );

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'VEHICLE_UPDATED', 'VEHICLE', ?, 'Vehicle details modified')
        `).run(req.user.id, id.toString());

        res.json({ success: true, message: 'Vehicle updated successfully.' });
    }

    static async updateStatus(req, res) {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'DEACTIVATED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const db = getDb();
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
        if (!vehicle) {
            return res.status(404).json({ success: false, error: 'Vehicle not found' });
        }

        // Soft deactivation prevents breaking historical booking records
        db.prepare(`UPDATE vehicles SET operational_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);

        db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'VEHICLE_STATUS_CHANGED', 'VEHICLE', ?, ?)
        `).run(req.user.id, id.toString(), `Changed status from ${vehicle.operational_status} to ${status}`);

        res.json({ success: true, message: `Vehicle status changed to ${status}.` });
    }
}

module.exports = VehicleController;
