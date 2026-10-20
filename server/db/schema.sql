-- FleetDesk SQLite Database Schema
-- B.Tech CSE PBL Project (KTU PBCST304 2024 Scheme)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    driving_licence_number VARCHAR(50) UNIQUE NOT NULL,
    licence_expiry_date DATE NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) DEFAULT 'Operations',
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK(category IN ('CAR', 'BIKE', 'SUV', 'ELECTRIC_VEHICLE')),
    manufacturing_year INTEGER NOT NULL,
    fuel_type VARCHAR(30) NOT NULL CHECK(fuel_type IN ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG')),
    seating_capacity INTEGER NOT NULL,
    transmission VARCHAR(30) NOT NULL CHECK(transmission IN ('MANUAL', 'AUTOMATIC', 'SINGLE_SPEED')),
    daily_rental_rate DECIMAL(10, 2) NOT NULL CHECK(daily_rental_rate > 0),
    operational_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK(operational_status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'DEACTIVATED')),
    description TEXT,
    image_url TEXT,
    odometer_reading INTEGER NOT NULL DEFAULT 0,
    insurance_expiry DATE NOT NULL,
    battery_capacity_kwh DECIMAL(6, 2) DEFAULT NULL,
    engine_cc INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    pickup_datetime DATETIME NOT NULL,
    expected_return_datetime DATETIME NOT NULL,
    actual_pickup_datetime DATETIME DEFAULT NULL,
    actual_return_datetime DATETIME DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'CANCELLED', 'COMPLETED', 'OVERDUE')),
    agreed_daily_rate DECIMAL(10, 2) NOT NULL,
    start_odometer INTEGER DEFAULT NULL,
    end_odometer INTEGER DEFAULT NULL,
    start_fuel_level VARCHAR(20) DEFAULT NULL,
    end_fuel_level VARCHAR(20) DEFAULT NULL,
    handover_notes TEXT DEFAULT NULL,
    return_notes TEXT DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
    billable_days INTEGER NOT NULL CHECK(billable_days >= 1),
    rental_charge DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    extra_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    late_days INTEGER NOT NULL DEFAULT 0,
    late_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL CHECK(total_amount >= 0.00),
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    refunded_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'CANCELLED')),
    notes TEXT,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_reference VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL CHECK(amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK(payment_method IN ('UPI', 'CARD', 'CASH')),
    type VARCHAR(20) NOT NULL DEFAULT 'PAYMENT' CHECK(type IN ('PAYMENT', 'REFUND')),
    status VARCHAR(20) NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'REFUNDED')),
    payment_details TEXT,
    failure_reason TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    service_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    completion_date DATE DEFAULT NULL,
    next_service_due DATE DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')),
    service_center VARCHAR(150),
    technician_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL CHECK(discount_type IN ('PERCENTAGE', 'FIXED')),
    value DECIMAL(10, 2) NOT NULL,
    min_rental_days INTEGER DEFAULT 1,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES app_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(operational_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(vehicle_id, pickup_datetime, expected_return_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id, status);
