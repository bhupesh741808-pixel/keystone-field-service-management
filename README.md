# KEYSTONE - Field Service Management (FSM) System

Keystone is an enterprise-grade Field Service Management (FSM) web application designed for facilities management, maintenance, repairs, and service tracking.

## System Architecture

The application comprises:
- **Backend**: Spring Boot 3, Java 21, Spring Security, Hibernate/JPA, Flyway, JWT Authentication, and H2 database fallback.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, and React Router.
- **Database**: PostgreSQL (production) or H2 file-based (development).

---

## Local Development Quickstart

To run the application locally without Docker or an external PostgreSQL database:

### 1. Run the Spring Boot Backend
The backend utilizes an H2 database file fallback if the active profile is set to `dev` (which is configured as default). 

Navigate to the `backend/` folder and run the Maven wrapper:
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# Linux/macOS:
./mvnw spring-boot:run
```
The REST API will be available at `http://localhost:8080`.
The H2 Database Console can be accessed at `http://localhost:8080/h2-console` with:
- **JDBC URL**: `jdbc:h2:file:./data/keystonedb`
- **Username**: `sa`
- **Password**: `password`

### 2. Run the React Frontend
Navigate to the `frontend/` folder, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The client dashboard will launch at `http://localhost:5173`.

---

## Running with Docker Compose

To spin up the entire system including PostgreSQL using Docker Compose:

```bash
docker-compose up --build
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080`
- **Swagger Documentation**: `http://localhost:8080/swagger-ui/index.html`

---

## Pre-seeded Credentials

The application is bootstrapped with default accounts for all FSM roles:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Manager** | `manager@keystone.com` | `password` |
| **Dispatcher** | `dispatcher@keystone.com` | `password` |
| **Technician** | `technician@keystone.com` | `password` |
| **Customer** | `customer@keystone.com` | `password` |
