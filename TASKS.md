# Project Execution Plan & Task Checklist (v2.0)

This checklist tracks the sequential tasks for refactoring the platform into the zero-storage live Ironclad architecture.

---

## Phase 1: Architecture, Requirements & Task Planning
- [x] **Task 1.1**: Update `ARCHITECTURE.md` to v2.0 reflecting live Ironclad API, zero contract DB persistence, automated OAuth2 token lifecycle, 3 allowed record types, view/download RBAC, and notifications.
- [x] **Task 1.2**: Update `FEATURES.md` with detailed feature specifications.
- [x] **Task 1.3**: Update `TASKS.md` with step-by-step implementation milestones.

---

## Phase 2: Backend Configuration & Ironclad Service Modernization
- [x] **Task 2.1**: Update `backend/app/core/config.py` and `.env.example` to ensure `IRONCLAD_CLIENT_ID`, `IRONCLAD_CLIENT_SECRET`, and token endpoints are configured cleanly without database contract toggles.
- [x] **Task 2.2**: Modernize `backend/app/services/ironclad_service.py`:
  - Implement automated OAuth2 client credentials token generation & token refresh caching.
  - Implement `records/ids` API client (`GET /public/api/v1/records/ids`).
  - Implement `records/{id}` API client (`GET /public/api/v1/records/{id}`).
  - Implement `records/{id}/attachments/{key}` streaming attachment downloader.
  - Enforce strict filtering for the 3 allowed record types: `Property Service Contract`, `Purchase & Sales Agreement`, `General Services Agreement`.
  - Provide rich mock/sandbox fallback matching the exact schema for seamless testing.
  - Implement contract notification polling endpoint helper.

---

## Phase 3: Database & RBAC Clean-up (PostgreSQL Exclusively for Users & Roles)
- [x] **Task 3.1**: Clean up SQLAlchemy models: Remove contract/document DB tables from `models/` so PostgreSQL manages only `users` and `role_definitions`.
- [x] **Task 3.2**: Update RBAC permissions to support:
  - `contracts:view`: View contract list and details
  - `contracts:download`: Download document attachments
  - `users:manage`: Add and edit users
  - `roles:manage`: Add and edit roles
- [x] **Task 3.3**: Implement User Add & Edit endpoints in `backend/app/api/v1/users.py` (`POST /users`, `PUT /users/{id}`).
- [x] **Task 3.4**: Implement Role Add & Edit endpoints in `backend/app/api/v1/roles.py` (`POST /roles`, `PUT /roles/{id}`).
- [x] **Task 3.5**: Update `backend/scripts/init_db.py` to seed only default roles and demo users into PostgreSQL.

---

## Phase 4: Backend Contract Router & Attachment Proxy
- [x] **Task 4.1**: Refactor `backend/app/api/v1/contracts.py`:
  - Remove all create, update, delete, and S3 upload endpoints.
  - Implement `GET /contracts`: Calls Ironclad `records/ids`, fetches details, filters by the 3 allowed types, guarded by `contracts:view`.
  - Implement `GET /contracts/ids`: Fetches raw list of record IDs, guarded by `contracts:view`.
  - Implement `GET /contracts/{id}`: Fetches individual record detail from Ironclad, guarded by `contracts:view`.
  - Implement `GET /contracts/{id}/attachments/{key}`: Streams document attachment from Ironclad API, guarded by `contracts:download` (or `contracts:view` for inline preview).
  - Implement `GET /contracts/notifications/check`: Returns newly added contracts since a given timestamp for live notifications.
- [x] **Task 4.2**: Clean up obsolete files (`files.py`, `s3_service.py`, `contract_service.py`, `contract_repo.py`, `models/contract.py`, `models/document.py`).

---

## Phase 5: Frontend Updates & UI/UX Transformation
- [x] **Task 5.1**: Update TypeScript interfaces in `frontend/src/types/index.ts` reflecting Ironclad live record schemas and updated user/role models.
- [x] **Task 5.2**: Build live `NotificationCenter.tsx` component in `frontend/src/components/` and integrate into `Navbar.tsx` for post-login alerts on new agreements.
- [x] **Task 5.3**: Build `ContractDetailModal.tsx` for viewing agreement details and document attachments with View and Download permission buttons.
- [x] **Task 5.4**: Refactor `frontend/src/pages/Dashboard.tsx`:
  - List allowed record IDs and cards in responsive grid.
  - Clicking a grid card opens the clean detail view.
  - Remove contract creation/edit modal, delete actions, and S3 file uploads.
- [x] **Task 5.5**: Refactor `frontend/src/pages/AdminRoles.tsx`:
  - Add User modal and Edit User modal.
  - Add Role modal and Edit Role modal (with view/download policy switches).
  - Whitelisted categories view with authorization explanation.
- [x] **Task 5.6**: Remove obsolete frontend components (`ContractModal.tsx`, `DocumentViewer.tsx`).

---

## Phase 6: End-to-End Testing & Verification
- [x] **Task 6.1**: Run `init_db.py` to ensure PostgreSQL tables and default users/roles initialize cleanly.
- [x] **Task 6.2**: Test backend API endpoints using Python test script (Token generation, records list, record detail, attachment streaming, RBAC).
- [x] **Task 6.3**: Build frontend (`npm run build`) and verify TypeScript compilation and UI behavior (0 errors).
- [x] **Task 6.4**: Verify post-login notification flow and 8-theme switcher.
