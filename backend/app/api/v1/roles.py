from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.models.role_permission import RoleDefinition, DEFAULT_ROLES_SEED
from app.schemas.role import RoleDefinitionResponse, RoleMatrixResponse, RoleCreate, RoleUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/roles", tags=["Role-Based Access Control"])

AVAILABLE_PERMISSIONS = [
    {"key": "contracts:view", "label": "View Contracts (General)", "description": "Base access to view contracts dashboard and general summary"},
    {"key": "contracts:view:property_service", "label": "View Property Service Contracts", "description": "Permission to view Property Service Contract (BH) records"},
    {"key": "contracts:view:purchase_sale", "label": "View Purchase & Sale Agreements", "description": "Permission to view Purchase & Sale Agreement (BH) records"},
    {"key": "contracts:view:general_services", "label": "View General Services Agreements", "description": "Permission to view General Services Agreement (BH) records"},
    {"key": "contracts:download", "label": "Download Documents", "description": "Permission to download binary document attachments from Ironclad"},
    {"key": "users:manage", "label": "Manage Users", "description": "Permission to add new users and modify existing user profiles"},
    {"key": "roles:manage", "label": "Manage Roles", "description": "Permission to add new roles and update role permission policies"}
]

ALLOWED_CATEGORIES = [
    "Property Service Contract",
    "Purchase & Sales Agreement",
    "General Services Agreement"
]

@router.get("/", response_model=RoleMatrixResponse)
def get_role_matrix(db: Session = Depends(get_db)):
    db_roles = db.query(RoleDefinition).all()
    if not db_roles:
        # Fallback to in-memory definitions if not seeded yet
        roles = [
            RoleDefinitionResponse(
                id=idx + 1,
                role_key=r["role_key"],
                display_name=r["display_name"],
                description=r["description"],
                default_permissions=r["default_permissions"]
            )
            for idx, r in enumerate(DEFAULT_ROLES_SEED)
        ]
    else:
        roles = [RoleDefinitionResponse.from_orm(r) for r in db_roles]

    return RoleMatrixResponse(
        roles=roles,
        available_permissions=AVAILABLE_PERMISSIONS,
        allowed_categories=ALLOWED_CATEGORIES
    )

@router.post("/", response_model=RoleDefinitionResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    role_in: RoleCreate,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.create_role(role_in)

@router.put("/{role_id}", response_model=RoleDefinitionResponse)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_role(role_id, role_in)
