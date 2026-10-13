from typing import List, Dict, Any
from pydantic import BaseModel

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
