# ParkPulse — Smart Parking Management System

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-blue)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18.3_Vite_TS-61DAFB)](https://react.dev)
[![Architecture](https://img.shields.io/badge/Architecture-100%25_Map--Free_Grid-purple)](https://github.com)
[![Tests](https://img.shields.io/badge/Tests-12%2F12_Passed-success)](https://pytest.org)

An enterprise-grade, full-stack **Smart Parking Mobility Platform** developed for B.Tech CSE capstone evaluation, portfolio demonstration, and smart city operational management.

---

## 🚀 Key Highlights & Architectural Philosophy

### 1. 100% Map-Free Design
* **Zero Map Dependencies**: The project completely omits Leaflet, OpenStreetMap, Mapbox, and Google Maps.
* **Interactive Floor Slot Grid**: Uses a high-fidelity visual parking bay layout as the primary interface. Drivers and operators view exact bay coordinates (`A-01`, `B-14`), floor levels (Ground Floor, Floor 1, Floor 2), live sensor statuses, EV charging points (⚡), and accessibility ramps (♿).
* **Searchable Facility Cards**: Features smart capacity bars, live availability counts, pricing rates in INR (₹), and instant 1-click reservations.

### 2. Intelligent Rule-Based Parking Allocation Engine
When a customer requests parking:
1. **User & Vehicle Validation**: Validates user ownership and non-overlapping schedules.
2. **Operating Hours Verification**: Checks facility opening and closing windows.
3. **Capacity & State Filtering**: Excludes maintenance and disabled bays from operational count.
4. **Physical Compatibility Matching**: Ensures EV vehicles are matched to fast charging bays, motorcycles to two-wheeler slots, and SUVs to high-clearance bays.
5. **Rule-Based Proximity Scoring**: Prioritizes Ground floor bays and slots closest to entry/exit gates.
6. **Double-Booking Prevention**: Database transactions and concurrency conflict checks prevent duplicate bookings under concurrent load.

### 3. Dedicated Gate Operator Console (Entry & Exit)
* **Simulated Hardware Barriers**: Digital Entry Barrier and Exit Barrier with visual `OPEN (UP)` / `CLOSED (DOWN)` states.
* **Rapid Lookup**: Scan or enter booking references (`PK-2610-XXXX`) or number plates (`TS-09-EA-2024`).
* **Automated Duration Billing**: Accurately tracks entry and exit timestamps, calculates billable intervals (15-min increments), and updates bay states.

### 4. Dynamic Pricing & Simulated Payments
* **INR (₹) Default Currency**: Hourly rates, minimum charges, daily maximum caps, and peak-hour multipliers.
* **Simulated Settlement**: Full UPI, Credit/Debit Card, and Netbanking payment simulation for local development.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React, Framer Motion, React Router v6 |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Passlib, Uvicorn |
| **Database** | SQLite (zero-config local fallback), PostgreSQL (Docker Compose ready) |
| **Testing** | Pytest (Backend API & Allocation Engine), Vitest (Frontend Architecture & Calculations) |
| **DevOps** | Docker, Docker Compose, Multi-stage Nginx Build, Environment Configurations |

---

## 📂 Project Structure

```
smart-parking-management/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Auth & role dependency guards
│   │   │   └── v1/
│   │   │       ├── auth.py           # Register, login, profile
│   │   │       ├── parking.py        # Facilities, map-free search
│   │   │       ├── slots.py          # Interactive slot grid & maintenance
│   │   │       ├── reservations.py   # Booking preview & creation
│   │   │       ├── vehicles.py       # Customer fleet management
│   │   │       ├── sessions.py       # Entry & exit gate operations
│   │   │       ├── payments.py       # Ledger & simulated settlement
│   │   │       ├── analytics.py      # KPI metrics & CSV export
│   │   │       ├── notifications.py  # Persistent in-app alerts
│   │   │       └── admin.py          # System administration
│   │   ├── core/
│   │   │   ├── config.py             # Settings & JWT secrets
│   │   │   ├── database.py           # SQLAlchemy session engine
│   │   │   ├── security.py           # Password hashing & JWT
│   │   │   └── seed.py               # Comprehensive demo database seed
│   │   ├── models/                   # SQLAlchemy ORM entities
│   │   ├── schemas/                  # Pydantic v2 validation models
│   │   ├── services/
│   │   │   ├── allocation_engine.py  # Rule-based allocation logic
│   │   │   ├── pricing_engine.py     # Tariff & penalty calculations
│   │   │   ├── session_service.py    # Gate clearance service
│   │   │   └── analytics_service.py  # KPI & CSV reporting engine
│   │   └── tests/
│   │       ├── conftest.py           # Test fixtures & test DB
│   │       └── test_backend.py       # Automated Pytest suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/layout/        # Sidebar, Navbar, AppLayout
│   │   ├── context/                  # AuthContext (Role Switcher), ThemeContext
│   │   ├── pages/                    # 12 Functional SaaS Pages
│   │   │   ├── DashboardPage.tsx     # Operational KPI & Recharts
│   │   │   ├── FindParkingPage.tsx   # Map-Free Facility Search
│   │   │   ├── SlotManagementPage.tsx# Interactive Slot Bay Grid
│   │   │   ├── ReservationsPage.tsx  # Timeline & Gate Pass QR
│   │   │   ├── VehiclesPage.tsx      # Vehicle fleet management
│   │   │   ├── EntryExitPage.tsx     # Operator Console & Barrier Simulator
│   │   │   ├── ParkingLotsPage.tsx   # Facilities Explorer
│   │   │   ├── PaymentsPage.tsx      # Ledger & Payment Sandbox
│   │   │   ├── AnalyticsPage.tsx     # Deep Analytics & CSV Download
│   │   │   ├── NotificationsPage.tsx # Notification Center
│   │   │   ├── SettingsPage.tsx      # Profile & Specifications
│   │   │   ├── HelpPage.tsx          # System Guide & Credentials
│   │   │   ├── LoginPage.tsx         # Auth with 1-Click Persona Login
│   │   │   ├── RegisterPage.tsx      # Account Signup
│   │   │   └── admin/                # Admin Governance Pages
│   │   ├── services/api.ts           # Type-safe Fetch Client
│   │   ├── test/frontend.test.ts     # Vitest Frontend Test Suite
│   │   └── types/index.ts            # TypeScript Domain Interfaces
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔑 Demo Personas & Credentials

The database automatically seeds with realistic demo data on startup:

| Persona Role | Email Address | Password | Permissions & Features |
|---|---|---|---|
| **Administrator** | `admin@smartparking.com` | `Admin@12345` | System-wide analytics, user role updates, slot generator, pricing rules, audit logs |
| **Gate Operator** | `operator@smartparking.com` | `Operator@12345` | Gate entry/exit barrier simulator, active sessions, slot maintenance toggle |
| **Customer** | `customer@smartparking.com` | `Customer@12345` | Find parking, book bays, registered EV & SUV vehicles, gate passes, payment receipts |
| **Customer 2** | `priya@smartparking.com` | `Customer@12345` | Motorcycle & Sedan fleet, historical bookings, cancel booking flow |

> **Tip for Evaluators**: You do not even need to type passwords! A **"Demo Persona Switcher"** is integrated directly in the top Navbar and Login screen for 1-click role swapping.

---

## ⚡ Quick Start Instructions

### Option 1: Local Development (Recommended)

#### 1. Start the FastAPI Backend
```powershell
# From project root:
.\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
* Backend API: `http://localhost:8000`
* Interactive OpenAPI / Swagger Documentation: `http://localhost:8000/docs`

#### 2. Start the React Frontend
```powershell
cd frontend
npm.cmd run dev
```
* Web Application: `http://localhost:5173`

---

### Option 2: Docker Compose (Full Stack + PostgreSQL)
```bash
docker-compose up --build
```
* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:8000`
* PostgreSQL: `localhost:5432`

---

## 🧪 Automated Test Results

The platform includes automated testing across backend APIs, allocation algorithms, and frontend domain logic.

### Backend Pytest Results
```powershell
.\venv\Scripts\pytest.exe backend\app\tests -v
```
**Results**:
* `test_health_check` — **PASSED**
* `test_auth_login_and_roles` — **PASSED**
* `test_map_free_parking_search` — **PASSED**
* `test_slot_grid_retrieval_and_filtering` — **PASSED**
* `test_intelligent_allocation_and_booking` — **PASSED** (Allocation + Conflict Prevention)
* `test_entry_and_exit_operations` — **PASSED** (Gate Check-in, Check-out & Billing)
* `test_dashboard_analytics_and_csv_export` — **PASSED** (KPIs & Real CSV download)
**Total: 7 / 7 Backend Tests Passed (100%)**

### Frontend Vitest Results
```powershell
cd frontend
npm.cmd test
```
**Results**:
* `strictly adheres to map-free architecture` — **PASSED**
* `validates slot status badge mappings and color codes` — **PASSED**
* `validates occupancy rate formula calculation` — **PASSED**
* `validates pricing rule billable duration calculation` — **PASSED**
* `verifies role-based access route permissions` — **PASSED**
**Total: 5 / 5 Frontend Tests Passed (100%)**

---

## 📊 Occupancy Calculation Formula

In compliance with smart-city municipal standards:
$$\text{Occupancy Rate} = \frac{\text{Occupied Slots}}{\text{Total Operational Slots}} \times 100$$
Where:
$$\text{Total Operational Slots} = \text{Total Slots} - (\text{Maintenance Slots} + \text{Disabled Slots})$$
Disabled and maintenance bays are excluded from operational capacity to prevent misleading statistics.

---

## 🔒 Known Limitations & Future Enhancements

1. **Hardware Simulation**: Barrier gates and ANPR cameras are currently simulated in software via digital triggers. Physical hardware relays can be interfaced via MQTT / WebSockets in Phase 2.
2. **Payment Gateway**: Integrates simulated payment settlement for local testing. A drop-in configuration interface is ready for live Razorpay / Stripe keys.
3. **SMS / Email Gateway**: In-app notifications are stored in the database. Production deployments can connect Twilio / SendGrid credentials.

---

## 🎓 Academic & Demonstration Readiness
* **Demonstration Ready**: Yes, fully functional locally with comprehensive seed data and zero external dependencies required.
* **Security**: JWT role-based access control, PBKDF2 password hashing, and database transactional integrity.
