from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.role_permission import RoleDefinition, DEFAULT_ROLES_SEED
from app.schemas.role import RoleDefinitionResponse, RoleMatrixResponse

router = APIRouter(prefix="/roles", tags=["Role-Based Access Control"])

AVAILABLE_PERMISSIONS = [
    {"key": "read", "label": "Read", "description": "View contracts, documents, and analytics dashboards"},
    {"key": "write", "label": "Write", "description": "Draft new contracts and upload file attachments"},
    {"key": "edit", "label": "Edit", "description": "Modify existing contract fields, metadata, and status"},
    {"key": "delete", "label": "Delete", "description": "Archive or permanently remove contract records"},
    {"key": "admin", "label": "Admin", "description": "Superuser control over RBAC, user permissions, and sync"},
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
        available_permissions=AVAILABLE_PERMISSIONS
    )
