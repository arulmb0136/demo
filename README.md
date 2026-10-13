# Ironclad Contract Hub & Analytics Platform

A high-performance enterprise contract management, workflow automation, and analytics platform featuring a **React (Vite + TypeScript)** frontend and a **FastAPI** backend. Built with a layered architecture, role-based access control (RBAC), multi-theme design system, centralized logging with correlation IDs, Ironclad API synchronization, PostgreSQL persistence, and S3 document storage.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start with Docker](#quick-start-with-docker)
4. [Local Development Setup](#local-development-setup)
   - [Backend Setup (FastAPI)](#backend-setup-fastapi)
   - [Database Seeding](#database-seeding)
   - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
5. [Environment Configuration](#environment-configuration)
6. [Demo Accounts](#demo-accounts)
7. [API Documentation](#api-documentation)
8. [Project Structure](#project-structure)

---

## Architecture Overview

```
                      +-----------------------------+
                      |   React + Vite Frontend     |
                      |   (Port 5173 / Docker 80)   |
                      +--------------+--------------+
                                     |
                         Axios / REST (JWT Bearer)
                                     |
                      +--------------v--------------+
                      |       FastAPI Backend       |
                      |          (Port 8000)        |
                      +--------------+--------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
+---------v----------+    +----------v---------+    +-----------v----------+
|  PostgreSQL 16 DB  |    |  Ironclad REST API |    |  AWS S3 / MinIO      |
|  (Port 5432)       |    |  (Toggleable Sync) |    |  (Document Storage)  |
+--------------------+    +--------------------+    +----------------------+
```

- **Frontend:** React 18, Vite, TypeScript, Lucide Icons, Chart.js / Canvas BI Engine, Context-based RBAC and 8-theme dynamic switcher.
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy 2.0 (async/sync), Pydantic v2, Jose JWT, Boto3 S3 client, Requests/Httpx for Ironclad API.
- **Database:** PostgreSQL 16 (via Docker or local instance).
- **Storage:** Amazon S3 or MinIO / Local Emulated S3 storage fallback.

---

## Prerequisites

- **Node.js:** v18.x or v20.x+ (`v22.x` tested)
- **Python:** 3.10+ (`3.11` or `3.12` / `3.14` supported)
- **Docker & Docker Compose:** Optional for containerized deployment, recommended for PostgreSQL.

---

## Quick Start with Docker

Run the complete multi-tier stack (PostgreSQL, FastAPI Backend, React Frontend) in containers:

1. **Clone repository and enter project root:**
   ```bash
   cd d:/Ironclad
   ```

2. **Copy environment configuration files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp config/postgres.env.example config/postgres.env
   cp config/s3.env.example config/s3.env
   ```

3. **Launch all services using Docker Compose:**
   ```bash
   docker compose up --build -d
   ```

4. **Verify container status:**
   ```bash
   docker compose ps
   ```

5. **Seed the database inside the backend container:**
   ```bash
   docker compose exec backend python -m scripts.init_db
   ```

6. **Access applications:**
   - **Frontend App:** [http://localhost:5173](http://localhost:5173) (or [http://localhost:80](http://localhost:80) in production mode)
   - **FastAPI Interactive Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **FastAPI Alternative Docs (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - **Healthcheck:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## Local Development Setup

If running natively without Docker:

### Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your PostgreSQL connection string, Ironclad credentials, and JWT secret.*

5. **Initialize and seed database:**
   ```bash
   python -m scripts.init_db
   ```

6. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup (React + Vite)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install npm dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Ensure `VITE_API_BASE_URL=http://localhost:8000` is configured.*

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:** [http://localhost:5173](http://localhost:5173)

---

## Database Seeding & Schema Migrations

To populate the database with complete contract lifecycle tracking dates and demo users, run the migration & seeding script:

```bash
# From within the backend directory:
python -m scripts.init_db

# Or from the project root (Docker container):
docker compose exec backend python -m scripts.init_db
```

### What this script does:
1. **Automated Schema Migration:** Detects if any columns are missing (e.g. `start_date`, `completion_date`, `agreement_date`, `signed_date`, `last_synced_date`, `renewal_notice_date`, `related_records`) and executes safe `ALTER TABLE ... ADD COLUMN` statements with zero data loss.
2. **Role & Permission Matrix Seeding:** Seeds default RBAC roles (`admin`, `manager`, `editor`, `viewer`) and granular capabilities (`read`, `write`, `edit`, `delete`, `admin`).
3. **Demo User Accounts:** Seeds 4 predefined accounts with salted bcrypt password hashes.
4. **Rich Contract Lifecycle Demo Data:** Populates sample contracts representing diverse workflows (Master Services Agreements, Mutual NDAs, DPAs, SOWs, Software Licenses) with realistic start dates, completion milestones, and attached documents.
5. **Backfill Existing Contracts:** If existing contracts lack tracking dates, it backfills baseline dates automatically.

---

## Connecting with Real Ironclad API (`developer.ironcladapp.com`)

To switch from the local sandbox / mock mode to live Ironclad Cloud API integration:

### Step 1: Generate API Credentials in Ironclad
1. Log into your Ironclad enterprise tenant (e.g. `https://ironcladapp.com`).
2. Navigate to **Company Settings** (gear icon in lower-left) &rarr; **Integrations & API**.
3. Under **API Tokens / Service Accounts**, click **Create API Token** (or create an OAuth2 Connected App).
4. Assign appropriate scopes:
   - `records:read` & `records:write` (for Records API access)
   - `workflows:read` (for Workflow synchronizations)
5. Copy your **API Token / Bearer Token** and **Client ID / Secret**.

### Step 2: Configure Secrets in `backend/.env`
Open [backend/.env](file:///d:/Ironclad/backend/.env) (created from `backend/.env.example`) and configure the Ironclad parameters:

```ini
# ==============================================================================
# IRONCLAD API & DATA LAKE CONFIGURATION (developer.ironcladapp.com)
# ==============================================================================

# 1. Base URL for your Ironclad Region:
# US Commercial: https://ironcladapp.com/public/api/v1
# EU Cloud:      https://eu.ironcladapp.com/public/api/v1
# Demo Sandbox:  https://demo.ironcladapp.com/public/api/v1
IRONCLAD_API_BASE_URL=https://ironcladapp.com/public/api/v1

# 2. OAuth2 / Service Account Secrets:
IRONCLAD_CLIENT_ID=your_ironclad_client_id_here
IRONCLAD_CLIENT_SECRET=your_ironclad_client_secret_here

# 3. Personal Access Token / Bearer Token (if using Direct Bearer Authentication):
IRONCLAD_BEARER_TOKEN=your_ironclad_bearer_token_here

# 4. Turn OFF Demo Mode to trigger live HTTP requests to Ironclad:
IRONCLAD_DEMO_MODE=false

# 5. Data Source Routing Toggle:
# Set to 'ironclad' to pull directly from Ironclad API, or 'postgres' for local DB with one-click live sync:
DATA_SOURCE=ironclad
```

### Step 3: Verify Real Connection
Restart the backend server (`uvicorn app.main:app --reload` or Docker container). 
Click **"Sync with Ironclad"** in the web dashboard or send a POST request:
```bash
curl -X POST http://localhost:8000/api/v1/contracts/sync-ironclad \
     -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
The sync engine will pull records using the Data Lake query filter (`/public/api/v1/records?lastUpdated=...`), extract lifecycle dates, and upsert them into PostgreSQL.

---

## Contract Lifecycle & Tracking Dates (Data Lake Schema)

Derived from the [Ironclad Data Lake / Warehouse Integration Specification](https://developer.ironcladapp.com/docs/data-lakedata-warehouse-integration):

| Field Name | Type | Description | Ironclad Source |
|------------|------|-------------|-----------------|
| `agreement_date` | `datetime` | Date the contract was formally agreed upon | `record.properties.agreementDate.value` |
| `start_date` | `datetime` | Term commencement date | `record.properties.startDate.value` |
| `completion_date` | `datetime` | Target or actual contract expiration / completion date | `record.properties.expirationDate.value` |
| `current_date` | `datetime` | Server evaluation reference timestamp (UTC) | Dynamic (`utcnow()`) |
| `signed_date` | `datetime` | Execution / countersignature timestamp | `record.properties.signedDate.value` |
| `last_synced_date` | `datetime` | Timestamp of last synchronization with Ironclad | `record.lastUpdated` query filter |
| `renewal_notice_date` | `datetime` | Deadline for providing renewal or non-renewal notice | Computed / `properties.renewalNotice.value` |
| `days_remaining` | `int` | Computed days remaining until completion date | Computed dynamically on server & UI |
| `progress_percent` | `float` | Percentage of contract term elapsed (0% to 100%) | Computed dynamically on server & UI |
| `tracking_status` | `string` | Status: `active`, `expiring_soon` (<30d), `completed`, `expired` | Computed dynamically on server & UI |

---

## Environment Configuration

Externalized environment files are stored in `backend/.env`, `frontend/.env`, and `config/`:

| File | Purpose |
|------|---------|
| `backend/.env.example` | FastAPI server config, Database URL, JWT Secrets, Ironclad API keys, S3 credentials |
| `frontend/.env.example` | Vite API endpoints, Application title, Feature flags |
| `config/postgres.env.example` | PostgreSQL Docker container credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) |
| `config/s3.env.example` | AWS S3 / MinIO bucket name, region, endpoint URL, credentials |
---

## Demo Accounts

The database seeding script (`python -m scripts.init_db`) provisions 4 test accounts:

| Role | Email | Password | Permissions | Key Capabilities |
|------|-------|----------|-------------|------------------|
| **Admin** | `admin@ironclad.demo` | `Admin123!` | `read, write, edit, delete, admin` | Full platform control, RBAC manager, S3 file uploads, Ironclad sync |
| **Manager** | `manager@ironclad.demo` | `Manager123!` | `read, write, edit` | Create and edit contracts, view BI dashboard, download documents |
| **Editor** | `editor@ironclad.demo` | `Editor123!` | `read, write, edit` | Update contract records, upload revisions, view grid & table |
| **Viewer** | `viewer@ironclad.demo` | `Viewer123!` | `read` | Read-only access to contracts & BI visualization, restricted downloads |

---

## Key Features

- **Ironclad API Integration:** Toggle seamlessly between local PostgreSQL storage and direct Ironclad API integration (`DATA_SOURCE=ironclad` vs `DATA_SOURCE=postgres`). Includes one-click live sync.
- **Lite BI Visualization Tool:** Interactive metrics, contract status donuts, monthly pipeline trends, counterparty exposure bars, and category distributions.
- **8 Dynamic UI Themes:** Dark, Light, Deep Blue, Pastel Pink, Charcoal Grey, Bright Yellow, LinkedIn Theme, and Windows Theme.
- **Centralized Logging:** Correlation IDs (`X-Correlation-ID`) tracked across middleware, request lifecycle, services, and repositories.
- **RBAC Matrix Editor:** Admin panel to dynamically inspect and configure roles, permissions, and user assignments.
- **Document Storage:** S3 / MinIO integration with fallback mock storage for seamless offline development.
