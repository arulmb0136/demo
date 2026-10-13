# Project Execution Plan & Task Checklist

This checklist tracks the sequential tasks for building, integrating, and validating the Ironclad Contract Hub application.

---

## Phase 1: Environment & Externalized Configuration
- [x] **Task 1.1**: Create `backend/.env.example` with database, JWT, S3, and Ironclad credentials.
- [x] **Task 1.2**: Create `config/postgres.env.example` for PostgreSQL container configuration.
- [x] **Task 1.3**: Create `config/s3.env.example` for MinIO / AWS S3 credentials.
- [x] **Task 1.4**: Create `frontend/.env.example` with API base URL and app configuration.
- [x] **Task 1.5**: Create root `docker-compose.yml` orchestrating PostgreSQL, FastAPI backend, React frontend, and MinIO storage.

---

## Phase 2: Backend Core, Logging & Data Models
- [x] **Task 2.1**: Set up backend directory structure and `backend/requirements.txt`.
- [x] **Task 2.2**: Implement `backend/app/core/config.py` using `pydantic-settings` to load all externalized environment variables.
- [x] **Task 2.3**: Implement centralized logging in `backend/app/core/logging.py` with structured formatting and correlation ID context tracking.
- [x] **Task 2.4**: Implement `backend/app/middleware/logging_middleware.py` with `X-Correlation-ID` extraction, injection, and execution timing.
- [x] **Task 2.5**: Implement database engine and session provider in `backend/app/core/database.py`.
- [x] **Task 2.6**: Implement security utilities in `backend/app/core/security.py` (bcrypt password hashing, JWT creation/validation, permission dependency checkers).
- [x] **Task 2.7**: Define SQLAlchemy models in `backend/app/models/`:
  - `models/base.py`: Base class and timestamp mixins
  - `models/user.py`: User model with email, hashed_password, role, and JSON permissions
  - `models/contract.py`: Contract model mirroring Ironclad workflow/record schema
  - `models/document.py`: Document attachments model linked to contracts and S3 objects
  - `models/role_permission.py`: Role definition and permission matrix models

---

## Phase 3: Schemas, Repositories & Service Layer
- [x] **Task 3.1**: Define Pydantic request/response schemas in `backend/app/schemas/`:
  - `schemas/user.py`: User registration, login, profile, and role update schemas
  - `schemas/contract.py`: Contract creation, update, filter, and detailed response schemas
  - `schemas/file.py`: Document upload metadata, download URL schemas
  - `schemas/role.py`: Role modification and permission matrix schemas
  - `schemas/common.py`: Standard API envelope, pagination, and error responses
- [x] **Task 3.2**: Implement database repositories in `backend/app/repositories/`:
  - `repositories/base.py`: Generic CRUD operations
  - `repositories/user_repo.py`: User lookup, credential validation, permission updates
  - `repositories/contract_repo.py`: Contract querying, status filtering, metrics aggregation
- [x] **Task 3.3**: Implement services in `backend/app/services/`:
  - `services/auth_service.py`: Authentication, token generation, user verification
  - `services/ironclad_service.py`: Client for `developer.ironcladapp.com` API with mock resilience
  - `services/s3_service.py`: S3 / MinIO storage service with presigned URLs and local fallback
  - `services/contract_service.py`: Contract orchestration and data source toggle (`DATA_SOURCE=postgres` vs `ironclad`)
  - `services/user_service.py`: User administration and RBAC permission assignment

---

## Phase 4: API Routers, Main Entrypoint & Database Seeding
- [x] **Task 4.1**: Implement FastAPI API v1 routers in `backend/app/api/v1/`:
  - `api/v1/health.py`: Health check and system configuration probe
  - `api/v1/auth.py`: `/login`, `/me`, `/refresh`
  - `api/v1/contracts.py`: CRUD endpoints and `/sync-ironclad` toggle endpoint
  - `api/v1/files.py`: S3 file upload, download presigned URL, and listing endpoints
  - `api/v1/roles.py`: Role definitions and permission matrix endpoints
  - `api/v1/users.py`: User administration endpoints with admin guards
- [x] **Task 4.2**: Implement `backend/app/main.py` assembling FastAPI application, CORS configuration, logging middleware, and route mounting.
- [x] **Task 4.3**: Create database seeding script `backend/scripts/init_db.py` to initialize tables and seed 4 demo users (`Admin`, `Manager`, `Editor`, `Viewer`) and sample contracts mirroring Ironclad workflows.
- [x] **Task 4.4**: Create `backend/Dockerfile`.

---

## Phase 5: Frontend Architecture, 8-Theme System & Styling
- [x] **Task 5.1**: Scaffold React + Vite + TypeScript application in `frontend/`.
- [x] **Task 5.2**: Implement the complete design system and all 8 themes in `frontend/src/styles/index.css`:
  - Dark, Light, Deep Blue, Pastel Pink, Charcoal Grey, Bright Yellow, LinkedIn Theme, Windows Theme.
- [x] **Task 5.3**: Implement `frontend/src/context/ThemeContext.tsx` with local storage persistence and dynamic theme switching.
- [x] **Task 5.4**: Create TypeScript interface definitions in `frontend/src/types/index.ts`.

---

## Phase 6: Frontend API Client, Auth Context & Navigation
- [x] **Task 6.1**: Implement `frontend/src/api/client.ts` using Axios with request/response interceptors for Bearer tokens and Correlation ID forwarding.
- [x] **Task 6.2**: Implement `frontend/src/context/AuthContext.tsx` managing login, token persistence, user profile, and RBAC permission verification helpers (`hasPermission`, `hasRole`).
- [x] **Task 6.3**: Implement `frontend/src/components/ProtectedRoute.tsx` for route-level access guarding.
- [x] **Task 6.4**: Build `frontend/src/components/Navbar.tsx` featuring the 8-theme selector dropdown, active user badge, and navigation tabs.
- [x] **Task 6.5**: Build `frontend/src/components/Footer.tsx` with platform status and environment indicators.

---

## Phase 7: Core Application Components
- [x] **Task 7.1**: Implement `frontend/src/components/ThemeSelector.tsx` with visual color swatches for all 8 themes.
- [x] **Task 7.2**: Implement `frontend/src/components/ContractCard.tsx` with status badges, counterparty details, value chips, and action buttons.
- [x] **Task 7.3**: Implement `frontend/src/components/ContractModal.tsx` for creating and editing contracts with permission validation.
- [x] **Task 7.4**: Implement `frontend/src/components/DocumentViewer.tsx` for viewing, downloading, and uploading documents to S3.
- [x] **Task 7.5**: Implement `frontend/src/components/RoleManagerModal.tsx` for admin permission editing.

---

## Phase 8: Pages & Lite BI Visualization Engine
- [x] **Task 8.1**: Implement `frontend/src/pages/Home.tsx` landing page showcasing platform architecture, Ironclad sync, and security.
- [x] **Task 8.2**: Implement `frontend/src/pages/SignIn.tsx` with 1-click quick-login buttons for all 4 demo personas (`Admin`, `Manager`, `Editor`, `Viewer`).
- [x] **Task 8.3**: Implement `frontend/src/components/BiTool.tsx` lite BI visualization engine featuring:
  - KPI tiles (Total Value, Active Contracts, Pending Approvals, Turnaround Time)
  - Contract status distribution donut
  - Top counterparties exposure bar chart
  - Monthly contracting velocity trendline
  - Department distribution
  - Dynamic status and threshold filter controls
- [x] **Task 8.4**: Implement `frontend/src/pages/Dashboard.tsx` with responsive tabs:
  - Grid View (interactive responsive cards)
  - Data Table View (sortable, filterable rows)
  - Document Repository View (file downloads & previews)
  - Lite BI Tool View (analytics & charts)
  - Ironclad Live Sync trigger
- [x] **Task 8.5**: Implement `frontend/src/pages/AdminRoles.tsx` for administrative RBAC inspection and permission management.
- [x] **Task 8.6**: Create `frontend/Dockerfile`.

---

## Phase 9: Verification, Polish & End-to-End Walkthrough
- [x] **Task 9.1**: Initialize database and run seeding script (`python -m scripts.init_db`).
- [x] **Task 9.2**: Verify backend endpoints (Health, Auth, Contracts, S3 Files, Roles, Ironclad sync).
- [x] **Task 9.3**: Test frontend build (`npm run build`) and verify all 8 themes and RBAC flows.
- [x] **Task 9.4**: Confirm logging correlation IDs throughout backend requests.
- [x] **Task 9.5**: Final documentation review and validation summary.
