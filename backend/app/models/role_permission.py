from typing import Dict, List
from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class RoleDefinition(Base):
    __tablename__ = "role_definitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_key = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    default_permissions = Column(JSON, default=list, nullable=False)

DEFAULT_ROLES_SEED: List[Dict] = [
    {
        "role_key": "admin",
        "display_name": "Administrator",
        "description": "Full platform administration, user management, and role authorization control",
        "default_permissions": [
            "contracts:view", "contracts:view:property_service", "contracts:view:purchase_sale", "contracts:view:general_services",
            "contracts:download", "users:manage", "roles:manage", "read", "download", "admin"
        ]
    },
    {
        "role_key": "manager",
        "display_name": "Operations Manager",
        "description": "Full access to view all agreement records and download document attachments",
        "default_permissions": [
            "contracts:view", "contracts:view:property_service", "contracts:view:purchase_sale", "contracts:view:general_services",
            "contracts:download", "read", "download"
        ]
    },
    {
        "role_key": "editor",
        "display_name": "Legal Counsel / Specialist",
        "description": "Authorized to view agreements and download documents",
        "default_permissions": [
            "contracts:view", "contracts:view:property_service", "contracts:view:purchase_sale", "contracts:view:general_services",
            "contracts:download", "read", "download"
        ]
    },
    {
        "role_key": "viewer",
        "display_name": "Auditor / Read-Only Viewer",
        "description": "Read-only access to view contract records and details. Document downloads restricted.",
        "default_permissions": [
            "contracts:view", "contracts:view:property_service", "contracts:view:purchase_sale", "contracts:view:general_services",
            "read"
        ]
    }
]
