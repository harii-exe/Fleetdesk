# FleetDesk — Installation & Setup Guide

## 1. Prerequisites

### For Web Runtime (Node.js + Persistent SQLite):
- Node.js v18.0 or later (Node.js v24.20.0 verified).
- No npm install or third-party packages needed (uses zero-dependency in-process `node:sqlite` and native Web APIs).

### For Academic Java Backend (Spring Boot + MySQL):
- Java Development Kit (JDK) 17 or higher.
- Apache Maven 3.8+.
- MySQL Server 8.0+.

---

## 2. Web Runtime Quick Setup

```powershell
# 1. Clone or navigate to the workspace
cd C:\Users\harig\.gemini\antigravity\scratch\fleetdesk

# 2. Initialize and Seed the Database
agy-node server/db/seed.js

# 3. Start the Web Server
agy-node server/src/app.js
```

Open your web browser and navigate to:
`http://localhost:3000/`

---

## 3. Academic Java / Spring Boot Setup

### Step 1: Prepare MySQL Database
Open your MySQL terminal or MySQL Workbench:
```sql
CREATE DATABASE fleetdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fleetdesk_app'@'localhost' IDENTIFIED BY 'rootpassword';
GRANT ALL PRIVILEGES ON fleetdesk_db.* TO 'fleetdesk_app'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Configure Application Properties
Edit `java-backend/src/main/resources/application.yml` or set environment variables:
```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/fleetdesk_db?useSSL=false&serverTimezone=UTC
export SPRING_DATASOURCE_USERNAME=fleetdesk_app
export SPRING_DATASOURCE_PASSWORD=rootpassword
```

### Step 3: Run Flyway Migrations & Launch Spring Boot
```bash
cd java-backend
mvn clean compile
mvn test
mvn spring-boot:run
```
Flyway will automatically execute `V1__init_schema.sql` and `V2__seed_sample_data.sql` upon launch.
The Spring Boot REST API will be accessible on port 8080.
