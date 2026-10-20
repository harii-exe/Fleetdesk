# FleetDesk — Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 3000 Already in Use (EADDRINUSE)
- **Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause:** Another process or background instance is occupying port 3000.
- **Solution:** Specify a different port when launching:
  ```powershell
  $env:PORT = "3050"
  node server/src/app.js
  ```
  Or identify and terminate the process holding port 3000:
  ```powershell
  netstat -ano | findstr :3000
  Stop-Process -Id <PID> -Force
  ```

### 2. Database Locked or Corrupted
- **Symptom:** `SqliteError: database is locked` or `file is busy`
- **Cause:** Multiple concurrent writer processes on `fleetdesk.db`.
- **Solution:** Reset the database by executing:
  ```powershell
  node -e "const { resetDatabase } = require('./server/db/connection'); const { seedDatabase } = require('./server/db/seed'); resetDatabase(); seedDatabase();"
  ```

### 3. Missing Authorization Token / 401 Unauthorized
- **Symptom:** API calls return `{"success": false, "error": "Authentication required. Please log in."}`
- **Cause:** The client session token expired or localStorage was cleared.
- **Solution:** Click the sign-out button and log back in using one of the quick test accounts (`admin@fleetdesk.com`, `staff@fleetdesk.com`, or `rahul.sharma@example.com`).

### 4. Overlap Conflict When Booking
- **Symptom:** `409 Conflict: Conflict with reservation BK-2026-XXXX`
- **Cause:** The requested dates intersect with an active reservation.
- **Solution:** Pick an adjacent or later date range. The system enforces `requestedStart < existingEnd AND requestedEnd > existingStart`.

### 5. Driving Licence Expiry Error
- **Symptom:** `400 Bad Request: Customer driving licence expires on YYYY-MM-DD, which is before the rental return date`
- **Cause:** Security policy forbids reservations past the driver's licence validity.
- **Solution:** In Customer Profile, update the driving licence expiration date to a future date beyond the trip return time.
