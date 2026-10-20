# FleetDesk — Production Build & Deployment Guide

## 1. Production Architecture Overview

For enterprise production deployments, FleetDesk is deployed as a decoupled multi-tier system:
- **Web Reverse Proxy:** NGINX or AWS CloudFront / ALB handling TLS termination and static file delivery.
- **Application Services:** Docker containerized Spring Boot 3 or Node.js runtime instances behind a load balancer.
- **Relational Database:** Multi-AZ AWS RDS for MySQL 8.x with automated daily snapshots and read-replicas.

---

## 2. Docker Containerization

### Dockerfile (Node.js Persistent Web Service):
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
ENV PORT=3000
ENV NODE_ENV=production
RUN node server/db/seed.js
EXPOSE 3000
CMD ["node", "server/src/app.js"]
```

### Dockerfile (Spring Boot 3 Academic Service):
```dockerfile
# Multi-stage build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY java-backend/pom.xml .
COPY java-backend/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/fleetdesk-backend-1.0.0-KTU-RELEASE.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 3. Docker Compose Stack

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: fleetdesk_db
      MYSQL_USER: fleetdesk_app
      MYSQL_PASSWORD: apppassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  fleetdesk-web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production

volumes:
  mysql_data:
```

---

## 4. Reverse Proxy (NGINX) Configuration Snippet

```nginx
server {
    listen 80;
    server_name fleetdesk.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /var/www/fleetdesk/client;
        try_files $uri $uri/ /index.html;
    }
}
```
