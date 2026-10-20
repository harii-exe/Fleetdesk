# FleetDesk — Database Entity Relationship Diagram (ERD)

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    APP_USERS ||--o| CUSTOMERS : "profile for"
    APP_USERS ||--o| STAFF_PROFILES : "staff profile for"
    APP_USERS ||--o{ AUDIT_LOGS : "logs actions of"

    CUSTOMERS ||--o{ BOOKINGS : "places"
    CUSTOMERS ||--o{ REVIEWS : "writes"

    VEHICLES ||--o{ BOOKINGS : "reserved in"
    VEHICLES ||--o{ MAINTENANCE_RECORDS : "undergoes"
    VEHICLES ||--o{ REVIEWS : "evaluated in"

    BOOKINGS ||--|| INVOICES : "billed under"
    BOOKINGS ||--o| REVIEWS : "reviewed via"

    INVOICES ||--o{ PAYMENTS : "reconciled with"

    APP_USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        string role
        string status
        timestamp created_at
    }

    CUSTOMERS {
        int id PK
        int user_id FK, UK
        string full_name
        string phone
        text address
        string driving_licence_number UK
        date licence_expiry_date
        string account_status
    }

    VEHICLES {
        int id PK
        string registration_number UK
        string brand
        string model
        string category
        int manufacturing_year
        string fuel_type
        int seating_capacity
        string transmission
        decimal daily_rental_rate
        string operational_status
        int odometer_reading
        date insurance_expiry
    }

    BOOKINGS {
        int id PK
        string booking_reference UK
        int customer_id FK
        int vehicle_id FK
        datetime pickup_datetime
        datetime expected_return_datetime
        datetime actual_pickup_datetime
        datetime actual_return_datetime
        string status
        decimal agreed_daily_rate
        int start_odometer
        int end_odometer
    }

    INVOICES {
        int id PK
        string invoice_number UK
        int booking_id FK, UK
        int billable_days
        decimal rental_charge
        decimal discount_amount
        decimal extra_charges
        int late_days
        decimal late_fee
        decimal total_amount
        decimal paid_amount
        decimal outstanding_balance
        string payment_status
    }

    PAYMENTS {
        int id PK
        string transaction_reference UK
        int invoice_id FK
        decimal amount
        string payment_method
        string type
        string status
        timestamp created_at
    }

    MAINTENANCE_RECORDS {
        int id PK
        int vehicle_id FK
        string service_type
        text description
        decimal cost
        date start_date
        date completion_date
        string status
    }
```

## 2. Relational Schema Data Dictionary

| Table | Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `app_users` | `id` | INTEGER | PK, AUTO_INCREMENT | System user identifier |
| | `username` | VARCHAR(100) | UNIQUE, NOT NULL | Authentication username |
| | `email` | VARCHAR(150) | UNIQUE, NOT NULL | User email address |
| | `password_hash`| VARCHAR(255) | NOT NULL | PBKDF2/BCrypt salted hash |
| | `role` | VARCHAR(20) | CHECK IN (ADMIN, STAFF, CUSTOMER) | Role for RBAC authorization |
| `vehicles` | `id` | INTEGER | PK, AUTO_INCREMENT | Unique vehicle inventory ID |
| | `registration_number` | VARCHAR(50) | UNIQUE, NOT NULL | Regional RTO registration (e.g. KL-07-CD-1001) |
| | `category` | VARCHAR(30) | CHECK IN (CAR, BIKE, SUV, ELECTRIC_VEHICLE) | Vehicle classification |
| | `daily_rental_rate` | DECIMAL(10,2)| NOT NULL, > 0 | Baseline daily rental tariff |
| | `operational_status`| VARCHAR(30) | CHECK IN (AVAILABLE, RENTED, MAINTENANCE, DEACTIVATED) | Telematics operational status |
| `bookings` | `id` | INTEGER | PK, AUTO_INCREMENT | Reservation primary key |
| | `booking_reference` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable tracking reference (e.g. BK-2026-0001) |
| | `customer_id`| INTEGER | FK -> customers(id) | Associated customer |
| | `vehicle_id` | INTEGER | FK -> vehicles(id) | Associated fleet vehicle |
| | `agreed_daily_rate` | DECIMAL(10,2)| NOT NULL | Snapshotted rate preventing retrospective price changes |
| | `status` | VARCHAR(20) | CHECK IN (PENDING, CONFIRMED, ACTIVE, CANCELLED, COMPLETED, OVERDUE) | Current booking lifecycle state |
| `invoices` | `id` | INTEGER | PK, AUTO_INCREMENT | Invoice primary key |
| | `invoice_number` | VARCHAR(50) | UNIQUE, NOT NULL | Invoicing document code (e.g. INV-2026-0001) |
| | `late_days` | INTEGER | DEFAULT 0 | Ceiling of overdue hours / 24 |
| | `late_fee` | DECIMAL(10,2)| DEFAULT 0.00 | Calculated using configured 1.5x penalty multiplier |
| | `payment_status` | VARCHAR(20) | CHECK IN (UNPAID, PARTIALLY_PAID, PAID, REFUNDED, CANCELLED) | Commercial balance settlement status |
