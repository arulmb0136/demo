from typing import Dict, List
from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class RoleDefinition(Base):
    __tablename__ = "role_definitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_key = Column(String(50), unique=True, index=True, nullable=False) # admin, manager, editor, viewer
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    default_permissions = Column(JSON, default=list, nullable=False)

DEFAULT_ROLES_SEED: List[Dict] = [
    {
        "role_key": "admin",
        "display_name": "Administrator",
        "description": "Full platform administration, user management, and system sync control",
        "default_permissions": ["read", "write", "edit", "delete", "admin"]
    },
    {
        "role_key": "manager",
        "display_name": "Legal Operations Manager",
        "description": "Oversees contract lifecycle, approvals, BI dashboards, and exports",
        "default_permissions": ["read", "write", "edit"]
    },
    {
        "role_key": "editor",
        "display_name": "Contract Specialist / Editor",
        "description": "Drafts, uploads documents, and edits active contract records",
        "default_permissions": ["read", "write", "edit"]
    },
    {
        "role_key": "viewer",
        "display_name": "Auditor / Read-Only Viewer",
        "description": "Read-only access to contracts, previews, and BI reporting metrics",
        "default_permissions": ["read"]
    }
]
