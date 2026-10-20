# FleetDesk — End-User Operations Manual

## 1. Quick Start & Login Roles

When you open FleetDesk, you will find a **⚡ Quick Demo Login** toolbar providing instant single-click access for evaluation:

1. **Administrator Account (`ADMIN`):**
   - **Email:** `admin@fleetdesk.com`
   - **Password:** `Admin@123`
   - **Capabilities:** Total fleet control, vehicle CRUD, staff management, settings configuration, financial reports, refunds.

2. **Staff Account (`STAFF`):**
   - **Email:** `staff@fleetdesk.com`
   - **Password:** `Staff@123`
   - **Capabilities:** Customer registration, vehicle handover (starting odo/fuel), check-in return reconciliation, maintenance logging.

3. **Customer Account (`CUSTOMER`):**
   - **Email:** `rahul.sharma@example.com`
   - **Password:** `Customer@123`
   - **Capabilities:** Vehicle catalog search, live availability checking, booking reservations, invoice review, simulated payments, ratings & reviews.

---

## 2. Customer Workflow: Booking & Invoicing

### Step 1: Browse & Filter Fleet
1. Navigate to **Fleet Inventory** (`#/vehicles`).
2. Filter by category pills (**Cars**, **SUVs**, **Bikes & Scooters**, **EVs & Green Fleet**).
3. Click on any vehicle card to view its technical dossier, luggage capacity, and customer reviews.

### Step 2: Check Availability & Reserve
1. In the Vehicle Dossier, select your intended **Pickup Date & Time** and **Return Date & Time**.
2. Click **Check Availability**. The system executes the collision equation in real-time.
3. Click **Proceed to Reserve**.
4. In the New Booking screen, enter promotional voucher code `WELCOME10` or `FESTIVE500` to apply instant discounts.
5. Review the live 24-hour block duration estimate and click **Confirm & Create Reservation**.

### Step 3: View Booking & Pay Invoice
1. Your generated booking reference (e.g. `BK-2026-0001`) and itemized invoice will appear immediately.
2. Click **Pay Balance** to open the payment simulator:
   - Select payment method (**UPI**, **Card**, or **Cash**).
   - Click **Execute Payment Simulation** to record a transaction.
3. Use the **Print Invoice** button to generate a clean, official tax invoice.

---

## 3. Staff Workflow: Vehicle Dispatch & Check-in Desk

### Step 1: Vehicle Handover (Dispatch)
1. Navigate to **Dispatch Desk** (`#/dispatch-desk`) and select the **Dispatch Desk** tab.
2. Find the customer's confirmed booking and click **Dispatch Vehicle Now**.
3. In the handover dialog:
   - Input the vehicle's starting odometer reading.
   - Record fuel / battery percentage (e.g., `100%`).
   - Add condition checklist notes.
4. Click **Complete Handover & Activate**. The booking status transitions to `ACTIVE`, and the vehicle's operational status changes to `RENTED`.

### Step 2: Vehicle Return Reconciliation (Check-in)
1. Select the **Check-in Desk** tab on the Dispatch Desk page.
2. If the return is overdue, it is automatically highlighted in red with an overdue warning.
3. Click **Process Check-in & Return**.
4. Input:
   - Final odometer reading.
   - Ending fuel/battery percentage.
   - Any damage or cleaning surcharges.
   - Check the **Route vehicle to Maintenance Bay** box if repairs are required.
5. Click **Reconcile Return**.
   - The system automatically calculates billable 24-hr days and applies late penalty fees (1.5x multiplier) if overdue.
   - The booking transitions to `COMPLETED`, and the vehicle becomes `AVAILABLE` (or `MAINTENANCE`).

---

## 4. Administrator Workflow: Fleet Management & Settings

### Managing Vehicles
- Navigate to **Fleet Inventory** and click **Add Vehicle** to register new assets.
- To decommission an older vehicle without breaking historical bookings, open the vehicle dossier and click **Deactivate**.

### Business Rule Customization
- Navigate to **System Settings** (`#/settings`) to update:
  - Overdue Penalty Multiplier (e.g., `1.5` to `2.0`).
  - Standard Cancellation Fee.
  - Company Legal Entity Name and Customer Care hotlines.
- View real-time security audit trails in the **Security & System Audit Logs** viewer.
