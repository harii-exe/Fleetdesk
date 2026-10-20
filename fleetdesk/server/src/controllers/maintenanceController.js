const { getDb } = require('../../db/connection');

class MaintenanceController {
    static async getAll(req, res) {
        const db = getDb();
        const { status, vehicleId } = req.query;

        let query = `
            SELECT
                m.*,
                v.brand, v.model, v.registration_number, v.category, v.operational_status as vehicle_status
            FROM maintenance_records m
            JOIN vehicles v ON m.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }

        if (vehicleId) {
            query += ' AND m.vehicle_id = ?';
            params.push(parseInt(vehicleId));
        }

        query += ' ORDER BY m.start_date DESC';
        const records = db.prepare(query).all(...params);

        res.json({ success: true, data: records });
    }

    static async create(req, res) {
        const { vehicleId, serviceType, description, cost, startDate, completionDate, nextServiceDue, serviceCenter, technicianNotes, setVehicleStatus } = req.body;

        if (!vehicleId || !serviceType || !description || !startDate) {
            return res.status(400).json({ success: false, error: 'Vehicle ID, service type, description, and start date are required.' });
        }

        const db = getDb();
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ success: false, error: 'Vehicle not found.' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const insert = db.prepare(`
                INSERT INTO maintenance_records (
                    vehicle_id, service_type, description, cost, start_date, completion_date, next_service_due,
                    status, service_center, technician_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?)
            `);

            const result = insert.run(
                vehicleId,
                serviceType.trim(),
                description.trim(),
                parseFloat(cost) || 0.00,
                startDate,
                completionDate || null,
                nextServiceDue || null,
                serviceCenter || '',
                technicianNotes || ''
            );

            // If setVehicleStatus requested or maintenance starts today/in-progress, update vehicle operational status
            if (setVehicleStatus === true || startDate <= new Date().toISOString().slice(0, 10)) {
                db.prepare("UPDATE vehicles SET operational_status = 'MAINTENANCE', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(vehicleId);
                db.prepare("UPDATE maintenance_records SET status = 'IN_PROGRESS' WHERE id = ?").run(result.lastInsertRowid);
            }

            // Audit
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'MAINTENANCE_CREATED', 'MAINTENANCE', ?, ?)
            `).run(req.user.id, result.lastInsertRowid.toString(), `Logged ${serviceType} for ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})`);

            db.exec('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Maintenance record created.',
                recordId: result.lastInsertRowid
            });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async updateStatus(req, res) {
        const id = req.params.id;
        const { status, completionDate, cost, technicianNotes } = req.body;
        const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const db = getDb();
        const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Maintenance record not found.' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const compDate = status === 'COMPLETED' ? (completionDate || new Date().toISOString().slice(0, 10)) : null;

            db.prepare(`
                UPDATE maintenance_records
                SET status = ?,
                    completion_date = COALESCE(?, completion_date),
                    cost = COALESCE(?, cost),
                    technician_notes = COALESCE(?, technician_notes)
                WHERE id = ?
            `).run(status, compDate, cost !== undefined ? parseFloat(cost) : null, technicianNotes || null, id);

            // Vehicle operational status check
            if (status === 'IN_PROGRESS') {
                db.prepare("UPDATE vehicles SET operational_status = 'MAINTENANCE', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(record.vehicle_id);
            } else if (status === 'COMPLETED') {
                // Rule 14: Do not make a vehicle available simply because a maintenance record was marked completed if another active maintenance issue remains!
                const remainingActive = db.prepare(`
                    SELECT id FROM maintenance_records
                    WHERE vehicle_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS') AND id != ?
                `).get(record.vehicle_id, id);

                if (!remainingActive) {
                    db.prepare("UPDATE vehicles SET operational_status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(record.vehicle_id);
                }
            }

            // Audit
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'MAINTENANCE_STATUS_UPDATED', 'MAINTENANCE', ?, ?)
            `).run(req.user.id, id.toString(), `Status updated to ${status}`);

            db.exec('COMMIT');

            res.json({ success: true, message: `Maintenance record updated to ${status}.` });
        } catch (err) {
            db.exec('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = MaintenanceController;
