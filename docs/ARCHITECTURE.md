# FleetDesk — System Architecture & Component Design

## 1. High-Level Architectural Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Presentation Layer (Client)"]
        UI["Tailwind CSS + Pure SPA Client"]
        State["AppState (Reactive Store)"]
        Router["ClientRouter (Hash-based)"]
        APIClient["API Client (REST/JSON)"]
    end

    subgraph ServiceLayer ["Application & Business Logic Layer"]
        AuthMiddleware["JWT Authentication & RBAC Guard"]
        RouterDispatcher["REST Request Dispatcher"]
        BookingService["BookingService (Interval Collision Engine)"]
        BillingService["BillingService (24-hr Blocks & Late Fee Multiplier)"]
        PaymentService["PaymentService (Polymorphic Simulation)"]
        ReportService["ReportService (Aggregations & CSV Export)"]
    end

    subgraph PersistenceLayer ["Persistent Data Access Layer"]
        DBEngine["SQLite3 Engine (node:sqlite) / MySQL 8.x"]
        Schema["Flyway / SQL Migrations"]
        Tables["app_users | customers | vehicles | bookings | invoices | payments"]
    end

    UI --> Router
    Router --> State
    State --> APIClient
    APIClient -->|HTTPS REST| AuthMiddleware
    AuthMiddleware --> RouterDispatcher
    RouterDispatcher --> BookingService
    RouterDispatcher --> BillingService
    RouterDispatcher --> PaymentService
    RouterDispatcher --> ReportService
    BookingService --> DBEngine
    BillingService --> DBEngine
    PaymentService --> DBEngine
    ReportService --> DBEngine
    DBEngine --> Tables
```

## 2. Sequence Diagram: Booking Creation & Collision Revalidation

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Staff
    participant Client as Web Frontend
    participant API as BookingController
    participant Service as BookingService
    participant DB as Persistent Database (SQLite/MySQL)

    Customer->>Client: Select vehicle, pickup and return date/time
    Client->>API: POST /api/bookings/check-availability
    API->>Service: checkVehicleAvailability(vehId, start, end)
    Service->>DB: SELECT * FROM bookings WHERE vehicle_id = ? AND overlap
    DB-->>Service: Return matching records (if any)
    Service-->>API: { available: true/false }
    API-->>Client: Display live availability status

    Customer->>Client: Submit Reservation Form
    Client->>API: POST /api/bookings (Payload + Bearer Token)
    API->>Service: createBooking(data)
    Note over Service,DB: Begin Atomic Database Transaction
    Service->>DB: Re-verify Overlap Collision
    alt Collision Detected
        Service-->>API: throw BookingConflictException
        API-->>Client: 409 Conflict: Vehicle already reserved
    else Available
        Service->>DB: INSERT INTO bookings (Agreed daily rate snapshotted)
        Service->>Service: Compute billable days (ceil(hours/24))
        Service->>DB: INSERT INTO invoices (Total amount, payment_status=UNPAID)
        Service->>DB: Commit Transaction
        Service-->>API: BookingCreatedResult
        API-->>Client: 201 Created { bookingReference, invoiceNumber }
        Client-->>Customer: Display Booking Dossier with Print Option
    end
```

## 3. Sequence Diagram: Vehicle Handover and Check-in Return

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Desk Staff
    participant UI as Dispatch Desk
    participant Billing as BillingService
    participant DB as Persistent Database

    Staff->>UI: Record Handover (Start Odo, Fuel %, Notes)
    UI->>Billing: POST /api/bookings/:id/handover
    Billing->>DB: UPDATE bookings SET status='ACTIVE', actual_pickup=NOW()
    Billing->>DB: UPDATE vehicles SET operational_status='RENTED'
    DB-->>UI: 200 Handover Confirmed

    Note over Staff,DB: Customer drives vehicle during rental trip

    Staff->>UI: Process Return (Final Odo, Fuel %, Damage Charges)
    UI->>Billing: POST /api/bookings/:id/return
    Billing->>Billing: Calculate overdue hours & late days
    Billing->>Billing: Late Fee = late days * daily rate * 1.5
    Billing->>DB: UPDATE invoices (Rental charge + Late fee + Damage)
    Billing->>DB: UPDATE bookings SET status='COMPLETED', actual_return=NOW()
    Billing->>DB: UPDATE vehicles SET operational_status='AVAILABLE'
    DB-->>UI: 200 Return Reconciled with Final Invoice
```
