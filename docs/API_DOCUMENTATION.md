# FleetDesk — REST API Documentation

Base URL: `http://localhost:3000/api`

---

## 1. Authentication Endpoints

### 1.1 Customer Registration
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "username": "rahul",
  "email": "rahul.sharma@example.com",
  "password": "Customer@123",
  "fullName": "Rahul Sharma",
  "phone": "+91 98765 43210",
  "address": "Flat 4B, Skyline Meadows, Kakkanad, Kochi",
  "drivingLicenceNumber": "KL-07-20180012345",
  "licenceExpiryDate": "2030-05-15"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4,
    "customerId": 1,
    "username": "rahul",
    "email": "rahul.sharma@example.com",
    "role": "CUSTOMER",
    "fullName": "Rahul Sharma"
  }
}
```

### 1.2 User Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "usernameOrEmail": "admin@fleetdesk.com",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@fleetdesk.com",
    "role": "ADMIN"
  }
}
```

---

## 2. Vehicle Fleet Endpoints

### 2.1 List Vehicles
- **Endpoint:** `GET /api/vehicles`
- **Access:** Public (DEACTIVATED vehicles hidden from non-admins)
- **Query Parameters:** `category`, `fuelType`, `status`, `search`, `minRate`, `maxRate`, `sort`, `order`, `page`, `limit`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "registration_number": "KL-07-CD-1001",
      "brand": "Hyundai",
      "model": "i20 Asta",
      "category": "CAR",
      "manufacturing_year": 2023,
      "fuel_type": "PETROL",
      "seating_capacity": 5,
      "transmission": "MANUAL",
      "daily_rental_rate": 1500.00,
      "operational_status": "AVAILABLE",
      "odometer_reading": 24500
    }
  ],
  "pagination": { "total": 15, "page": 1, "limit": 50 }
}
```

### 2.2 Add Vehicle
- **Endpoint:** `POST /api/vehicles`
- **Access:** ADMIN only
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "registrationNumber": "KL-07-NEW-8899",
  "brand": "Toyota",
  "model": "Hyryder Hybrid",
  "category": "SUV",
  "manufacturingYear": 2024,
  "fuelType": "HYBRID",
  "seatingCapacity": 5,
  "transmission": "AUTOMATIC",
  "dailyRentalRate": 3100.00,
  "insuranceExpiry": "2028-12-31"
}
```

---

## 3. Booking & Reservation Endpoints

### 3.1 Check Vehicle Date Availability
- **Endpoint:** `POST /api/bookings/check-availability`
- **Access:** Public
- **Request Body:**
```json
{
  "vehicleId": 2,
  "pickupDatetime": "2026-11-01 10:00:00",
  "expectedReturnDatetime": "2026-11-04 10:00:00"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "available": true,
  "reason": "Vehicle is available for the selected dates."
}
```

### 3.2 Create Reservation
- **Endpoint:** `POST /api/bookings`
- **Access:** Authenticated Users
- **Request Body:**
```json
{
  "vehicleId": 2,
  "pickupDatetime": "2026-11-01 10:00:00",
  "expectedReturnDatetime": "2026-11-04 10:00:00",
  "discountCode": "WELCOME10"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {
    "bookingId": 8,
    "bookingReference": "BK-2026-4412",
    "agreedDailyRate": 2200.00,
    "billableDays": 3,
    "totalAmount": 5940.00,
    "invoiceNumber": "INV-2026-8819"
  }
}
```

### 3.3 Vehicle Handover (Dispatch)
- **Endpoint:** `POST /api/bookings/{id}/handover`
- **Access:** STAFF or ADMIN
- **Request Body:**
```json
{
  "startOdometer": 18200,
  "startFuelLevel": "100%",
  "handoverNotes": "Checked DL, tyre tread and verified toolkit."
}
```

### 3.4 Vehicle Return (Check-in)
- **Endpoint:** `POST /api/bookings/{id}/return`
- **Access:** STAFF or ADMIN
- **Request Body:**
```json
{
  "endOdometer": 18750,
  "endFuelLevel": "90%",
  "damageCharges": 0.00,
  "markMaintenance": false,
  "returnNotes": "Returned in pristine condition."
}
```

---

## 4. Invoices & Payments

### 4.1 Record Simulated Payment
- **Endpoint:** `POST /api/invoices/{id}/payments`
- **Access:** Authenticated Users (Ownership enforced)
- **Request Body:**
```json
{
  "amount": 2500.00,
  "paymentMethod": "UPI",
  "simulateFailure": false,
  "paymentDetails": { "upiId": "rahul@okaxis" }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "status": "SUCCESS",
  "transactionReference": "TXN-UPI-20261020-A1B2C3",
  "amount": 2500.00,
  "newPaidAmount": 2500.00,
  "newOutstandingBalance": 3440.00,
  "paymentStatus": "PARTIALLY_PAID"
}
```

---

## 5. Reports & Analytics

### 5.1 Executive Dashboard Metrics
- **Endpoint:** `GET /api/reports/dashboard`
- **Access:** STAFF or ADMIN

### 5.2 CSV Export
- **Endpoint:** `GET /api/reports/export?type=vehicles|bookings|revenue`
- **Access:** STAFF or ADMIN
- **Response:** `Content-Type: text/csv` with `Content-Disposition: attachment`
