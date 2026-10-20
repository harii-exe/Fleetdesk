# APJ ABDUL KALAM TECHNOLOGICAL UNIVERSITY (KTU)
## B.TECH DEGREE IN COMPUTER SCIENCE AND ENGINEERING
### COURSE: PROJECT-BASED LEARNING (PBL) — PBCST304 (2024 SCHEME)

---

# PROJECT REPORT
## FLEETDESK — SMART VEHICLE RENTAL & FLEET MANAGEMENT SYSTEM

**Academic Year:** 2026 – 2027  
**Department:** Computer Science and Engineering  
**Subject Code:** PBCST304 — Project-Based Learning  
**Scheme:** 2024 Scheme (KTU)

---

## 1. ABSTRACT
Modern urban transportation demands agile, transparent, and scalable fleet automation platforms. **FleetDesk** is an enterprise-grade Vehicle Rental & Fleet Management System engineered to streamline multi-category vehicle reservations, interval conflict detection, customer identity compliance, vehicle dispatch/check-in workflows, decimal-safe itemized billing, and simulated multi-channel payment reconciliation. 

Developed under KTU Course PBCST304, FleetDesk enforces strict Object-Oriented Programming (OOP) paradigms (Encapsulation, Inheritance, Abstraction, Polymorphism, and Composition) and implements a fully decoupled architecture featuring a persistent SQLite/MySQL data access layer, an industry-standard RESTful micro-service API, and a modern single-page enterprise web application with dynamic telematics and role-based access control.

---

## 2. PROBLEM STATEMENT & OBJECTIVES
Traditional vehicle rental desks rely on manual spreadsheets or monolithic legacy desktop tools suffering from:
1. **Double-Booking Collisions:** Lack of mathematical interval checking leading to simultaneous reservations of the same asset.
2. **Untracked Overdue Vehicles:** Unenforced late fee policies leading to commercial revenue leakage.
3. **Weak Licensing Governance:** Inadequate checks permitting reservations past driving licence expiration dates.
4. **Maintenance Conflicts:** Booking vehicles that are physically decommissioned or undergoing critical workshop repairs.

### Primary Project Objectives:
- **Interval Collision Engine:** Implement the mathematical check: `requestedStart < existingEnd AND requestedEnd > existingStart`.
- **Decimal-Safe Financial Engine:** Compute 24-hour block durations (`Math.ceil(hours / 24)`), promotional discount vouchers, and configurable late fee multipliers (default 1.5x daily tariff).
- **Three-Tier Role-Based Security:** Strict boundary isolation for `ADMIN`, `STAFF`, and `CUSTOMER` roles.
- **Full Operational Lifecycle:** End-to-end support for Booking &rarr; Handover (Odometer & Fuel Check) &rarr; Active Rental &rarr; Return Reconciliation &rarr; Itemized Invoicing &rarr; Simulated Payment Ledger.
- **Academic OOP Demonstration:** Concrete manifestation of abstract classes, polymorphism, composition, and custom domain exceptions.

---

## 3. MATHEMATICAL & BUSINESS LOGIC FORMULAS

### 3.1 Date-Based Conflict Checking
Two temporal intervals $[S_1, E_1]$ and $[S_2, E_2]$ intersect if and only if:
$$\text{Conflict} = (S_1 < E_2) \land (E_1 > S_2)$$
In FleetDesk, a reservation request $[T_{\text{pickup}}, T_{\text{return}}]$ for vehicle $V$ is valid if:
$$\forall B \in \text{Bookings}(V) \text{ where } B.\text{status} \in \{\text{PENDING, CONFIRMED, ACTIVE, OVERDUE}\}:$$
$$\neg (T_{\text{pickup}} < B.\text{expectedReturn} \land T_{\text{return}} > B.\text{pickup})$$

### 3.2 Billable Rental Duration (24-Hour Block Billing)
Let $\Delta t = T_{\text{actualReturn}} - T_{\text{pickup}}$ in hours. The billable days $D_{\text{billable}}$ is computed as:
$$D_{\text{billable}} = \max\left(1, \left\lceil \frac{\Delta t}{24} \right\rceil\right)$$
$$\text{Rental Charge} = D_{\text{billable}} \times R_{\text{agreed}}$$
where $R_{\text{agreed}}$ is the daily tariff snapshotted at booking creation.

### 3.3 Overdue Late Fee Formula
If $T_{\text{actualReturn}} > T_{\text{expectedReturn}}$:
$$H_{\text{overdue}} = T_{\text{actualReturn}} - T_{\text{expectedReturn}} \quad (\text{hours})$$
$$D_{\text{late}} = \left\lceil \frac{H_{\text{overdue}}}{24} \right\rceil$$
$$\text{Late Fee} = D_{\text{late}} \times R_{\text{agreed}} \times M_{\text{penalty}}$$
*(Default penalty multiplier $M_{\text{penalty}} = 1.5$, configurable by Admin).*

*Example Case:* A vehicle with $R_{\text{agreed}} = \text{₹}1,000$ returned 26 hours late:
$$D_{\text{late}} = \lceil 26 / 24 \rceil = 2 \text{ days}$$
$$\text{Late Fee} = 2 \times 1000 \times 1.5 = \text{₹}3,000$$

### 3.4 Invoicing & Balance Ledger
$$\text{Invoice Total} = \max\left(0, \text{Rental Charge} - \text{Discount} + \text{Extra Charges} + \text{Late Fee}\right)$$
$$\text{Outstanding Balance} = \max\left(0, \text{Invoice Total} - \text{Paid Amount} + \text{Refunded Amount}\right)$$

---

## 4. OBJECT-ORIENTED PROGRAMMING (OOP) IMPLEMENTATION

| OOP Principle | Class / Interface | Description |
| :--- | :--- | :--- |
| **Encapsulation** | `Vehicle`, `Customer`, `Invoice` | Private fields with explicit domain accessors, input validation, and mutable state guards. |
| **Inheritance** | `abstract class Vehicle` | Base vehicle class extended by `Car`, `Bike`, `Suv`, and `ElectricVehicle`. |
| **Abstraction** | `PaymentMethod`, `PricingStrategy` | Interface abstractions separating business logic from concrete payment channels and pricing algorithms. |
| **Polymorphism** | `UpiPayment`, `CardPayment`, `CashPayment` | Polymorphic execution of payment simulation returning standard auditable transactions. |
| **Composition** | `Booking`, `Invoice`, `Vehicle` | `Booking` has-a `Customer` and `Vehicle`; `Invoice` has-a `Booking` and `Payment` transactions list. |
| **Exception Handling**| `BookingConflictException`, `VehicleNotFoundException` | Domain-specific checked/unchecked exception hierarchy mapped to HTTP responses. |

---

## 5. SYSTEM ARCHITECTURE & MODULES

```
+-------------------------------------------------------------------------+
|                          FLEETDESK WEB CLIENT                           |
|       (Responsive Single Page App / Tailwind CSS / Vanilla JS)         |
|  Dashboard | Inventory | Bookings | Dispatch Desk | Invoices | Reports   |
+------------------------------------+------------------------------------+
                                     | JSON REST API (HTTP)
+------------------------------------v------------------------------------+
|                         FLEETDESK REST SERVER                           |
|      Auth Middleware | Controllers | Business Services | Security       |
+------------------------------------+------------------------------------+
                                     | Parameterized SQL
+------------------------------------v------------------------------------+
|                       PERSISTENT DATABASE LAYER                         |
|   SQLite3 Engine (node:sqlite) / MySQL 8.x Spring Data JPA + Flyway     |
|   app_users | customers | vehicles | bookings | invoices | payments     |
+-------------------------------------------------------------------------+
```

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

| Module / Endpoint | ADMIN | STAFF | CUSTOMER | GUEST |
| :--- | :---: | :---: | :---: | :---: |
| Browse Vehicles & Availability | Yes | Yes | Yes | Yes |
| Create Self Reservation | Yes | Yes | Yes (Self) | No |
| Vehicle Handover & Return | Yes | Yes | No | No |
| Add / Soft Deactivate Vehicles | Yes | No | No | No |
| View All Customer Records | Yes | Yes | No | No |
| Issue Financial Refunds | Yes | No | No | No |
| Configure Penalty Multipliers | Yes | No | No | No |
| View Financial Audit Logs | Yes | No | No | No |

---

## 7. AUTOMATED QA TEST RESULTS (100% PASS)
All 22 automated test scenarios were executed against the persistent data layer:
1. `Vehicle registration`: **PASS**
2. `Duplicate vehicle registration prevention`: **PASS**
3. `Vehicle search and multi-filtering`: **PASS**
4. `Customer registration & auth`: **PASS**
5. `Valid booking creation`: **PASS**
6. `Invalid date ranges rejected`: **PASS**
7. `Overlapping bookings blocked`: **PASS**
8. `Adjacent reservations permitted`: **PASS**
9. `Booking cancellation flow`: **PASS**
10. `Vehicle handover (Odometer/Fuel recorded)`: **PASS**
11. `Vehicle return reconciliation`: **PASS**
12. `Late fee calculation (1.5x multiplier)`: **PASS**
13. `Discount voucher application`: **PASS**
14. `Partial payment reconciliation`: **PASS**
15. `Failed payment gateway simulation`: **PASS**
16. `Invoice overpayment rejection`: **PASS**
17. `Maintenance bay conflict check`: **PASS**
18. `Role-based access control`: **PASS**
19. `Customer private ownership`: **PASS**
20. `Data persistence after restart`: **PASS**
21. `Concurrent reservation prevention`: **PASS**
22. `Revenue & financial metrics calculation`: **PASS**

---

## 8. VIVA VOCE QUESTIONS & FACULTY DEFENSE GUIDE

**Q1: How does FleetDesk prevent race conditions when two customers attempt to book the same vehicle simultaneously?**  
*Answer:* In the persistent database layer, booking validation and creation are executed within atomic database transactions (`BEGIN TRANSACTION ... COMMIT` or Spring `@Transactional`). Before inserting, the engine re-evaluates the overlap query:
`requestedStart < existingEnd AND requestedEnd > existingStart`
If any existing reservation in status `PENDING`, `CONFIRMED`, `ACTIVE`, or `OVERDUE` matches, the transaction aborts with a `BookingConflictException`.

**Q2: Why is soft deactivation used instead of SQL `DELETE` for vehicles and customers?**  
*Answer:* Deleting a vehicle or customer from the database would break foreign-key referential integrity with historical bookings, invoices, audit trails, and payment records. Soft deactivation (`operational_status = 'DEACTIVATED'`) removes the vehicle from the public booking catalog while preserving financial and regulatory compliance history.

**Q3: Where is the late fee policy implemented and how is it tested?**  
*Answer:* It is implemented in `BillingService.calculateLateFee()`. Overdue hours are divided by 24 and rounded up with `Math.ceil()` to obtain billable late days, then multiplied by the agreed daily rate and the configured penalty multiplier (1.5x). Unit Test 12 verifies that an overdue period of 26 hours on a ₹1,000/day vehicle produces exactly ₹3,000 in penalties.

---

## 9. CONCLUSION
**FleetDesk** achieves all goals outlined in the KTU PBCST304 syllabus by demonstrating sound software engineering practices, robust database modeling, decimal-accurate financial logic, and clean object-oriented architecture.
