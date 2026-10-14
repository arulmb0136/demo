# Ironclad Live Contract Hub & RBAC Management Platform

A production-ready enterprise contract management and analytics platform featuring a **React (Vite + TypeScript)** frontend and a **FastAPI** backend.

---

## 1. Architectural Principles

1. **Zero Database Contract Storage**:
   - Contracts, agreements, and document metadata are **never** persisted to the local PostgreSQL database.
   - All contract data is fetched live in real time from the **Ironclad API** (`developer.ironcladapp.com`).
2. **PostgreSQL Exclusively for User & Role RBAC**:
   - The PostgreSQL database manages **only** User Accounts (`users`) and Role Definitions & Permission Policies (`role_definitions`).
3. **Automated OAuth2 Token Lifecycle**:
   - Provide only your `IRONCLAD_CLIENT_ID` and `IRONCLAD_CLIENT_SECRET`.
   - The backend automatically acquires access tokens via `POST /oauth/token` (`client_credentials` grant) and transparently handles background token refresh.
4. **Strict 3-Record-Type Filtering**:
   - Only contracts matching the following three allowed record types are processed and displayed in the UI:
     - `Property Service Contract`
     - `Purchase & Sales Agreement`
     - `General Services Agreement`
   - All other contract types from the Ironclad repository are filtered out.
5. **View & Download Only Contract Surface**:
   - Contract mutation endpoints (create, edit, delete, upload) have been removed.
   - Operations on contracts are strictly **View Details** and **View/Download Document Attachments** based on RBAC permissions.
6. **Live Document Streaming**:
   - Attachments are streamed directly from `GET /public/api/v1/records/{id}/attachments/{key}` through the backend to the browser with standard `Content-Disposition`.
7. **Post-Login Real-Time Notifications**:
   - An integrated polling listener notifies the logged-in user whenever new contracts or agreements arrive from Ironclad.
8. **Dynamic 8-Theme System**:
   - Supports Dark Modern, Clean Light, Deep Blue, Pastel Pink, Charcoal Grey, Bright Yellow, LinkedIn Theme, and Windows Theme with persistent theme switching.

---

## 2. Environment Configuration

### Backend Configuration (`backend/.env`)

Create or update `backend/.env` (you can copy from `backend/.env.example`):

```bash
# -----------------------------------------------------------------------------
# FastAPI Application Configuration
# -----------------------------------------------------------------------------
APP_NAME="Ironclad Contract Hub API"
ENVIRONMENT="production"
DEBUG=false
PORT=8000
HOST="0.0.0.0"

# CORS Allowed Origins
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

# Centralized Logging
LOG_LEVEL="INFO"
LOG_FORMAT="colored"

# Security & JWT Authentication (for platform login)
SECRET_KEY="ironclad_super_secret_jwt_key_change_in_production_2026_xyz!"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# -----------------------------------------------------------------------------
# PostgreSQL Database (ONLY for Users, Roles & Permissions)
# Contracts and documents are NOT stored here.
# -----------------------------------------------------------------------------
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ironclad_db"

# -----------------------------------------------------------------------------
# Ironclad Live API Credentials (developer.ironcladapp.com)
# -----------------------------------------------------------------------------
# Server URLs:
#   Production: https://ironcladapp.com/public/api/v1
#   Demo:       https://demo.ironcladapp.com/public/api/v1
#   EU:         https://eu1.ironcladapp.com/public/api/v1
IRONCLAD_API_BASE_URL="https://ironcladapp.com/public/api/v1"
IRONCLAD_TOKEN_URL="https://ironcladapp.com/oauth/token"
IRONCLAD_CLIENT_ID="YOUR_CLIENT_ID_UUID"
IRONCLAD_CLIENT_SECRET="YOUR_CLIENT_SECRET"

# Optional actor header (x-as-user-email)
IRONCLAD_AS_USER_EMAIL=""

# Aliases CLIENT_ID and CLIENT_SECRET are also supported.
```

### Frontend Configuration (`frontend/.env`)

Create or update `frontend/.env` (or copy from `frontend/.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE="Ironclad Contract Hub"
VITE_ENABLE_ANALYTICS=true
VITE_DEFAULT_THEME=dark
```

---

## 3. Step-by-Step Setup & Execution

### Step 3.1: Start the Backend (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd d:\Ironclad\backend
   ```

2. Initialize the PostgreSQL schema (creates only `users` and `role_definitions` tables and seeds initial administrator and role accounts):
   ```bash
   python -m scripts.init_db
   ```

3. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

   - Backend API is accessible at: `http://localhost:8000`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/api/v1/health`

---

### Step 3.2: Start the Frontend (React + Vite)

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd d:\Ironclad\frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

   - Open your browser at: `http://localhost:5173`

---

## 4. Pre-Configured Test Accounts (RBAC)

The PostgreSQL database is seeded with accounts to test the Role-Based Access Control matrix:

| Persona | Email | Password | Role | Permissions & Policies |
|---|---|---|---|---|
| **System Administrator** | `admin@ironclad.demo` | `Admin123!` | `admin` | Full system access: `contracts:view`, `contracts:download`, `users:manage`, `roles:manage` |
| **Operations Manager** | `manager@ironclad.demo` | `Manager123!` | `manager` | `contracts:view`, `contracts:download` |
| **Legal Counsel / Specialist** | `editor@ironclad.demo` | `Editor123!` | `editor` | `contracts:view`, `contracts:download` |
| **Compliance Auditor** | `viewer@ironclad.demo` | `Viewer123!` | `viewer` | `contracts:view` only (**Document downloads restricted**) |

---

## 5. Live Data Flow & Features Walkthrough

### 5.1 Listing Record IDs & Whitelisted Records
1. Upon logging in, the frontend queries `GET /api/v1/contracts`.
2. The backend:
   - Validates that the logged-in user possesses the `contracts:view` permission policy.
   - Automatically acquires a valid OAuth2 bearer token from Ironclad.
   - Calls `GET /public/api/v1/records/ids`.
   - Retrieves record details via `GET /public/api/v1/records/{id}`.
   - Discards any record that is **not** one of the 3 whitelisted types:
     - `Property Service Contract`
     - `Purchase & Sales Agreement`
     - `General Services Agreement`
   - Returns the filtered records to the frontend.
3. The UI presents:
   - The list of live Record IDs in the top status bar.
   - Category filter pills for each of the 3 allowed record types.
   - Interactive responsive grid cards.
   - Sortable data table view.
   - Lite BI Tool analytics dashboard.

### 5.2 Viewing Agreement Details & Attachments
1. Click on any contract card or row to open the **Contract Detailed View**.
2. Inspect lifecycle tracking dates (Agreement Date, Start Date, Expiration Date, Last Synced Date) and custom attributes.
3. View the list of document attachments:
   - **View Document**: Opens the document in an inline browser tab (`disposition=inline`) if user has `contracts:view` permission.
   - **Download Document**: Streams the binary file (`disposition=attachment`) if user has `contracts:download` permission. Users with restricted roles (such as `viewer`) will see the download button disabled.

### 5.3 Live Post-Login Notifications
- The application periodically queries `/api/v1/contracts/notifications/check`.
- When new contracts or agreements arrive from Ironclad, a toast notification alerts the user, and the notification bell dropdown lists recent arrivals.

### 5.4 User & Role Management
- Administrators (`admin`) can navigate to the **User & Role Management** tab:
  - **+ Add User**: Add new users with assigned roles and permission policies.
  - **Edit User**: Modify user profiles, update active status, or change role assignments.
  - **+ Add Role**: Create custom roles with tailored default permission policies.
  - **Edit Role**: Modify existing role names, descriptions, and permission policies.
  - **Whitelisted Categories**: Inspect authorized Ironclad record types and their governance policies.

---

## 6. Directory Structure

```
Ironclad/
├── ARCHITECTURE.md          # Complete technical design & sequence diagrams (v2.0)
├── FEATURES.md              # Functional specifications & RBAC definitions
├── TASKS.md                 # Sequential execution plan & completed milestones
├── README.md                # Setup guide and instructions
│
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py      # /login, /me, /register
│   │   │   ├── contracts.py # /contracts (Live Ironclad proxy & attachment streamer)
│   │   │   ├── roles.py     # /roles (Role matrix, add/edit role)
│   │   │   ├── users.py     # /users (User administration, add/edit user)
│   │   │   └── health.py    # /health probe
│   │   ├── core/
│   │   │   ├── config.py    # Externalized settings (Client ID & Secret loading)
│   │   │   ├── database.py  # SQLAlchemy engine & session provider
│   │   │   ├── logging.py   # Centralized structured logger
│   │   │   └── security.py  # JWT & RBAC permission dependency checkers
│   │   ├── middleware/
│   │   │   └── logging_middleware.py # Request tracing & correlation IDs
│   │   ├── models/
│   │   │   ├── base.py      # Declarative base & timestamp mixins
│   │   │   ├── user.py      # User model (PostgreSQL)
│   │   │   └── role_permission.py # Role definitions model (PostgreSQL)
│   │   ├── schemas/
│   │   │   ├── user.py      # User schemas
│   │   │   ├── role.py      # Role & matrix schemas
│   │   │   └── contract.py  # Live Ironclad record & attachment schemas
│   │   ├── services/
│   │   │   ├── auth_service.py     # Platform authentication
│   │   │   ├── ironclad_service.py # Pure live Ironclad API client & OAuth manager
│   │   │   └── user_service.py     # User & role CRUD operations
│   │   └── main.py          # FastAPI application factory
│   ├── scripts/
│   │   └── init_db.py       # Seeds PostgreSQL users & role definitions ONLY
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts    # Axios client with Bearer token & correlation ID interceptor
    │   ├── context/
    │   │   ├── AuthContext.tsx  # Authentication & permission validation (`hasPermission`)
    │   │   └── ThemeContext.tsx # 8 Dynamic themes switcher
    │   ├── components/
    │   │   ├── Navbar.tsx             # Header with theme dropdown & notification bell
    │   │   ├── NotificationCenter.tsx # Live notification dropdown & toast alerts
    │   │   ├── ContractCard.tsx       # Responsive record card with Record ID & details
    │   │   ├── ContractDetailModal.tsx# Agreement detail view & document download/view
    │   │   ├── BiTool.tsx              # Lite BI Tool analytics & charts
    │   │   ├── ThemeSelector.tsx      # 8-theme visual palette switcher
    │   │   └── ProtectedRoute.tsx     # Route authorization guard
    │   ├── pages/
    │   │   ├── Dashboard.tsx  # Responsive grid & table view of allowed contracts
    │   │   ├── AdminRoles.tsx # User Add/Edit & Role Add/Edit management console
    │   │   ├── SignIn.tsx     # Sign-in page with 1-click test credentials
    │   │   └── Home.tsx       # System overview & live connection architecture
    │   ├── types/
    │   │   └── index.ts       # TypeScript interface definitions
    │   └── styles/
    │       └── index.css      # CSS custom properties for all 8 dynamic themes
    └── package.json
```
