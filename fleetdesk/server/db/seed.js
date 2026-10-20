const { getDb, initDatabase } = require('./connection');
const { hashPassword } = require('../src/utils/security');

function seedDatabase() {
    const db = initDatabase();

    // Check if users already seeded
    const countRow = db.prepare('SELECT COUNT(*) as count FROM app_users').get();
    if (countRow.count > 0) {
        console.log('Database already contains records. Skipping seed.');
        return;
    }

    console.log('🌱 Seeding FleetDesk database with comprehensive sample records...');

    // 1. System Settings
    const insertSetting = db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)');
    insertSetting.run('penalty_multiplier', '1.5', 'Overdue penalty multiplier for late returns');
    insertSetting.run('cancellation_fee', '200.00', 'Standard cancellation charge in INR');
    insertSetting.run('tax_rate', '0.05', 'Applicable GST / Service Tax rate (5%)');
    insertSetting.run('currency', 'INR', 'Default system currency');
    insertSetting.run('company_name', 'FleetDesk Mobility Solutions Pvt Ltd', 'Company legal name');
    insertSetting.run('support_phone', '+91 484 290 8800', 'Customer care support hotline');
    insertSetting.run('support_email', 'support@fleetdesk.com', 'Customer support email');

    // 2. Users (Admin, Staff, Customers)
    const insertUser = db.prepare(`
        INSERT INTO app_users (username, email, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'ACTIVE')
    `);

    // Standard secure test passwords:
    // Admin: Admin@123
    // Staff: Staff@123
    // Customer: Customer@123
    const adminHash = hashPassword('Admin@123');
    const staffHash = hashPassword('Staff@123');
    const custHash = hashPassword('Customer@123');

    const uAdmin = insertUser.run('admin', 'admin@fleetdesk.com', adminHash, 'ADMIN').lastInsertRowid;
    const uStaff1 = insertUser.run('staff1', 'staff@fleetdesk.com', staffHash, 'STAFF').lastInsertRowid;
    const uStaff2 = insertUser.run('staff2', 'arun.nair@fleetdesk.com', staffHash, 'STAFF').lastInsertRowid;

    // Customers
    const uCust1 = insertUser.run('rahul', 'rahul.sharma@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust2 = insertUser.run('ananya', 'ananya.patel@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust3 = insertUser.run('rohit', 'rohit.verma@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust4 = insertUser.run('sneha', 'sneha.menon@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust5 = insertUser.run('kavya', 'kavya.nair@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust6 = insertUser.run('vikram', 'vikram.singh@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust7 = insertUser.run('deepa', 'deepa.krishnan@example.com', custHash, 'CUSTOMER').lastInsertRowid;
    const uCust8 = insertUser.run('arjun', 'arjun.das@example.com', custHash, 'CUSTOMER').lastInsertRowid;

    // Staff Profiles
    const insertStaff = db.prepare(`
        INSERT INTO staff_profiles (user_id, employee_code, full_name, department, phone)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertStaff.run(uStaff1, 'FD-STAFF-101', 'Suresh Babu', 'Fleet Operations', '+91 98470 11223');
    insertStaff.run(uStaff2, 'FD-STAFF-102', 'Arun Nair', 'Customer Relations', '+91 98470 33445');

    // Customers Data
    const insertCustomer = db.prepare(`
        INSERT INTO customers (user_id, full_name, phone, address, driving_licence_number, licence_expiry_date, account_status)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const c1 = insertCustomer.run(uCust1, 'Rahul Sharma', '+91 98765 43210', 'Flat 4B, Skyline Meadows, Kakkanad, Kochi, Kerala', 'KL-07-20180012345', '2030-05-15').lastInsertRowid;
    const c2 = insertCustomer.run(uCust2, 'Ananya Patel', '+91 98765 43211', '12/480, Marine Drive, Kochi, Kerala', 'KL-07-20190087654', '2029-11-20').lastInsertRowid;
    const c3 = insertCustomer.run(uCust3, 'Rohit Verma', '+91 98765 43212', '7A, Asset Symphony, Edappally, Kochi, Kerala', 'KL-07-20200054321', '2031-03-10').lastInsertRowid;
    const c4 = insertCustomer.run(uCust4, 'Sneha Menon', '+91 98765 43213', 'B-102, Purva Grand, Vazhakkala, Kochi, Kerala', 'KL-07-20170099887', '2028-08-25').lastInsertRowid;
    const c5 = insertCustomer.run(uCust5, 'Kavya Nair', '+91 98765 43214', 'Green Villa, Pattom, Thiruvananthapuram, Kerala', 'KL-01-20190044556', '2029-09-30').lastInsertRowid;
    const c6 = insertCustomer.run(uCust6, 'Vikram Singh', '+91 98765 43215', '404, Oberon Enclave, Vyttila, Kochi, Kerala', 'KL-07-20210022334', '2032-01-18').lastInsertRowid;
    const c7 = insertCustomer.run(uCust7, 'Deepa Krishnan', '+91 98765 43216', '33/201, Calicut Beach Road, Kozhikode, Kerala', 'KL-11-20180077889', '2030-10-12').lastInsertRowid;
    const c8 = insertCustomer.run(uCust8, 'Arjun Das', '+91 98765 43217', 'Villa 8, Silver Sand, Aluva, Ernakulam, Kerala', 'KL-07-20220033112', '2033-04-05').lastInsertRowid;

    // 3. Vehicles (15 vehicles spanning CAR, SUV, BIKE, ELECTRIC_VEHICLE)
    const insertVehicle = db.prepare(`
        INSERT INTO vehicles (
            registration_number, brand, model, category, manufacturing_year, fuel_type,
            seating_capacity, transmission, daily_rental_rate, operational_status,
            description, image_url, odometer_reading, insurance_expiry, battery_capacity_kwh, engine_cc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // CAR
    const v01 = insertVehicle.run(
        'KL-07-CD-1001', 'Hyundai', 'i20 Asta', 'CAR', 2023, 'PETROL',
        5, 'MANUAL', 1500.00, 'AVAILABLE',
        'Sporty premium hatchback with sunroof, 10.25-inch touchscreen, and excellent fuel economy.',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        24500, '2027-08-30', null, 1197
    ).lastInsertRowid;

    const v02 = insertVehicle.run(
        'KL-07-CD-1002', 'Honda', 'City ZX CVT', 'CAR', 2023, 'PETROL',
        5, 'AUTOMATIC', 2200.00, 'AVAILABLE',
        'Executive sedan offering plush leather upholstery, Honda Sensing ADAS, and smooth CVT transmission.',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
        18200, '2027-10-15', null, 1498
    ).lastInsertRowid;

    const v03 = insertVehicle.run(
        'KL-01-AB-4455', 'Maruti Suzuki', 'Swift ZXi', 'CAR', 2022, 'PETROL',
        5, 'MANUAL', 1200.00, 'AVAILABLE',
        'Reliable, peppy, and economical city commuter with smartplay audio and cruise control.',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
        31000, '2027-05-10', null, 1197
    ).lastInsertRowid;

    const v04 = insertVehicle.run(
        'KL-08-EF-8899', 'Skoda', 'Slavia Style DSG', 'CAR', 2024, 'PETROL',
        5, 'AUTOMATIC', 2600.00, 'MAINTENANCE',
        'European dynamics, 1.5L TSI turbocharged performance with ventilated seats and 521L boot.',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
        12400, '2028-01-20', null, 1498
    ).lastInsertRowid;

    // SUV
    const v05 = insertVehicle.run(
        'KL-07-XY-7001', 'Mahindra', 'XUV700 AX7L', 'SUV', 2023, 'DIESEL',
        7, 'AUTOMATIC', 3800.00, 'RENTED',
        'Flagship luxury 7-seater SUV with panoramic skyroof, Sony 3D sound system, and Level 2 ADAS.',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80',
        29000, '2027-09-12', null, 2198
    ).lastInsertRowid;

    const v06 = insertVehicle.run(
        'KL-07-XY-7002', 'Hyundai', 'Creta SX(O)', 'SUV', 2023, 'DIESEL',
        5, 'AUTOMATIC', 2800.00, 'RENTED',
        'Compact premium SUV with ventilated seats, Bose audio, voice-enabled panoramic sunroof.',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        21500, '2027-11-05', null, 1493
    ).lastInsertRowid;

    const v07 = insertVehicle.run(
        'KL-11-MN-3321', 'Toyota', 'Innova Crysta 2.4 VX', 'SUV', 2022, 'DIESEL',
        7, 'MANUAL', 3500.00, 'AVAILABLE',
        'Legendary highway tourer offering unbeatable captain seat comfort and bulletproof reliability.',
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80',
        45000, '2027-04-18', null, 2393
    ).lastInsertRowid;

    const v08 = insertVehicle.run(
        'KL-01-PQ-9911', 'Tata', 'Harrier Fearless Plus', 'SUV', 2024, 'DIESEL',
        5, 'AUTOMATIC', 3200.00, 'AVAILABLE',
        'Bold styling, Land Rover pedigree D8 platform, 360 camera, and JBL audio with subwoofer.',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
        19800, '2028-02-14', null, 1956
    ).lastInsertRowid;

    // BIKE
    const v09 = insertVehicle.run(
        'KL-07-BK-5001', 'Royal Enfield', 'Classic 350 Reborn', 'BIKE', 2023, 'PETROL',
        2, 'MANUAL', 900.00, 'AVAILABLE',
        'Iconic cruiser with smooth J-series 349cc engine, dual-channel ABS, and timeless road presence.',
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        14000, '2027-06-25', null, 349
    ).lastInsertRowid;

    const v10 = insertVehicle.run(
        'KL-07-BK-5002', 'KTM', 'Duke 390 Gen 3', 'BIKE', 2024, 'PETROL',
        2, 'MANUAL', 1400.00, 'AVAILABLE',
        'Corner rocket with 45 hp, quickshifter, traction control, launch control, and TFT display.',
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
        9800, '2028-03-10', null, 399
    ).lastInsertRowid;

    const v11 = insertVehicle.run(
        'KL-01-BK-2022', 'Yamaha', 'MT-15 V2', 'BIKE', 2023, 'PETROL',
        2, 'MANUAL', 800.00, 'AVAILABLE',
        'Naked agility champion with VVA 155cc engine, USD front forks, and outstanding mileage.',
        'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80',
        11200, '2027-07-22', null, 155
    ).lastInsertRowid;

    const v12 = insertVehicle.run(
        'KL-08-BK-7744', 'Honda', 'Activa 6G Premium', 'BIKE', 2023, 'PETROL',
        2, 'AUTOMATIC', 500.00, 'AVAILABLE',
        'Hassle-free gearless scooter, ideal for smooth local errands and city commuting.',
        'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=600&q=80',
        8900, '2027-12-01', null, 109
    ).lastInsertRowid;

    // ELECTRIC_VEHICLE
    const v13 = insertVehicle.run(
        'KL-07-EV-9001', 'Tata', 'Nexon EV Empowered+', 'ELECTRIC_VEHICLE', 2024, 'ELECTRIC',
        5, 'SINGLE_SPEED', 2600.00, 'AVAILABLE',
        'Zero-emission electric SUV with 465 km certified range, V2L vehicle-to-load charging, and 360 camera.',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
        16500, '2028-04-15', 40.5, null
    ).lastInsertRowid;

    const v14 = insertVehicle.run(
        'KL-01-EV-9002', 'MG', 'ZS EV Exclusive Pro', 'ELECTRIC_VEHICLE', 2023, 'ELECTRIC',
        5, 'SINGLE_SPEED', 3400.00, 'AVAILABLE',
        'Long range 50.3 kWh battery EV with dual-pane panoramic sunroof and ADAS safety tech.',
        'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=600&q=80',
        11000, '2027-08-10', 50.3, null
    ).lastInsertRowid;

    const v15 = insertVehicle.run(
        'KL-07-EV-9003', 'Ather', '450X Gen 3', 'ELECTRIC_VEHICLE', 2023, 'ELECTRIC',
        2, 'SINGLE_SPEED', 650.00, 'AVAILABLE',
        'High-tech smart e-scooter with Warp mode, Google Maps navigation touchscreen, and auto-hold.',
        'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80',
        7300, '2027-09-20', 3.7, null
    ).lastInsertRowid;

    // 4. Discounts
    const insertDiscount = db.prepare(`
        INSERT INTO discounts (code, description, discount_type, value, min_rental_days, valid_from, valid_until, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertDiscount.run('WELCOME10', 'Welcome bonus 10% off for new customers', 'PERCENTAGE', 10.00, 2, '2024-01-01', '2027-12-31');
    insertDiscount.run('WEEKEND20', 'Weekend escape 20% off', 'PERCENTAGE', 20.00, 3, '2024-01-01', '2027-12-31');
    insertDiscount.run('FESTIVE500', 'Flat Rs. 500 festive discount', 'FIXED', 500.00, 2, '2024-01-01', '2027-12-31');
    insertDiscount.run('LONGTRIP15', 'Long vacation 15% off for 5+ days rental', 'PERCENTAGE', 15.00, 5, '2024-01-01', '2027-12-31');

    // 5. Bookings, Invoices & Payments
    const insertBooking = db.prepare(`
        INSERT INTO bookings (
            booking_reference, customer_id, vehicle_id, pickup_datetime, expected_return_datetime,
            actual_pickup_datetime, actual_return_datetime, status, agreed_daily_rate,
            start_odometer, end_odometer, start_fuel_level, end_fuel_level,
            handover_notes, return_notes, cancellation_reason, cancelled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertInvoice = db.prepare(`
        INSERT INTO invoices (
            invoice_number, booking_id, billable_days, rental_charge, discount_amount,
            extra_charges, late_days, late_fee, total_amount, paid_amount,
            refunded_amount, outstanding_balance, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
        INSERT INTO payments (
            transaction_reference, invoice_id, amount, payment_method, type, status, payment_details, failure_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Booking 1: Completed rental (Customer 1, Vehicle 1 Hyundai i20)
    // 3 days rental, completely paid via UPI
    const b1 = insertBooking.run(
        'BK-2026-0001', c1, v01, '2026-09-10 09:00:00', '2026-09-13 09:00:00',
        '2026-09-10 09:15:00', '2026-09-13 09:00:00', 'COMPLETED', 1500.00,
        24000, 24500, '100%', '100%',
        'Vehicle clean, verified DL and Aadhaar card.', 'Returned in pristine condition.', null, null
    ).lastInsertRowid;

    const inv1 = insertInvoice.run(
        'INV-2026-0001', b1, 3, 4500.00, 450.00, // 10% discount
        0.00, 0, 0.00, 4050.00, 4050.00,
        0.00, 0.00, 'PAID', 'Settled in full via Google Pay UPI.'
    ).lastInsertRowid;

    insertPayment.run('TXN-UPI-901122', inv1, 4050.00, 'UPI', 'PAYMENT', 'SUCCESS', '{"upi_id":"rahul@okaxis","provider":"GooglePay"}', null);

    // Booking 2: Completed rental (Customer 2, Vehicle 2 Honda City)
    // 2 days rental, paid via Card
    const b2 = insertBooking.run(
        'BK-2026-0002', c2, v02, '2026-09-15 10:00:00', '2026-09-17 10:00:00',
        '2026-09-15 10:10:00', '2026-09-17 10:30:00', 'COMPLETED', 2200.00,
        17800, 18200, '100%', '90%',
        'Handover checklist signed.', 'Minor dust, fuel topped up.', null, null
    ).lastInsertRowid;

    const inv2 = insertInvoice.run(
        'INV-2026-0002', b2, 2, 4400.00, 0.00,
        0.00, 0, 0.00, 4400.00, 4400.00,
        0.00, 0.00, 'PAID', 'Paid using HDFC Visa Debit Card'
    ).lastInsertRowid;

    insertPayment.run('TXN-CARD-448811', inv2, 4400.00, 'CARD', 'PAYMENT', 'SUCCESS', '{"last4":"4242","network":"Visa"}', null);

    // Booking 3: Active Rental (Customer 3, Vehicle 5 XUV700)
    // Rented from yesterday to day after tomorrow. Partially paid advance!
    const b3 = insertBooking.run(
        'BK-2026-0003', c3, v05, '2026-10-19 10:00:00', '2026-10-22 10:00:00',
        '2026-10-19 10:30:00', null, 'ACTIVE', 3800.00,
        28600, null, '100%', null,
        'Vehicle handed over with original toolkit and spare wheel.', null, null, null
    ).lastInsertRowid;

    const inv3 = insertInvoice.run(
        'INV-2026-0003', b3, 3, 11400.00, 500.00, // FESTIVE500
        0.00, 0, 0.00, 10900.00, 5000.00,
        0.00, 5900.00, 'PARTIALLY_PAID', 'Advance ₹5000 received; balance ₹5900 due on return'
    ).lastInsertRowid;

    insertPayment.run('TXN-CASH-771122', inv3, 5000.00, 'CASH', 'PAYMENT', 'SUCCESS', '{"received_by":"Suresh Babu","receipt_no":"FD-RCP-089"}', null);

    // Booking 4: Overdue Rental (Customer 4, Vehicle 6 Creta)
    // Scheduled return was yesterday 10:00 AM! Now overdue by ~36 hours!
    // Demonstrates Section 12 penalty multiplier:
    // Rate = 2800, expected return 2026-10-19 10:00, overdue by ~36 hours -> Math.ceil(36/24) = 2 late days!
    // Late fee = 2 * 2800 * 1.5 = Rs. 8400!
    const b4 = insertBooking.run(
        'BK-2026-0004', c4, v06, '2026-10-16 10:00:00', '2026-10-19 10:00:00',
        '2026-10-16 10:20:00', null, 'OVERDUE', 2800.00,
        20800, null, '100%', null,
        'Handed over in spotless condition.', 'Customer informed about delay due to highway traffic.', null, null
    ).lastInsertRowid;

    const inv4 = insertInvoice.run(
        'INV-2026-0004', b4, 3, 8400.00, 0.00,
        0.00, 2, 8400.00, 16800.00, 8400.00,
        0.00, 8400.00, 'PARTIALLY_PAID', 'Base rental paid; late fee of ₹8,400 pending upon check-in'
    ).lastInsertRowid;

    insertPayment.run('TXN-UPI-334411', inv4, 8400.00, 'UPI', 'PAYMENT', 'SUCCESS', '{"upi_id":"sneha@okhdfc","provider":"PhonePe"}', null);

    // Booking 5: Future Confirmed Reservation (Customer 5, Vehicle 7 Innova Crysta)
    // Pickup next week
    const b5 = insertBooking.run(
        'BK-2026-0005', c5, v07, '2026-10-25 08:00:00', '2026-10-28 20:00:00',
        null, null, 'CONFIRMED', 3500.00,
        null, null, null, null,
        null, null, null, null
    ).lastInsertRowid;

    const inv5 = insertInvoice.run(
        'INV-2026-0005', b5, 4, 14000.00, 2100.00, // 15% long trip discount
        0.00, 0, 0.00, 11900.00, 0.00,
        0.00, 11900.00, 'UNPAID', 'Reservation confirmed. Payment scheduled at vehicle pickup.'
    ).lastInsertRowid;

    // Booking 6: Future Pending Reservation (Customer 6, Vehicle 13 Nexon EV)
    const b6 = insertBooking.run(
        'BK-2026-0006', c6, v13, '2026-11-01 09:00:00', '2026-11-03 09:00:00',
        null, null, 'PENDING', 2600.00,
        null, null, null, null,
        null, null, null, null
    ).lastInsertRowid;

    const inv6 = insertInvoice.run(
        'INV-2026-0006', b6, 2, 5200.00, 0.00,
        0.00, 0, 0.00, 5200.00, 0.00,
        0.00, 5200.00, 'UNPAID', 'Pending verification of customer documents.'
    ).lastInsertRowid;

    // Booking 7: Cancelled Reservation (Customer 7, Vehicle 8 Harrier)
    const b7 = insertBooking.run(
        'BK-2026-0007', c7, v08, '2026-10-05 09:00:00', '2026-10-07 09:00:00',
        null, null, 'CANCELLED', 3200.00,
        null, null, null, null,
        null, null, 'Customer personal travel plans rescheduled.', '2026-10-03 14:20:00'
    ).lastInsertRowid;

    // Simulated Failed and Refunded Transactions to satisfy requirements:
    // Record a failed card simulation attempt on inv6
    insertPayment.run('TXN-SIM-FAIL-01', inv6, 5200.00, 'CARD', 'PAYMENT', 'FAILED', '{"card_type":"Credit","bank":"SBI"}', 'Simulation: Bank OTP verification timed out by user');

    // Record an auditable refund simulation on invoice 1 (partial refund of ₹500 security deposit return)
    insertPayment.run('TXN-REFUND-001', inv1, 500.00, 'UPI', 'REFUND', 'REFUNDED', '{"reason":"Promotional cashback credit adjustments"}', null);

    // 6. Maintenance Records
    const insertMaint = db.prepare(`
        INSERT INTO maintenance_records (
            vehicle_id, service_type, description, cost, start_date, completion_date, next_service_due, status, service_center, technician_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // In Progress maintenance for Skoda Slavia (Vehicle 4)
    insertMaint.run(v04, 'Brake Pad Replacement & Periodic Service', 'Routine 15,000 km checkup and front ceramic brake pad replacement.', 6800.00, '2026-10-18', null, '2027-04-18', 'IN_PROGRESS', 'EVM Skoda Authorized Service Center, Kalamassery', 'Parts dispatched from warehouse. Reassembly scheduled.');

    // Completed maintenance for Hyundai i20 (Vehicle 1)
    insertMaint.run(v01, 'Scheduled Engine Oil & Filter Change', 'Synthetic oil flush, oil filter, AC pollen filter, wheel alignment and balancing.', 4200.00, '2026-08-15', '2026-08-16', '2027-02-15', 'COMPLETED', 'Popular Hyundai, Vyttila', 'All fluids checked and topped up. Ready for highway driving.');

    // Scheduled maintenance for Toyota Innova Crysta (Vehicle 7)
    insertMaint.run(v07, '50,000 KM Major Inspection', 'Timing belt tensioner check, transmission fluid change, suspension bushing lubrication.', 12500.00, '2026-11-15', null, '2027-05-15', 'SCHEDULED', 'Nippon Toyota Service, Nettoor', 'Scheduled ahead of holiday tour bookings.');

    // 7. Customer Reviews for Completed Bookings
    const insertReview = db.prepare(`
        INSERT INTO reviews (booking_id, customer_id, vehicle_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertReview.run(b1, c1, v01, 5, 'The Hyundai i20 was sparkling clean and performed flawlessly on our Munnar trip. Smooth handover process!');
    insertReview.run(b2, c2, v02, 5, 'Honda City CVT was an absolute joy to drive. ADAS features made highway cruising effortless. Will rent again.');

    // 8. Audit Logs
    const insertAudit = db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(uAdmin, 'SYSTEM_INIT', 'DATABASE', 'ALL', 'Initial schema creation and seed executed successfully.', '127.0.0.1');
    insertAudit.run(uStaff1, 'HANDOVER_RECORDED', 'BOOKING', b3.toString(), 'Vehicle KL-07-XY-7001 handed over to customer Rohit Verma.', '127.0.0.1');
    insertAudit.run(uStaff1, 'OVERDUE_FLAGGED', 'BOOKING', b4.toString(), 'Booking BK-2026-0004 flagged overdue. Staff contacted customer.', '127.0.0.1');

    console.log('✅ Seed data successfully inserted:');
    console.log('   - 11 App Users (1 Admin, 2 Staff, 8 Customers)');
    console.log('   - 15 Vehicles across CAR, SUV, BIKE, ELECTRIC_VEHICLE');
    console.log('   - 4 Active Discount Promotional Vouchers');
    console.log('   - 7 Realistic Bookings (Completed, Active, Overdue, Confirmed, Pending, Cancelled)');
    console.log('   - 6 Invoices & Associated Payments/Refunds');
    console.log('   - 3 Maintenance Records (In Progress, Completed, Scheduled)');
    console.log('   - 2 Verified Customer Reviews & Audit Logs');
}

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
