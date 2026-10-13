# System Architecture & Technical Design

## 1. High-Level Architecture Overview

The Ironclad Contract Hub is built following enterprise-grade **Layered Architecture** principles, strict separation of concerns, 12-factor externalized configuration, and zero-trust role-based access control.

```mermaid
graph TD
    User([End User / Web Browser]) -->|HTTP / HTTPS| FE[React + Vite Frontend\nPort 5173 / Port 80]
    
    subgraph Frontend Architecture
        FE --> UI[Responsive UI Layer\n8 Dynamic Themes]
        UI --> AuthCtx[Auth & RBAC Context]
        UI --> BITool[Lite BI Tool & Charts]
        UI --> AxiosClient[Axios API Client\nBearer JWT + Correlation ID]
    end

    AxiosClient -->|REST API / JSON| Gateway[FastAPI Application Gateway\nPort 8000]

    subgraph Backend Layered Architecture
        Gateway --> MW[Logging Middleware\nCorrelation ID Injection]
        MW --> Routers[API Routers /api/v1\nAuth | Contracts | Files | Roles | Users]
        Routers --> Services[Service Layer\nBusiness Logic & Permissions Validation]
        
        Services --> AuthService[AuthService\nJWT & Password Hashing]
        Services --> ContractService[ContractService\nToggleable Data Source Routing]
        Services --> IroncladService[IroncladService\nREST API Client developer.ironcladapp.com]
        Services --> S3Service[S3Service\nDocument Uploads / Presigned URLs]
        
        ContractService --> Repositories[Repository Layer\nSQLAlchemy ORM Sessions]
        Repositories --> Models[Database Models\nDeclarative Base]
    end

    Repositories -->|PostgreSQL Protocol| PG[(PostgreSQL 16 DB\nDocker Container)]
    IroncladService -->|HTTPS / OAuth2| IroncladAPI[Ironclad Cloud API\ndeveloper.ironcladapp.com]
    S3Service -->|Boto3 API| S3[(AWS S3 / MinIO Storage)]
```

---

## 2. Backend Layered Architecture (`API -> Service -> Repository -> Model`)

The FastAPI backend strictly enforces unidirectional dependency flow:

```
+-----------------------------------------------------------+
|                      API Routers                          |
|  (backend/app/api/v1/*.py)                                |
|  - Validates request payload schemas (Pydantic)           |
|  - Extracts authenticated user and correlation context    |
|  - Enforces route-level RBAC role/permission dependencies |
+-----------------------------+-----------------------------+
                              | calls
+-----------------------------v-----------------------------+
|                     Service Layer                         |
|  (backend/app/services/*.py)                              |
|  - Encapsulates domain logic and business rules           |
|  - Orchestrates transactions, data transforms, and sync   |
|  - Interfaces with external APIs (Ironclad, AWS S3)       |
+-----------------------------+-----------------------------+
                              | calls
+-----------------------------v-----------------------------+
|                   Repository Layer                        |
|  (backend/app/repositories/*.py)                          |
|  - Manages database querying and persistence              |
|  - Isolated from HTTP requests, headers, and web concerns |
|  - Encapsulates SQLAlchemy queries, filtering, pagination |
+-----------------------------+-----------------------------+
                              | uses
+-----------------------------v-----------------------------+
|                      Model Layer                          |
|  (backend/app/models/*.py)                                |
|  - Pure SQLAlchemy Declarative Data Models                |
|  - Defines DB tables, relationships, constraints, indexes |
+-----------------------------------------------------------+
```

### Directory Structure & Responsibilities

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py          # /login, /me, /refresh
│   │       ├── contracts.py     # /contracts CRUD, /contracts/sync-ironclad
│   │       ├── files.py         # /files/upload, /files/:id/download, /files
│   │       ├── roles.py         # /roles, /roles/:id, /permissions
│   │       ├── users.py         # /users CRUD, role assignment
│   │       └── health.py        # /health, system readiness probes
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings externalized config
│   │   ├── database.py          # SQLAlchemy engine, sessionmaker, get_db
│   │   ├── logging.py           # Structured JSON & console centralized logger
│   │   └── security.py          # Bcrypt hashing, JWT encode/decode, RBAC guards
│   ├── middleware/
│   │   └── logging_middleware.py # Request tracing, Correlation ID injection
│   ├── models/
│   │   ├── base.py              # DeclarativeBase, TimestampMixin
│   │   ├── user.py              # User model (id, email, hashed_pwd, role, permissions)
│   │   ├── contract.py          # Contract model (Ironclad workflows/records mirror)
│   │   ├── document.py          # Document model (S3 keys, metadata, contract FK)
│   │   └── role_permission.py   # Role & Permission definition models
│   ├── repositories/
│   │   ├── base.py              # Generic CRUD repository interface
│   │   ├── contract_repo.py     # Contract queries, filtering, status grouping
│   │   └── user_repo.py         # User lookups, role & permission updates
│   ├── schemas/
│   │   ├── common.py            # Generic response envelope, pagination
│   │   ├── user.py              # UserCreate, UserResponse, UserUpdate
│   │   ├── contract.py          # ContractCreate, ContractResponse, ContractFilter
│   │   ├── file.py              # FileUploadResponse, DocumentMetadata
│   │   └── role.py              # RoleUpdate, PermissionMatrix
│   ├── services/
│   │   ├── auth_service.py      # Authentication, token generation, user verification
│   │   ├── contract_service.py  # Contract lifecycle, source routing (PG vs Ironclad)
│   │   ├── ironclad_service.py  # HTTP client for developer.ironcladapp.com
│   │   ├── s3_service.py        # AWS S3 / MinIO storage and presigned download URLs
│   │   └── user_service.py      # User management, role elevation
│   └── main.py                  # FastAPI app factory, CORS, middleware, router mount
├── scripts/
│   └── init_db.py               # Table creation, sample seeding with 4 roles
├── .env.example
├── Dockerfile
└── requirements.txt
```

---

## 3. Frontend Architecture (React + Vite + TypeScript)

The frontend is constructed with modern React 18, Vite tooling, and TypeScript:

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts            # Axios singleton with auto Bearer JWT & Correlation ID
│   ├── context/
│   │   ├── AuthContext.tsx      # Current user state, login, logout, permission checks
│   │   └── ThemeContext.tsx     # 8-theme runtime switcher with localStorage persist
│   ├── components/
│   │   ├── Navbar.tsx           # Global header, theme dropdown, profile badge
│   │   ├── Footer.tsx           # Application status, version, links
│   │   ├── ProtectedRoute.tsx   # Route guards for authentication & required permissions
│   │   ├── ThemeSelector.tsx    # Visual theme picker with color preview swatches
│   │   ├── ContractCard.tsx     # Responsive card view component
│   │   ├── ContractModal.tsx    # Contract creation / editing modal
│   │   ├── DocumentViewer.tsx   # PDF / document preview & download handler
│   │   ├── BiTool.tsx           # Interactive charts and KPI metrics tab
│   │   └── RoleManagerModal.tsx # Admin interface for editing user roles and permissions
│   ├── pages/
│   │   ├── Home.tsx             # Public landing & feature showcase
│   │   ├── SignIn.tsx           # Authentication page with demo quick-login credentials
│   │   ├── Dashboard.tsx        # Main application dashboard (Grid, Table, Docs, BI Tabs)
│   │   └── AdminRoles.tsx       # Dedicated Admin RBAC Management screen
│   ├── styles/
│   │   └── index.css            # CSS variables for all 8 themes, utility classes
│   ├── types/
│   │   ├── index.ts             # TypeScript interfaces for Contract, User, Role, Document
│   │   └── theme.ts             # Theme enum and token contracts
│   ├── App.tsx                  # React Router setup & Provider wrapping
│   └── main.tsx                 # DOM Entrypoint
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
└── .env.example
```

---

## 4. Centralized Logging & Correlation Tracing

Each HTTP request entering the application lifecycle is tagged with a unique **Correlation ID** (`X-Correlation-ID`):

```
Client Request
      |
      v
LoggingMiddleware
      |-- 1. Extract 'X-Correlation-ID' header or generate UUIDv4
      |-- 2. Store Correlation ID in contextvars (ContextVar)
      |-- 3. Log incoming request: [CORR_ID] [METHOD] [PATH] [CLIENT_IP]
      v
API Route -> Service -> Repository
      |-- 4. All logger.info/error calls automatically attach [CORR_ID]
      v
LoggingMiddleware Response
      |-- 5. Calculate request duration (ms)
      |-- 6. Inject 'X-Correlation-ID' into HTTP Response headers
      |-- 7. Log completion: [CORR_ID] [STATUS] [DURATION_MS]
      v
Client receives response with X-Correlation-ID header
```

### Log Output Format
Logs support both human-readable colored output (development) and structured JSON (production):
```json
{
  "timestamp": "2026-10-13T22:00:00.123Z",
  "level": "INFO",
  "correlation_id": "c7a82b9e-4e6f-402a-bf3e-9080b0369a41",
  "logger": "app.api.v1.contracts",
  "message": "Fetched 24 contracts successfully",
  "user_id": 1,
  "execution_time_ms": 14.2
}
```

---

## 5. Ironclad API Integration & Toggleable Architecture

The system supports two complementary modes of operation controlled via `DATA_SOURCE`:

### Mode A: Local PostgreSQL Database (`DATA_SOURCE=postgres`)
- Queries are executed against local PostgreSQL tables (`contracts`, `contract_documents`).
- Guarantees zero latency and offline capability.
- Allows local CRUD operations, editing, and status progression.

### Mode B: Direct Ironclad API (`DATA_SOURCE=ironclad`)
- Proxies requests to `https://ironcladapp.com/api/v1/` using `IRONCLAD_CLIENT_ID` and `IRONCLAD_CLIENT_SECRET`.
- Transforms Ironclad workflow schemas into application domain models.
- Graceful fallback: If external API calls fail or offline mock mode is active, the service falls back to local data with structured notifications.

### Sync Pipeline (`POST /api/v1/contracts/sync-ironclad`)
- On-demand or scheduled synchronization pull from Ironclad API.
- Upserts contracts, workflow stages, document attachment links, and metadata into PostgreSQL.

---

## 6. Document Management & S3 Architecture

```
Document Upload Flow:
Client ---> POST /api/v1/files/upload (Multipart FormData)
         ---> S3Service validates mime-type, file size, permissions
         ---> Uploads object to S3 / MinIO (bucket: 'ironclad-documents')
         ---> Stores Document Record in PostgreSQL with S3 Key & metadata
         ---> Returns DocumentResponse with download URL

Document Download Flow:
Client ---> GET /api/v1/files/{file_id}/download
         ---> Permission Check (e.g., 'read' or 'admin')
         ---> S3Service generates secure presigned URL or streams object
         ---> Client accesses document securely
```

---

## 7. Role-Based Access Control (RBAC) Specification

Authentication uses JWT Bearer tokens signed with HMAC-SHA256. Permissions are evaluated on every sensitive operation:

| Role | Default Permissions | Dashboard Tabs | Contract Create | Contract Edit | File Upload | File Download | Admin RBAC Tab |
|------|--------------------|----------------|-----------------|---------------|-------------|---------------|----------------|
| **Admin** | `read, write, edit, delete, admin` | Grid, Table, Docs, BI, Admin | Yes | Yes | Yes | Yes | Yes |
| **Manager** | `read, write, edit` | Grid, Table, Docs, BI | Yes | Yes | Yes | Yes | No |
| **Editor** | `read, write, edit` | Grid, Table, Docs, BI | Yes | Yes | Yes | Yes (Non-confidential) | No |
| **Viewer** | `read` | Grid, Table, Docs, BI | No | No | No | Read-only previews | No |

---

## 8. Ironclad Data Lake & Data Warehouse Integration Architecture

Reference: [Ironclad Data Lake / Data Warehouse Integration Guide](https://developer.ironcladapp.com/docs/data-lakedata-warehouse-integration)

```
+----------------------------------------------------------------------------------------------------+
|                                    Ironclad Cloud Platform                                         |
|                                                                                                    |
|  +-----------------------------+                     +------------------------------------------+  |
|  |     Workflows API           |                     |               Records API                |  |
|  |  /public/api/v1/workflows   |                     |  /public/api/v1/records?lastUpdated=...  |  |
|  +--------------+--------------+                     +--------------------+---------------------+  |
+-----------------|---------------------------------------------------------|------------------------+
                  |                                                         |
                  | Incremental Extract (ETL Pipeline)                      |
                  +----------------------------+----------------------------+
                                               |
                                               v
+----------------------------------------------------------------------------------------------------+
|                         Ironclad Contract Hub Normalization Pipeline                               |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Normalization & Transformation Engine (backend/app/services/ironclad_service.py)             |  |
|  |                                                                                              |  |
|  |  Record Property Path                  Normalized Contract Schema       Data Warehouse Type  |  |
|  |  -----------------------------------   --------------------------       -------------------  |  |
|  |  properties.agreementDate.value   -->  agreement_date                   TIMESTAMP (UTC)      |  |
|  |  properties.startDate.value       -->  start_date                       TIMESTAMP (UTC)      |  |
|  |  properties.expirationDate.value  -->  completion_date                  TIMESTAMP (UTC)      |  |
|  |  lastUpdated                      -->  last_synced_date                 TIMESTAMP (UTC)      |  |
|  |  properties.signedDate.value      -->  signed_date                      TIMESTAMP (UTC)      |  |
|  |  properties.renewalNotice.value   -->  renewal_notice_date              TIMESTAMP (UTC)      |  |
|  |  links / relatedRecords           -->  related_records (JSONB)          JSONB ARRAY          |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------+-----------------------------------------------------+
                                               |
                                               v
+----------------------------------------------------------------------------------------------------+
|                                PostgreSQL 16 Data Lake Layer                                       |
|                                                                                                    |
|  Table: contracts                                                                                  |
|  - id: BIGSERIAL PRIMARY KEY                                                                       |
|  - ironclad_id: VARCHAR(100) UNIQUE INDEX                                                          |
|  - title: VARCHAR(255) NOT NULL                                                                    |
|  - status: VARCHAR(50) [draft | in_review | out_for_signature | signed | archived]                |
|  - agreement_date: TIMESTAMP WITH TIME ZONE                                                        |
|  - start_date: TIMESTAMP WITH TIME ZONE                                                            |
|  - completion_date: TIMESTAMP WITH TIME ZONE                                                       |
|  - signed_date: TIMESTAMP WITH TIME ZONE                                                           |
|  - last_synced_date: TIMESTAMP WITH TIME ZONE                                                      |
|  - renewal_notice_date: TIMESTAMP WITH TIME ZONE                                                    |
|  - related_records: JSONB DEFAULT '[]'                                                             |
+----------------------------------------------+-----------------------------------------------------+
                                               |
                                               v
+----------------------------------------------------------------------------------------------------+
|                         Computed Lifecycle & Tracking Analytics (Pydantic / UI)                    |
|                                                                                                    |
|  - current_date:      Dynamic evaluation timestamp (utcnow())                                      |
|  - days_remaining:    (completion_date - current_date).days                                        |
|  - progress_percent:   min(100, max(0, ((current_date - start_date) / total_term) * 100))          |
|  - tracking_status:   'active' | 'expiring_soon' (<30d) | 'completed' | 'expired'                  |
+----------------------------------------------------------------------------------------------------+
```

### 8.1 Key Schema Properties & Normalization Rules

1. **Agreement Date (`agreement_date`)**:
   - Represents the formal execution or agreement timestamp from Ironclad's `properties.agreementDate.value`.
   - Used for compliance auditing and initial baseline metrics.
2. **Start Date (`start_date`)**:
   - The effective inception date when obligations, software access, or service terms commence.
   - Defaults to `agreement_date` or record creation time if not explicitly defined in the template.
3. **Reference Current Date (`current_date`)**:
   - Evaluated dynamically on the server (`datetime.utcnow()`) to prevent clock skew between client machines.
   - Provides an authoritative benchmark for computing remaining term, expiration deadlines, and milestone alerts.
4. **Target Completion Date (`completion_date`)**:
   - The scheduled or actual contract completion date (`properties.expirationDate` or `completionDate`).
   - Powers early renewal notifications (typically 30, 60, or 90 days prior).
5. **Incremental Sync via `lastUpdated` Filter**:
   - Implements Ironclad's recommended Data Warehouse sync pattern:
     ```
     GET /public/api/v1/records?lastUpdated=2026-10-13T00:00:00Z
     ```
   - Eliminates redundant payload transfer, reduces API rate limit consumption, and enables continuous micro-batch ETL pipelines.

