
# User Service – Spring Boot REST API

A secure REST API for user management with JWT authentication, role‑based access control, database migrations, and optional Redis caching.

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing with cURL](#testing-with-curl)
- [Optional: Redis Cache](#optional-redis-cache)
- [Troubleshooting](#troubleshooting)

---

## 🧰 Tech Stack

| Component          | Version                     |
|--------------------|-----------------------------|
| Java               | 17 (or 21)                  |
| Spring Boot        | 3.3.3                       |
| Spring Security    | 6.x                         |
| MySQL              | 8.0                         |
| Flyway             | 10.x                        |
| JWT (JJWT)         | 0.11.5                      |
| Redis (optional)   | 7.x                         |
| Build Tool         | Maven 3.8+                  |

---

## 📦 Prerequisites

Make sure you have installed:

- **JDK 17+** – [Download](https://adoptium.net/)
- **Maven 3.8+** – [Download](https://maven.apache.org/)
- **MySQL 8.0** – [Download](https://dev.mysql.com/downloads/) (or via Docker)
- **Redis** (optional – for caching) – [Download](https://redis.io/download/) (or via Docker)

---

## ⚙️ Configuration

The application uses **YAML** for configuration (`src/main/resources/application.yml`).  
If you prefer `.properties`, you can convert accordingly.

### Basic application.yml (minimal)

```yaml
server:
  port: 8083

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/userdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: your_password_here
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true

  flyway:
    enabled: true
    baseline-on-migrate: true

app:
  jwt:
    secret: mySecretKeyForJWTGenerationInUserService2026
    expiration: 86400000   # 24 hours

logging:
  level:
    com.meridian: DEBUG

Database Setup
CREATE DATABASE IF NOT EXISTS userdb;

Build and run with Maven

mvn clean spring-boot:run

Build a JAR and run it

mvn clean package -DskipTests
java -jar target/user-service-*.jar

API Endpoints

All endpoints (except /api/v1/auth/login) require a JWT token in the Authorization: Bearer <token> header.

Method	Endpoint	Description	Role required
POST	/api/v1/auth/login	Login → returns JWT	None
POST	/api/v1/users	Create a new user	ADMIN, MANAGER
GET	/api/v1/users/{id}	Get user by ID	ADMIN, MANAGER, ...
PUT	/api/v1/users/{id}	Update user	ADMIN, MANAGER
DELETE	/api/v1/users/{id}	Delete user	ADMIN
GET	/api/v1/users	Get paginated users	ADMIN, MANAGER
GET	/api/v1/users/me	Get current user info	Authenticated
GET	/api/v1/users/search	Search users by keyword	ADMIN, MANAGER
All endpoints are secured with @PreAuthorize – adjust role requirements as needed.

Login and get a token
bash
curl -X POST http://localhost:8083/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

   Create a new user (requires ADMIN or MANAGER)
bash
curl -X POST http://localhost:8083/api/v1/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"technician1","password":"tech123","email":"tech@example.com","fullName":"Tech One","role":"TECHNICIAN"}'