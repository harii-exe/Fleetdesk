-- FleetDesk MySQL 8.x Sample Seed Data
-- Flyway Database Migration V2__seed_sample_data.sql

-- System Settings
INSERT INTO system_settings (`key`, value, description) VALUES
('penalty_multiplier', '1.5', 'Overdue penalty multiplier for late returns'),
('cancellation_fee', '200.00', 'Standard cancellation charge in INR'),
('tax_rate', '0.05', 'Applicable GST rate'),
('currency', 'INR', 'Default system currency'),
('company_name', 'FleetDesk Mobility Solutions Pvt Ltd', 'Company legal entity');

-- App Users (BCrypt hashed passwords for development test accounts)
-- Passwords: Admin@123, Staff@123, Customer@123
INSERT INTO app_users (id, username, email, password_hash, role, status) VALUES
(1, 'admin', 'admin@fleetdesk.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'ADMIN', 'ACTIVE'),
(2, 'staff1', 'staff@fleetdesk.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'STAFF', 'ACTIVE'),
(3, 'staff2', 'arun.nair@fleetdesk.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'STAFF', 'ACTIVE'),
(4, 'rahul', 'rahul.sharma@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(5, 'ananya', 'ananya.patel@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(6, 'rohit', 'rohit.verma@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(7, 'sneha', 'sneha.menon@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(8, 'kavya', 'kavya.nair@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(9, 'vikram', 'vikram.singh@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(10, 'deepa', 'deepa.krishnan@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE'),
(11, 'arjun', 'arjun.das@example.com', '$2a$10$w8T9c0xXbZyV4oQ1R5nUe.mC8oGq.a6bF9h1vJ3kK5lM7nO9pQrSi', 'CUSTOMER', 'ACTIVE');

-- Staff Profiles
INSERT INTO staff_profiles (user_id, employee_code, full_name, department, phone) VALUES
(2, 'FD-STAFF-101', 'Suresh Babu', 'Fleet Operations', '+91 98470 11223'),
(3, 'FD-STAFF-102', 'Arun Nair', 'Customer Relations', '+91 98470 33445');

-- Customers
INSERT INTO customers (id, user_id, full_name, phone, address, driving_licence_number, licence_expiry_date, account_status) VALUES
(1, 4, 'Rahul Sharma', '+91 98765 43210', 'Flat 4B, Skyline Meadows, Kakkanad, Kochi, Kerala', 'KL-07-20180012345', '2030-05-15', 'ACTIVE'),
(2, 5, 'Ananya Patel', '+91 98765 43211', '12/480, Marine Drive, Kochi, Kerala', 'KL-07-20190087654', '2029-11-20', 'ACTIVE'),
(3, 6, 'Rohit Verma', '+91 98765 43212', '7A, Asset Symphony, Edappally, Kochi, Kerala', 'KL-07-20200054321', '2031-03-10', 'ACTIVE'),
(4, 7, 'Sneha Menon', '+91 98765 43213', 'B-102, Purva Grand, Vazhakkala, Kochi, Kerala', 'KL-07-20170099887', '2028-08-25', 'ACTIVE'),
(5, 8, 'Kavya Nair', '+91 98765 43214', 'Green Villa, Pattom, Thiruvananthapuram, Kerala', 'KL-01-20190044556', '2029-09-30', 'ACTIVE'),
(6, 9, 'Vikram Singh', '+91 98765 43215', '404, Oberon Enclave, Vyttila, Kochi, Kerala', 'KL-07-20210022334', '2032-01-18', 'ACTIVE'),
(7, 10, 'Deepa Krishnan', '+91 98765 43216', '33/201, Calicut Beach Road, Kozhikode, Kerala', 'KL-11-20180077889', '2030-10-12', 'ACTIVE'),
(8, 11, 'Arjun Das', '+91 98765 43217', 'Villa 8, Silver Sand, Aluva, Ernakulam, Kerala', 'KL-07-20220033112', '2033-04-05', 'ACTIVE');

-- Vehicles (15 Vehicles covering CAR, SUV, BIKE, ELECTRIC_VEHICLE)
INSERT INTO vehicles (id, registration_number, brand, model, category, manufacturing_year, fuel_type, seating_capacity, transmission, daily_rental_rate, operational_status, description, image_url, odometer_reading, insurance_expiry, battery_capacity_kwh, engine_cc) VALUES
(1, 'KL-07-CD-1001', 'Hyundai', 'i20 Asta', 'CAR', 2023, 'PETROL', 5, 'MANUAL', 1500.00, 'AVAILABLE', 'Sporty premium hatchback with sunroof and 10.25-inch touchscreen.', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80', 24500, '2027-08-30', NULL, 1197),
(2, 'KL-07-CD-1002', 'Honda', 'City ZX CVT', 'CAR', 2023, 'PETROL', 5, 'AUTOMATIC', 2200.00, 'AVAILABLE', 'Executive sedan with plush leather and ADAS sensing.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80', 18200, '2027-10-15', NULL, 1498),
(3, 'KL-01-AB-4455', 'Maruti Suzuki', 'Swift ZXi', 'CAR', 2022, 'PETROL', 5, 'MANUAL', 1200.00, 'AVAILABLE', 'Reliable city commuter with cruise control.', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80', 31000, '2027-05-10', NULL, 1197),
(4, 'KL-08-EF-8899', 'Skoda', 'Slavia Style DSG', 'CAR', 2024, 'PETROL', 5, 'AUTOMATIC', 2600.00, 'MAINTENANCE', '1.5 TSI turbocharged performance sedan.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80', 12400, '2028-01-20', NULL, 1498),
(5, 'KL-07-XY-7001', 'Mahindra', 'XUV700 AX7L', 'SUV', 2023, 'DIESEL', 7, 'AUTOMATIC', 3800.00, 'RENTED', 'Flagship luxury 7-seater SUV with panoramic skyroof and ADAS.', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80', 29000, '2027-09-12', NULL, 2198),
(6, 'KL-07-XY-7002', 'Hyundai', 'Creta SX(O)', 'SUV', 2023, 'DIESEL', 5, 'AUTOMATIC', 2800.00, 'RENTED', 'Compact premium SUV with ventilated seats and Bose audio.', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80', 21500, '2027-11-05', NULL, 1493),
(7, 'KL-11-MN-3321', 'Toyota', 'Innova Crysta 2.4 VX', 'SUV', 2022, 'DIESEL', 7, 'MANUAL', 3500.00, 'AVAILABLE', 'Legendary highway tourer with captain seats.', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80', 45000, '2027-04-18', NULL, 2393),
(8, 'KL-01-PQ-9911', 'Tata', 'Harrier Fearless Plus', 'SUV', 2024, 'DIESEL', 5, 'AUTOMATIC', 3200.00, 'AVAILABLE', 'Land Rover pedigree D8 platform SUV with 360 camera.', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80', 19800, '2028-02-14', NULL, 1956),
(9, 'KL-07-BK-5001', 'Royal Enfield', 'Classic 350 Reborn', 'BIKE', 2023, 'PETROL', 2, 'MANUAL', 900.00, 'AVAILABLE', 'Timeless cruiser with dual-channel ABS.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80', 14000, '2027-06-25', NULL, 349),
(10, 'KL-07-BK-5002', 'KTM', 'Duke 390 Gen 3', 'BIKE', 2024, 'PETROL', 2, 'MANUAL', 1400.00, 'AVAILABLE', '45 hp streetfighter with cornering traction control.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80', 9800, '2028-03-10', NULL, 399),
(11, 'KL-01-BK-2022', 'Yamaha', 'MT-15 V2', 'BIKE', 2023, 'PETROL', 2, 'MANUAL', 800.00, 'AVAILABLE', 'Naked agility champion with VVA engine.', 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80', 11200, '2027-07-22', NULL, 155),
(12, 'KL-08-BK-7744', 'Honda', 'Activa 6G Premium', 'BIKE', 2023, 'PETROL', 2, 'AUTOMATIC', 500.00, 'AVAILABLE', 'Reliable gearless city commuter scooter.', 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=600&q=80', 8900, '2027-12-01', NULL, 109),
(13, 'KL-07-EV-9001', 'Tata', 'Nexon EV Empowered+', 'ELECTRIC_VEHICLE', 2024, 'ELECTRIC', 5, 'SINGLE_SPEED', 2600.00, 'AVAILABLE', 'Zero-emission electric SUV with 465 km range and V2L charging.', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80', 16500, '2028-04-15', 40.50, NULL),
(14, 'KL-01-EV-9002', 'MG', 'ZS EV Exclusive Pro', 'ELECTRIC_VEHICLE', 2023, 'ELECTRIC', 5, 'SINGLE_SPEED', 3400.00, 'AVAILABLE', 'Long range 50.3 kWh EV with ADAS safety.', 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=600&q=80', 11000, '2027-08-10', 50.30, NULL),
(15, 'KL-07-EV-9003', 'Ather', '450X Gen 3', 'ELECTRIC_VEHICLE', 2023, 'ELECTRIC', 2, 'SINGLE_SPEED', 650.00, 'AVAILABLE', 'Smart connected high-performance e-scooter.', 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80', 7300, '2027-09-20', 3.70, NULL);

-- Discounts
INSERT INTO discounts (code, description, discount_type, value, min_rental_days, valid_from, valid_until, is_active) VALUES
('WELCOME10', '10% welcome bonus', 'PERCENTAGE', 10.00, 2, '2024-01-01', '2027-12-31', TRUE),
('WEEKEND20', '20% off for weekend trips', 'PERCENTAGE', 20.00, 3, '2024-01-01', '2027-12-31', TRUE),
('FESTIVE500', 'Rs. 500 festive credit', 'FIXED', 500.00, 2, '2024-01-01', '2027-12-31', TRUE),
('LONGTRIP15', '15% vacation discount for 5+ days', 'PERCENTAGE', 15.00, 5, '2024-01-01', '2027-12-31', TRUE);

-- Bookings, Invoices & Payments
INSERT INTO bookings (id, booking_reference, customer_id, vehicle_id, pickup_datetime, expected_return_datetime, actual_pickup_datetime, actual_return_datetime, status, agreed_daily_rate, start_odometer, end_odometer) VALUES
(1, 'BK-2026-0001', 1, 1, '2026-09-10 09:00:00', '2026-09-13 09:00:00', '2026-09-10 09:15:00', '2026-09-13 09:00:00', 'COMPLETED', 1500.00, 24000, 24500),
(2, 'BK-2026-0002', 2, 2, '2026-09-15 10:00:00', '2026-09-17 10:00:00', '2026-09-15 10:10:00', '2026-09-17 10:30:00', 'COMPLETED', 2200.00, 17800, 18200),
(3, 'BK-2026-0003', 3, 5, '2026-10-19 10:00:00', '2026-10-22 10:00:00', '2026-10-19 10:30:00', NULL, 'ACTIVE', 3800.00, 28600, NULL),
(4, 'BK-2026-0004', 4, 6, '2026-10-16 10:00:00', '2026-10-19 10:00:00', '2026-10-16 10:20:00', NULL, 'OVERDUE', 2800.00, 20800, NULL);

INSERT INTO invoices (id, invoice_number, booking_id, billable_days, rental_charge, discount_amount, extra_charges, late_days, late_fee, total_amount, paid_amount, refunded_amount, outstanding_balance, payment_status, notes) VALUES
(1, 'INV-2026-0001', 1, 3, 4500.00, 450.00, 0.00, 0, 0.00, 4050.00, 4050.00, 0.00, 0.00, 'PAID', 'Settled via Google Pay UPI'),
(2, 'INV-2026-0002', 2, 2, 4400.00, 0.00, 0.00, 0, 0.00, 4400.00, 4400.00, 0.00, 0.00, 'PAID', 'Settled via Visa Debit Card'),
(3, 'INV-2026-0003', 3, 3, 11400.00, 500.00, 0.00, 0, 0.00, 10900.00, 5000.00, 0.00, 5900.00, 'PARTIALLY_PAID', 'Advance ₹5000 received'),
(4, 'INV-2026-0004', 4, 3, 8400.00, 0.00, 0.00, 2, 8400.00, 16800.00, 8400.00, 0.00, 8400.00, 'PARTIALLY_PAID', 'Late fee pending return');

INSERT INTO payments (transaction_reference, invoice_id, amount, payment_method, type, status, payment_details) VALUES
('TXN-UPI-901122', 1, 4050.00, 'UPI', 'PAYMENT', 'SUCCESS', '{"upi_id":"rahul@okaxis"}'),
('TXN-CARD-448811', 2, 4400.00, 'CARD', 'PAYMENT', 'SUCCESS', '{"last4":"4242"}'),
('TXN-CASH-771122', 3, 5000.00, 'CASH', 'PAYMENT', 'SUCCESS', '{"received_by":"Suresh Babu"}'),
('TXN-UPI-334411', 4, 8400.00, 'UPI', 'PAYMENT', 'SUCCESS', '{"upi_id":"sneha@okhdfc"}');

-- Maintenance
INSERT INTO maintenance_records (vehicle_id, service_type, description, cost, start_date, completion_date, status, service_center) VALUES
(4, 'Brake Pad Replacement & Periodic Checkup', 'Routine checkup and front ceramic brake pads.', 6800.00, '2026-10-18', NULL, 'IN_PROGRESS', 'EVM Skoda Authorized Service Center'),
(1, 'Scheduled Engine Oil Flush', 'Synthetic oil flush, filter change, alignment.', 4200.00, '2026-08-15', '2026-08-16', 'COMPLETED', 'Popular Hyundai Vyttila');
