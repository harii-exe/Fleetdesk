# FleetDesk — Smart Vehicle Rental & Fleet Management System

**Academic Context:** KTU B.Tech Computer Science and Engineering  
**Course:** Project-Based Learning (PBL) — PBCST304 (2024 Scheme)  
**System Type:** Enterprise Vehicle Rental ERP & Fleet Telematics  

---

## 🚀 Executive Summary

**FleetDesk** is a production-grade, full-stack vehicle rental and fleet management platform developed for academic evaluation under APJ Abdul Kalam Technological University (KTU). The system automates vehicle inventory tracking, date-based reservation conflict detection, vehicle handovers (odometers, fuel levels), check-in return reconciliation, 24-hour block billing, late fee penalties with configurable multipliers, simulated multi-channel payments, workshop maintenance logs, and financial intelligence reports.

---

## 🛠️ Dual-Stack Implementation Strategy

Per project specification guidelines, the application provides:
1. **Fully Operational Web Application (Node.js + Persistent SQLite + Responsive SPA):**
   - **Backend Engine:** Built on Node.js v24 utilizing zero-dependency in-process `node:sqlite` for true ACID-compliant persistent database storage with foreign keys, transactional integrity, and PBKDF2 cryptography.
   - **Frontend Client:** Decoupled single-page application built with modern Tailwind CSS, Lucide icons, responsive sidebar/navbar navigation, custom SVG charts, printable invoice generators, and role-based access control across all 20 views.
2. **Complete Academic Java 17 / Spring Boot 3 Backend Specification:**
   - **Architecture:** Complete Java source structure located in `java-backend/` featuring Spring Boot 3.3.4, Spring Data JPA, Spring Security 6 with JWT, Flyway database migrations (`V1__init_schema.sql`, `V2__seed_sample_data.sql`), MySQL 8.x integration, JUnit 5 + Mockito unit tests, and full demonstration of OOP principles (Encapsulation, Inheritance, Abstraction, Polymorphism, Composition).

---

## 🔑 Pre-Seeded Evaluation Accounts

FleetDesk includes a secure development seed dataset featuring 11 App Users, 15 Vehicles across all categories, and active bookings:

| Role | Username / Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` / `admin@fleetdesk.com` | `Admin@123` | Full administrative control, vehicle CRUD, staff management, settings, refunds |
| **Staff** | `staff1` / `staff@fleetdesk.com` | `Staff@123` | Customer onboarding, vehicle handover/dispatch, check-in return, maintenance bay |
| **Customer** | `rahul` / `rahul.sharma@example.com` | `Customer@123` | Vehicle browsing, live availability checks, trip booking, payment simulation, reviews |

*(Note: The login view includes instant single-click demo buttons for all three accounts).*

---

## ⚡ Quick Start Instructions

### Running the Operational Web Application:
To run the server and open the client portal:
```powershell
# 1. Navigate to the project root
cd C:\Users\harig\.gemini\antigravity\scratch\fleetdesk

# 2. Seed or reset the database (Already seeded!)
agy-node server/db/seed.js

# 3. Launch the FleetDesk HTTP server
agy-node server/src/app.js
```
The server will start listening at:
- **Web Application Portal:** `http://localhost:3000/`
- **RESTful API Endpoint:** `http://localhost:3000/api/`

### Running the 22 Automated QA Tests:
```powershell
agy-node server/tests/suite.js
```
*Result: 22 / 22 Tests Passed (100% Pass Rate).*

### Running the Academic Java / Spring Boot Backend (When JDK 17 & Maven are available):
```bash
cd java-backend
mvn clean test
mvn spring-boot:run
```

---

## 📂 Project Directory Structure

```
fleetdesk/
├── README.md                          # Comprehensive project documentation
├── package.json                       # Scripts for start, seed, and test
├── .env.example                       # Environment configuration template
│
├── client/                            # Responsive Web Application Client (20 Views)
│   ├── index.html                     # Application HTML shell
│   ├── css/
│   │   └── style.css                  # Enterprise SaaS theme and print styles
│   └── js/
│       ├── state.js                   # Reactive AppState manager
│       ├── api.js                     # REST API client
│       ├── router.js                  # Hash router with RBAC route protection
│       ├── components/
│       │   ├── icons.js               # Self-contained Lucide SVG icons
│       │   ├── toast.js               # Toast notification system
│       │   ├── modal.js               # Reusable confirmation/form modal
│       │   ├── charts.js              # Pure SVG revenue and donut charts
│       │   └── nav.js                 # Responsive sidebar & header navigation
│       └── views/
│           ├── authViews.js           # Login & Registration views
│           ├── dashboardView.js       # Dynamic executive dashboard
│           ├── vehiclesView.js        # Vehicle catalog & filter view
│           ├── vehicleDetailsView.js  # Vehicle dossier & live availability checker
│           ├── bookingsView.js        # Bookings list, new booking wizard & details
│           ├── handoverReturnView.js  # Staff Dispatch & Check-in workstation
│           ├── billingView.js         # Invoices and payment ledger
│           ├── maintenanceView.js     # Maintenance bay & service scheduling
│           ├── reportsView.js         # Analytics & CSV export utilities
│           └── managementViews.js     # Customers, users, settings, profile, 403, 404
│
├── server/                            # Persistent Node.js REST API + SQLite Backend
│   ├── db/
│   │   ├── schema.sql                 # SQLite schema with foreign keys and checks
│   │   ├── connection.js              # In-process DatabaseSync manager
│   │   ├── seed.js                    # Comprehensive seed data script
│   │   └── fleetdesk.db               # Persistent SQLite database file
│   ├── src/
│   │   ├── app.js                     # Server entrypoint and static file handler
│   │   ├── router.js                  # Lightweight REST API router
│   │   ├── middleware/auth.js         # JWT verification & role enforcement
│   │   ├── utils/security.js          # PBKDF2 password hashing & token signer
│   │   ├── services/
│   │   │   ├── bookingService.js      # Date overlap equation & conflict validation
│   │   │   ├── billingService.js      # 24-hr blocks & late fee penalty multiplier
│   │   │   ├── paymentService.js      # Multi-channel simulated payment processor
│   │   │   └── reportService.js       # Financial aggregation & CSV exporter
│   │   └── controllers/               # Auth, Vehicle, Booking, Billing, etc.
│   └── tests/
│       ├── suite.js                   # Comprehensive 22-scenario automated test runner
│       └── mock_api_test.js           # In-memory API router tests
│
├── java-backend/                      # Academic Java 17 / Spring Boot 3 Backend
│   ├── pom.xml                        # Maven configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/fleetdesk/
│       │   │   ├── FleetDeskApplication.java
│       │   │   ├── model/             # Vehicle (Car, Bike, Suv, EV), Customer, etc.
│       │   │   ├── repository/        # Spring Data JPA repositories
│       │   │   ├── service/           # BookingService, BillingService
│       │   │   ├── strategy/          # PaymentMethod & PricingStrategy patterns
│       │   │   └── exception/         # Domain exceptions & GlobalExceptionHandler
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       │           ├── V1__init_schema.sql
│       │           └── V2__seed_sample_data.sql
│       └── test/java/com/fleetdesk/   # JUnit 5 & Mockito test suite
│
└── docs/                              # Academic Deliverables & Faculty Viva Defense
    ├── KTU_PBCST304_PROJECT_REPORT.md # Comprehensive KTU Academic PBL Report
    ├── ARCHITECTURE.md                # System Architecture & Mermaid Diagrams
    ├── UML_CLASS_DIAGRAM.md           # UML Class Diagram
    ├── DATABASE_ERD.md                # Entity Relationship Diagram & Dictionary
    ├── API_DOCUMENTATION.md           # OpenAPI / REST Endpoints Specification
    ├── TEST_REPORT.md                 # 22-Scenario QA Test Report (100% Pass)
    └── USER_MANUAL.md                 # Step-by-Step Illustrated User Manual
```

---

## 🏆 Key Features Implemented

1. **Date-Based Collision Detection:** Validates $T_{\text{pickup}} < \text{existingEnd} \land T_{\text{return}} > \text{existingStart}$ preventing overlapping bookings.
2. **24-Hour Block Billing:** Computes duration in full 24-hour ceiling increments with a 1-day minimum.
3. **Late Return Penalties:** Implements an automated penalty formula: $\text{Late Days} \times \text{Daily Rate} \times 1.5$.
4. **Staff Workstation:** Unified Dispatch & Check-in Desk for recording odometer readings, fuel percentages, and damage surcharges.
5. **Payment Simulation:** Multi-channel payments via UPI, Card, and Cash with partial payment reconciliation and auditable failure simulation.
6. **Maintenance Bay:** Vehicle service scheduling with return-to-service validation preventing premature release of vehicles with active repairs.
7. **Executive Intelligence:** Dynamic charts, fleet utilisation metrics, and one-click CSV export.
8. **Demonstrated Java OOP:** Abstract Vehicle base class with Car, Bike, Suv, and ElectricVehicle subclasses, Strategy patterns, and custom domain exceptions.
