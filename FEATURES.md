# Feature Specifications & Requirements (v2.0)

This document details the functional specifications for the updated Ironclad Contract Hub platform: Zero-Storage Live Ironclad Integration, Automated Token Generation & Refresh, Strict 3-Record-Type Filter, Role & Access Management (User/Role Add & Edit), View/Download RBAC policies, and Post-Login Notifications.

---

## 1. Zero-Storage Live Ironclad API Integration

### 1.1 Direct Live API Queries (No Database Storage)
- Contracts and agreements are **never** persisted to PostgreSQL.
- Only PostgreSQL is used for User Management, Role Definitions, and Permission Policies.
- Backend retrieves records directly from Ironclad using official API endpoints:
  - `GET /public/api/v1/records/ids` (Retrieves list of all record IDs)
  - `GET /public/api/v1/records/{id}` (Retrieves record detail and attachment metadata)
  - `GET /public/api/v1/records/{id}/attachments/{key}` (Streams/downloads the binary file attachment)

### 1.2 Automated OAuth2 Token Generation & Refresh
- Configuration requires only `IRONCLAD_CLIENT_ID` and `IRONCLAD_CLIENT_SECRET`.
- When an API call is made:
  - The client checks for an active in-memory token.
  - If token does not exist or has expired (or within 60s of expiration), it calls `POST /oauth/token` with `grant_type=client_credentials` or `grant_type=refresh_token`.
  - Automatically caches the token and transparently retries requests on token renewal.

### 1.3 Strict Record Type Whitelist
Only contracts matching these three exact record types are retrieved and displayed in the UI:
1. `Property Service Contract`
2. `Purchase & Sales Agreement`
3. `General Services Agreement`
All other record types fetched from the records API are discarded.

---

## 2. PostgreSQL Role & Access Management (RBAC)

### 2.1 User Administration
- **Add User**: Admin can create a new user with email, name, password, and assign a role.
- **Edit User**: Admin can edit user information, change role, and toggle active status or specific permissions.
- **List Users**: View all registered users with their current role and permission set.

### 2.2 Role & Policy Administration
- **Add Role**: Admin can define a new custom role with custom display name, description, and permission grants.
- **Edit Role**: Admin can update existing role permissions and policies.
- **Permissions**:
  - `contracts:view`: View the contracts list and open agreement details.
  - `contracts:download`: Download contract document attachments.
  - `users:manage`: Add and edit platform users.
  - `roles:manage`: Add and edit platform roles and permission policies.

### 2.3 Removal of Obsolete Actions & Code
- Removed contract creation, editing, and deletion endpoints (`POST /contracts`, `PUT /contracts/{id}`, `DELETE /contracts/{id}`).
- Removed S3 direct file upload handlers and contract editing modals.
- Removed local database storage of contracts and document attachments.

---

## 3. UI/UX & Contract Interaction Flow

### 3.1 Contract List & Grid View
- On login, the dashboard fetches the list of allowed records from `/api/v1/contracts`.
- Displays an interactive, responsive grid showing:
  - Record ID (e.g., `rec_ic_...`)
  - Title & Agreement Type badge (`Property Service Contract`, `Purchase & Sales Agreement`, `General Services Agreement`)
  - Counterparty name, status badge, and effective dates.
  - Value chip (formatted currency).

### 3.2 Detailed Agreement View
- Clicking any card opens a modal / detailed drawer:
  - Complete contract properties (Agreement date, start/expiration dates, creator, department, custom attributes).
  - Associated document attachments list.
  - **Document View**: If user has `contracts:view` permission, preview/view document in browser.
  - **Document Download**: If user has `contracts:download` permission, direct download button streams attachment from Ironclad API.
  - If user lacks download permission, the download button is disabled with an explanatory tooltip ("Download permission required").

---

## 4. Post-Login Real-Time Notifications

- After user logs in, the application tracks the latest known contract IDs.
- A notification listener periodically checks `/api/v1/contracts/notifications/check?since={timestamp}`.
- When new agreements arrive in Ironclad:
  - An interactive notification badge / dropdown shows recent arrivals.
  - A toast notification informs the user: *"New Agreement: [Title] ([Type]) has arrived."*
  - Clicking the notification immediately focuses the new agreement.

---

## 5. Dynamic 8-Theme System Retention
The complete 8-theme design system is preserved:
- Dark Modern, Clean Light, Deep Blue, Pastel Pink, Charcoal Grey, Bright Yellow, LinkedIn Theme, Windows Theme.
- Dynamic theme switcher in header persists across sessions in `localStorage`.
