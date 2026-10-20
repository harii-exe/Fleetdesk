# FleetDesk — Comprehensive Quality Assurance (QA) Test Report

**Environment Tested:** Node.js v24.20.0 + SQLite3 Persistent In-Process Engine (`node:sqlite`)  
**Test Suite File:** `server/tests/suite.js`  
**Execution Timestamp:** 2026-10-20T23:04:12+05:30  
**Overall Result:** 22 / 22 Passed (100% Pass Rate)

---

## Detailed Test Case Execution Matrix

| Test ID | Test Case Description | Input Scenario | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **01** | Vehicle registration | Admin posts new vehicle payload with valid registration and rate | HTTP 201 Created with auto-generated vehicle ID | HTTP 201 Created, `vehicleId: 16` | **PASS** |
| **02** | Duplicate vehicle registration prevention | Post vehicle with already registered registration number `KL-07-TEST-9999` | HTTP 409 Conflict with duplicate registration error | HTTP 409 Conflict, rejected | **PASS** |
| **03** | Vehicle search and multi-filtering | Query `category=SUV&fuelType=DIESEL` | HTTP 200 OK, returns filtered records matching both criteria | HTTP 200 OK, returns Creta, XUV700, Innova, Harrier | **PASS** |
| **04** | Customer self-registration | Post registration payload with unique DL number and future expiry | HTTP 201 Created with JWT auth token and customer role | HTTP 201 Created, customer profile linked | **PASS** |
| **05** | Valid booking creation | Post booking for available vehicle with valid future dates | HTTP 201 Created with booking reference and generated invoice | HTTP 201 Created, `bookingId` returned | **PASS** |
| **06** | Invalid date ranges rejected | Post booking where return datetime is earlier than pickup | HTTP 400 Bad Request with invalid rental duration message | HTTP 400 Bad Request, rejected | **PASS** |
| **07** | Overlapping bookings blocked | Post reservation on dates overlapping an active booking | HTTP 400 Bad Request with booking conflict detail | HTTP 400 Bad Request, conflict caught | **PASS** |
| **08** | Adjacent reservations permitted | Post reservation starting at exact moment prior booking ends | Live check returns `available: true` | `available: true`, no conflict | **PASS** |
| **09** | Booking cancellation | Customer cancels eligible booking in `CONFIRMED` status | HTTP 200 OK, booking status becomes `CANCELLED`, invoice updated | HTTP 200 OK, DB status updated | **PASS** |
| **10** | Vehicle handover workflow | Staff records handover with start odometer 31,200 KM and fuel | HTTP 200 OK, booking becomes `ACTIVE`, vehicle status `RENTED` | HTTP 200 OK, vehicle telematics updated | **PASS** |
| **11** | Vehicle return reconciliation | Staff returns vehicle with final odometer 31,500 KM | HTTP 200 OK, booking becomes `COMPLETED`, vehicle becomes `AVAILABLE` | HTTP 200 OK, final odometer updated | **PASS** |
| **12** | Late fee penalty calculation | Expected return: Oct 1 10:00, Actual: Oct 2 12:00 (26 hrs overdue, ₹1,000 rate) | Late days = 2, Late fee = 2 × 1000 × 1.5 = ₹3,000 | `lateDays: 2`, `lateFee: 3000.00` | **PASS** |
| **13** | Discount voucher application | 2-day Duke 390 booking (₹2,800) with code `WELCOME10` (10% off) | Total = ₹2,800 - ₹280 = ₹2,520 | `billableDays: 2`, `totalAmount: 2520.00` | **PASS** |
| **14** | Partial payment recording | Invoice balance ₹5,000, post partial payment of ₹500 via UPI | HTTP 200 OK, invoice balance decreases, status becomes `PARTIALLY_PAID` | HTTP 200 OK, status `PARTIALLY_PAID` | **PASS** |
| **15** | Failed payment simulation | Record payment with `simulateFailure: true` | HTTP 200 OK, payment recorded with status `FAILED`, balance unchanged | HTTP 200 OK, status `FAILED`, failure reason stored | **PASS** |
| **16** | Invoice overpayment rejection | Attempt payment amount exceeding invoice outstanding balance | HTTP 400 Bad Request: payment cannot exceed outstanding balance | HTTP 400 Bad Request, rejected | **PASS** |
| **17** | Maintenance booking conflicts | Attempt booking vehicle currently undergoing service in maintenance bay | HTTP 400 Bad Request: vehicle has scheduled maintenance | HTTP 400 Bad Request, rejected | **PASS** |
| **18** | Role-based access control (RBAC) | Customer attempts accessing Admin-only endpoint `POST /api/vehicles` | HTTP 403 Forbidden: Access Denied | HTTP 403 Forbidden, rejected | **PASS** |
| **19** | Customer ownership restriction | Customer 1 attempts accessing private invoice belonging to Customer 2 | HTTP 403 Forbidden: Access Denied | HTTP 403 Forbidden, rejected | **PASS** |
| **20** | Data persistence after restart | Close DB connection and re-initialize from on-disk database file | Total records persist without data loss (>= 15 vehicles) | `countBefore === countAfter` (15 vehicles) | **PASS** |
| **21** | Concurrent reservation prevention | Submit identical vehicle slot simultaneously | First request succeeds, second request rejected with conflict | Request 1: 201 Created, Request 2: 400 Conflict | **PASS** |
| **22** | Financial report calculations | Executive dashboard metrics computation | Gross Revenue - Total Refunds = Net Revenue | Formula verified against payment ledger | **PASS** |
