from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RoleCreate(BaseModel):
    role_key: str
    display_name: str
    description: str
    default_permissions: List[str] = ["contracts:view"]

class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    default_permissions: Optional[List[str]] = None

class RoleDefinitionResponse(BaseModel):
    id: int
    role_key: str
    display_name: str
    description: str
    default_permissions: List[str]

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str
    permissions: List[str]

class RoleMatrixResponse(BaseModel):
    roles: List[RoleDefinitionResponse]
    available_permissions: List[Dict[str, str]]
    allowed_categories: List[str]
