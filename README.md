# 🧠 LOGIMIND v2 — Enterprise AI-Powered Logistics Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **LOGIMIND v2** is a mission-critical, AI-augmented supply chain and logistics intelligence platform engineered with Clean Architecture principles. It delivers end-to-end multi-modal visibility, dynamic route optimization, predictive demand forecasting, real-time IoT shipment telematics, and automated warehouse management.

---

## 🏛️ System Architecture

LOGIMIND v2 follows an enterprise-grade **Domain-Driven, Clean Layered Architecture**:

```
                  ┌──────────────────────────────────────────────────┐
                  │          LOGIMIND v2 Presentation Tier          │
                  │   React 19 + TypeScript + Leaflet + Recharts     │
                  └────────────────────────┬─────────────────────────┘
                                           │ HTTP REST / WebSockets
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │                 API Gateway Layer                │
                  │    FastAPI + JWT RBAC + RateLimiter + Exceptions │
                  └────────────────────────┬─────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐              ┌──────────────────┐
│ Logistics Engine │             │ AI & ML Services │              │ IoT & Telematics │
│ - Warehouses     │             │ - Co-Pilot Chat  │              │ - Live Tracking  │
│ - Inventory / PO │             │ - Demand Forecast│              │ - Geo-Checkpoints│
│ - Fleet / Driver │             │ - Route Optimizer│              │ - Vehicle Status │
└────────┬─────────┘             └────────┬─────────┘              └────────┬─────────┘
         │                                │                                 │
         └────────────────────────────────┼─────────────────────────────────┘
                                          │
                                          ▼
                  ┌──────────────────────────────────────────────────┐
                  │                Persistence Layer                 │
                  │   SQLAlchemy 2.0 ORM + MySQL 8 / SQLite Engine   │
                  └──────────────────────────────────────────────────┘
```

---

## 🌟 Core Feature Matrix

### 1. 🚚 Real-Time Shipment Tracking & Telematics
- Live interactive GPS tracking powered by Leaflet & OpenStreetMap.
- Complete timeline audit log with automated RFID checkpoints, dispatch bays, and transit telematics.
- Predictive delay risk modeling with automated re-routing recommendations.

### 2. 🗺️ Multi-Criteria AI Route Optimizer
- Algorithmic route engine considering distance, road conditions, speed limits, vehicle weight, and refrigeration constraints.
- Real-time weather risk integration (temperature, precipitation, wind speed, roadway icing hazards).
- Carbon footprint modeling calculating CO₂ output in kilograms per trip.

### 3. 🤖 AI Logistics Co-Pilot
- Natural language query parser recognizing dispatch, inventory, forecasting, and tracking intents.
- Predictive demand forecasting using exponential smoothing and lead-time heuristics.
- Storage slotting optimization recommendations for warehouse capacity rebalancing.

### 4. 🏭 Warehouse & Inventory Intelligence
- Multi-facility management with zone-level tracking: Dry Bulk, Cold Chain, and Hazardous Materials.
- Automated low-stock alerts, safety stock thresholds, and stock transfer workflows between distribution hubs.
- Purchase order lifecycle with approval chains and supplier reliability scoring.

### 5. 🚛 Fleet & Driver Operations
- Real-time vehicle telematics tracking mileage, fuel efficiency, EV battery status, and maintenance logs.
- Commercial driver safety scoring, CDL licensing verification, and duty status dispatch.

---

## 🔐 Role-Based Access Control (RBAC)

LOGIMIND v2 implements strict role guards across all sensitive operations:

| Role | Permissions |
|---|---|
| **ADMIN** | Full system governance, user provisioning, global overrides, and audit trails. |
| **MANAGER** | Route approvals, fleet assignments, supplier purchase orders, and analytics. |
| **WAREHOUSE_MANAGER** | Facility load monitoring, inventory counts, stock transfers, and shipment dispatch. |
| **DRIVER** | Mobile telematics pings, route checkpoints, and delivery signature confirmations. |
| **SUPPLIER** | Consignment updates, catalog pricing, and purchase order fulfillment. |
| **EMPLOYEE** | Read-only operations view and catalog queries. |

### Default Seed Demo Credentials

All accounts are pre-seeded and ready for instant login:

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@logimind.ai` | `LogiMind@2026` |
| **Operations Manager** | `manager@logimind.ai` | `LogiMind@2026` |
| **Warehouse Manager** | `wh_sf@logimind.ai` | `LogiMind@2026` |
| **Fleet Driver** | `driver1@logimind.ai` | `LogiMind@2026` |
| **Hardware Supplier** | `supplier1@globaltech.com` | `LogiMind@2026` |

---

## 🚀 Quick Start Guide

### Option 1: Native One-Click Startup (Recommended for Local Dev)

Ensure you are in the project root:

```powershell
# Using PowerShell
.\run_dev.ps1

# Or using Windows Batch
.\run_dev.bat
```

This launches:
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)

---

### Option 2: Manual Development Mode

#### 1. Backend Setup
```bash
cd backend

# Install dependencies (Python 3.12+)
pip install -r requirements.txt

# Run database migrations and launch server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```

---

### Option 3: Full Docker Orchestration

Run the complete multi-container stack with MySQL 8, Redis 7, FastAPI, and Nginx:

```bash
docker-compose up --build -d
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **MySQL Database**: `localhost:3306`

---

## 🧪 Automated Testing Suite

LOGIMIND v2 is backed by end-to-end integration and unit tests:

```bash
# Run backend pytest suite
cd backend
python -m pytest tests/ -v

# Run frontend typecheck and production build
cd frontend
npm run build
```

---

## 📂 Project Structure

```
LOGIMIND AI PLUS/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Shipments, Warehouses, Fleet, Routes, AI
│   │   ├── core/              # Config, Security, JWT, Logging
│   │   ├── db/                # Session, Engine, Seeder
│   │   ├── middleware/        # Rate Limiter, Error Handling
│   │   ├── models/            # SQLAlchemy ORM Models
│   │   ├── repositories/      # Data Access Layer
│   │   ├── schemas/           # Pydantic v2 Contracts
│   │   └── services/          # Business Logic & AI Engines
│   ├── tests/                 # Automated Pytest Test Suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, Sidebar, Topbar, Modals, Maps
│   │   ├── pages/             # Dashboard, Shipments, Fleet, AI, Analytics
│   │   ├── services/          # Axios API Gateway
│   │   ├── store/             # Zustand State Management
│   │   ├── styles/            # Enterprise Glassmorphism Design System
│   │   └── types/             # TypeScript Domain Interfaces
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── run_dev.ps1
├── run_dev.bat
└── README.md
```

---

## 🛡️ Enterprise Security & Resilience
- **JWT & Bcrypt**: Compliant cryptographically salted token issuance with 24h expiration and refresh token rotation.
- **Rate Limiting**: Built-in sliding window rate limiter (300 requests/minute per client IP).
- **Validation**: Strict Pydantic v2 payload sanitization with HTTP 422 error structures.
- **CORS Protection**: Whitelisted origin headers configurable via `.env`.
- **Database Resilience**: Pre-ping connection health checks and automatic SQLite/MySQL pooling.
