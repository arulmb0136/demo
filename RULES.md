# Engineering Rules, Coding Standards & Review Guidelines

This document defines the strict engineering standards, architectural rules, and code review criteria for all code committed to this repository.

---

## 1. Architectural Integrity & Layering Rules

### Backend Layering (FastAPI)
The backend enforces a strict unidirectional dependency graph:
`API Routers -> Services -> Repositories -> Models / Database`

1. **Routers (`app/api/v1/*.py`)**:
   - MUST only handle HTTP routing, request parsing, response serialization, and route-level security dependencies.
   - MUST NEVER write direct SQLAlchemy queries or touch the database engine directly.
   - MUST delegate all business operations to the appropriate Service class.
   - MUST use standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`).

2. **Services (`app/services/*.py`)**:
   - MUST contain all business logic, workflow rules, calculations, and external API coordination.
   - MUST NEVER accept or return FastAPI `Request` or `Response` objects (services remain framework-agnostic).
   - MUST interact with databases exclusively through Repository classes.
   - MUST handle external API exceptions (e.g. Ironclad, AWS S3) gracefully and provide structured domain exceptions.

3. **Repositories (`app/repositories/*.py`)**:
   - Encapsulate all database queries, filtering, sorting, joins, and transactions.
   - MUST NEVER raise HTTP exceptions (e.g., `HTTPException`). If an entity is not found, return `None` or raise a domain-specific `EntityNotFoundError`.

4. **Models (`app/models/*.py`)**:
   - Pure SQLAlchemy Declarative models defining table schemas, columns, constraints, foreign keys, and relationships.
   - MUST inherit from `Base` and include timestamp tracking (`created_at`, `updated_at`).

---

## 2. Centralized Logging & Correlation Tracking

1. **Correlation ID (`X-Correlation-ID`)**:
   - Every incoming HTTP request must have a Correlation ID.
   - If provided in the request headers (`X-Correlation-ID`), use it; otherwise, generate a new UUIDv4.
   - The correlation ID must be bound to the request's asynchronous execution context (`contextvars`).
   - Every log message emitted across routers, services, and repositories must include the correlation ID.
   - The correlation ID must be returned in the `X-Correlation-ID` response header.

2. **Logging Conventions**:
   - NEVER use raw `print()` statements in application code.
   - Use `app.core.logging.logger` with appropriate log levels:
     - `DEBUG`: Detailed diagnostic messages (payload sizes, SQL query hints).
     - `INFO`: Normal lifecycle events (user logged in, contract synced, document uploaded).
     - `WARNING`: Recoverable anomalies (Ironclad API rate limit reached, falling back to local cache).
     - `ERROR`: Unhandled exceptions, failed DB writes, unauthorized access attempts.

---

## 3. Security & RBAC Guidelines

1. **Zero-Trust Token Validation**:
   - All protected routes must require a valid JWT Bearer token via FastAPI `Depends(get_current_user)`.
   - Never trust role or permission claims supplied directly in the request body. Role claims must be extracted from the verified JWT payload and validated against the database.

2. **Permission Checks**:
   - Use reusable FastAPI dependencies: `Depends(require_permission("write"))`, `Depends(require_role("admin"))`.
   - If a user lacks the required permission, return `403 Forbidden` with a descriptive error message.

3. **Password & Secret Handling**:
   - Passwords must be hashed using `bcrypt` (or `passlib[bcrypt]`) with a minimum cost factor of 12.
   - Plaintext passwords must NEVER be logged or returned in API responses.
   - All credentials, secrets, and API keys must be loaded exclusively via environment variables (`pydantic-settings`).

---

## 4. Frontend Standards (React + TypeScript + Vite)

1. **TypeScript Strictness**:
   - Maintain strict typing for all props, states, API payloads, and hook returns.
   - Avoid `any`. Define explicit interfaces in `frontend/src/types/`.

2. **Design System & Theming**:
   - ALL colors and visual styling must use CSS Custom Properties (`--bg-primary`, `--text-primary`, `--accent-primary`, etc.) defined in `frontend/src/styles/index.css`.
   - Never hardcode fixed hex colors (e.g. `#1e293b` or `#000000`) inside component styles.
   - All 8 themes (`dark`, `light`, `deep-blue`, `pastel-pink`, `charcoal-grey`, `bright-yellow`, `linkedin`, `windows`) must be fully styled and verified.

3. **Responsiveness**:
   - Every layout must be 100% responsive across mobile (< 640px), tablet (640px - 1024px), and desktop (> 1024px).
   - Use flexible CSS Grid, Flexbox, and media queries. Avoid fixed pixel widths for primary containers.

4. **API Communication**:
   - All HTTP communication must pass through `frontend/src/api/client.ts`.
   - Automatic injection of `Authorization: Bearer <token>` and `X-Correlation-ID`.
   - Handle 401 Unauthorized responses by clearing auth state and redirecting to `/signin`.

---

## 5. Definition of Done & Review Checklist

Before marking any task as complete:
- [x] Code strictly adheres to the layered architecture.
- [x] Logging calls include correlation IDs.
- [x] Type hints and Pydantic schemas cover all input/output payloads.
- [x] Role-based permissions are enforced.
- [x] Frontend views work seamlessly across all 8 selectable themes.
- [x] No sensitive tokens or secrets are hardcoded.
- [x] Dockerfile and Docker Compose definitions are valid and up to date.
