# Feature Specifications & Deep Dive

This document details the functional specifications for the core platform capabilities: Role-Based Access Control (RBAC), the 8-Theme System, Ironclad Integration & Data Schemas, the Lite BI Visualization Engine, and Document Management.

---

## 1. Role-Based Access Control (RBAC)

### 1.1 Model & Permission Architecture
Access control is implemented as a multi-tier permission system anchored by the `User.role` attribute and supplemented with an explicit granular `permissions` list (`string[]` / JSON column in DB).

#### Standard Roles:
1. **Admin (`admin`)**: Superuser with administrative privileges over users, roles, system configuration, and audit logs.
2. **Manager (`manager`)**: Operational lead who can create, approve, update contracts, and generate analytics reports.
3. **Editor (`editor`)**: Legal counsel and contract managers who draft, revise, and update contracts and documents.
4. **Viewer (`viewer`)**: Read-only stakeholder who can inspect contract statuses, view analytics, and read non-confidential documents.

#### Permission Keys:
- `read`: View contracts, documents list, and BI analytics dashboards.
- `write`: Draft new contracts, upload documents, and submit workflows.
- `edit`: Modify existing contract attributes, change workflow status, and update metadata.
- `delete`: Archive or delete contracts and purge documents.
- `admin`: Access the User & Role Management interface, alter permissions, and trigger manual Ironclad synchronization.

### 1.2 Module & Component-Level Enforcement
Permissions are enforced at two levels:
1. **Backend FastAPI Route Guards**:
   ```python
   # Example: apps/api/v1/contracts.py
   @router.post("/", response_model=ContractResponse)
   def create_contract(
       contract_in: ContractCreate,
       current_user: User = Depends(require_permission("write")),
       db: Session = Depends(get_db)
   ):
       ...
   ```
2. **Frontend UI Guards (`AuthContext` & `ProtectedRoute`)**:
   - Navigation elements (e.g., "Manage Roles" navigation tab) are hidden from non-admin users.
   - Action buttons ("+ New Contract", "Edit Status", "Upload Document") are disabled or conditionally hidden using the `hasPermission("write")` / `hasPermission("edit")` hooks.
   - Read-only users see watermarked preview flags on sensitive document links.

### 1.3 Admin Role Management Interface
Administrators can access the `/admin/roles` module to:
- View all registered users and their current roles.
- Promote or demote user roles via a reactive dropdown.
- Toggle specific permission grants per user (`read`, `write`, `edit`, `delete`, `admin`).
- Persist permission updates immediately to the PostgreSQL backend.

---

## 2. Dynamic 8-Theme Design System

The application features an instant, runtime theme switcher powered by CSS Custom Properties (Variables) defined in `frontend/src/styles/index.css`. All components utilize semantic design tokens (`--bg-primary`, `--text-primary`, `--accent-primary`, etc.) ensuring 100% theme fidelity across all pages.

### 2.1 Theme Specifications

| # | Theme Key | Name | Visual Identity & Color Palette | Optimal Use Case |
|---|-----------|------|----------------------------------|------------------|
| 1 | `dark` | **Dark Modern** | Charcoal slate (`#0f172a`), deep surfaces (`#1e293b`), vibrant electric cyan accents (`#06b6d4`). | Default low-light, high focus engineering view. |
| 2 | `light` | **Clean Light** | Crisp arctic white (`#ffffff`), soft neutral canvas (`#f8fafc`), royal blue accents (`#2563eb`). | Standard daylight enterprise workstation view. |
| 3 | `deep-blue` | **Deep Blue** | Midnight navy (`#0a192f`), sapphire panels (`#112240`), neon cyan/aquamarine highlights (`#64ffda`). | Executive, modern fintech ambiance. |
| 4 | `pastel-pink` | **Pastel Pink** | Soft blush petal canvas (`#fff5f7`), warm rose panels (`#ffe4e9`), coral/magenta accents (`#f43f5e`). | Warm, high-aesthetic creative workflow. |
| 5 | `charcoal-grey` | **Charcoal Grey** | Minimalist carbon black (`#121212`), graphite panels (`#1e1e1e`), cool silver/platinum accents (`#94a3b8`). | Ultra-clean distraction-free monochrome setup. |
| 6 | `bright-yellow` | **Bright Yellow** | High-contrast industrial dark slate (`#1c1917`), vibrant cyber amber & safety gold (`#f59e0b`, `#fbbf24`). | High-visibility warning & review environments. |
| 7 | `linkedin` | **LinkedIn Theme** | Professional corporate white/grey (`#f3f2ef`), card containers (`#ffffff`), authentic LinkedIn navy (`#0a66c2`). | Executive corporate presentation view. |
| 8 | `windows` | **Windows Theme** | Windows 11 Fluent mica background (`#f3f3f3`), acrylic white blur panels, Aero desktop blue (`#0078d4`). | Native desktop enterprise feel. |

### 2.2 Theme Persistence & Runtime Switching
- Selected theme is persisted in `localStorage` under `ironclad_app_theme`.
- The `ThemeContext` applies the theme as a `data-theme="<theme_key>"` attribute on the `<html>` root element.
- Header includes a dynamic quick-switch dropdown displaying color swatches for each of the 8 palettes.

---

## 3. Ironclad API Integration & Schema Mapping

The backend integrates with the **Ironclad API** (`developer.ironcladapp.com`), modeling workflows, records, and document link attachments.

### 3.1 Data Schema Mapping
Ironclad schemas map directly to the platform's database and Pydantic representations:

```
+------------------------------------+          +------------------------------------+
|  Ironclad API Workflow / Record    |          |  Application Contract Schema       |
+------------------------------------+          +------------------------------------+
| id: string (UUID / Ironclad ID)    |  =====>  | ironclad_id: string (indexed)      |
| title: string                      |  =====>  | title: string                      |
| template: string                   |  =====>  | template_name: string              |
| status / step: string              |  =====>  | status: draft | review | sign ...  |
| counterpartyName: string           |  =====>  | counterparty_name: string          |
| contractValue: number              |  =====>  | contract_value: float              |
| currency: string                   |  =====>  | currency: string (USD, EUR, etc.)  |
| effectiveDate: ISO8601 string      |  =====>  | effective_date: DateTime           |
| expirationDate: ISO8601 string     |  =====>  | expiration_date: DateTime          |
| creator: { email, name }           |  =====>  | creator_email: string              |
| documentLinks: [{ name, url, key }]|  =====>  | documents: List[DocumentResponse]  |
| attributes: JSON                   |  =====>  | attributes: Dict[str, Any]         |
+------------------------------------+          +------------------------------------+
```

### 3.2 Ironclad Repository Record Creation (`developer.ironcladapp.com/docs/create-a-record-1`)
Ironclad repository records use a specialized schema distinct from workflows:

```json
{
  "type": "Statement of Work",
  "name": "SOW with Acme Cloud Solutions LLC",
  "properties": {
    "counterpartyName": { "type": "string", "value": "Acme Cloud Solutions LLC" },
    "totalContractValue": { "type": "monetary_amount", "value": { "currency": "USD", "amount": 175000.00 } },
    "agreementDate": { "type": "date", "value": "2026-10-15T12:00:00Z" },
    "counterpartySignerEmail": { "type": "email", "value": "signer@acme-cloud.com" },
    "standard_renewalTermLength": { "type": "duration", "value": "P1Y" },
    "counterpartyBillingAddress": {
      "type": "address",
      "value": { "lines": ["4527 Mission Street"], "locality": "San Francisco", "country": "United States", "region": "California", "postcode": "94112" }
    }
  },
  "links": [
    { "recordId": "rec_parent_master_agreement_01" }
  ]
}
```

#### Dual Normalizer Pipeline:
- **`normalize_ironclad_data(raw_item)`**: Parses both **Workflows** (`title`, `template`, `contractValue`, `documentLinks`) and **Records** (`name`, `type`, `properties: { [k]: { type, value } }`, `links: [{ recordId }]`, `attachments`).
- **PostgreSQL Persistence**: Stores `record_type` ("contract", "statement-of-work", "nda"), `related_records` (bi-directional links array), and complete properties in `attributes` (JSON).
- **Direct Record Creation Endpoint**: `POST /api/v1/contracts/ironclad-record` allows creating Ironclad repository records directly following the official documentation schema.

### 3.3 Dual Operational Modes & Live Sync
1. **Direct Ironclad Mode (`DATA_SOURCE=ironclad`)**:
   - Queries `GET /workflows` and `GET /records` directly with Bearer OAuth2 tokens.
   - Ideal for live synchronization with an enterprise Ironclad production tenant.
2. **Local PostgreSQL Mode (`DATA_SOURCE=postgres`)**:
   - Operates against local PostgreSQL tables with sub-millisecond query performance.
3. **One-Click Live Sync (`POST /api/v1/contracts/sync-ironclad`)**:
   - Unified synchronization pulling both active workflows and repository records, running them through the normalizer, and upserting into PostgreSQL.

---

## 4. Lite BI Visualization Engine

The Dashboard features a dedicated **"Lite BI Tool"** tab providing interactive executive intelligence:

1. **Executive KPI Metric Tiles**:
   - Total Portfolio Value (formatted in Millions/Thousands USD).
   - Total Active Contracts count with month-over-month growth.
   - Pending Review / Approval count requiring legal intervention.
   - Average Turnaround Time (draft to signature in days).
2. **Interactive Visualizations**:
   - **Contract Status Distribution:** Visual breakdown of Draft, In Review, Out for Signature, Completed, and Expired contracts.
   - **Top Counterparties by Value:** Horizontal/Vertical bar ranking showing exposure to major enterprise partners.
   - **Monthly Contracting Pipeline Trends:** Trajectory of new contracts initiated and signed over time.
   - **Department / Template Breakdown:** Percentage allocation (e.g., Sales NDA, Vendor MSA, Employment Agreement, SaaS Subscription).
3. **Dynamic Filtering**:
   - Filter charts in real time by Workflow Status, Date Range, and Minimum Contract Value.

---

## 5. Document Management & S3 Integration

- **S3 Service (`backend/app/services/s3_service.py`)**:
  - Connects to AWS S3 or MinIO container via `boto3`.
  - Supports local emulated storage fallback when running without cloud credentials.
  - Endpoints:
    - `POST /api/v1/files/upload`: Upload contract PDF, DOCX, or scanned attachments.
    - `GET /api/v1/files/{file_id}/download`: Fetch presigned download URL or binary stream.
    - `GET /api/v1/files/contract/{contract_id}`: List all documents attached to a specific contract.
