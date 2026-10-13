from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.schemas.contract import (
    ContractResponse,
    ContractCreate,
    ContractUpdate,
    ContractSyncResponse,
    BiMetricsResponse,
    IroncladRecordCreate
)
from app.services.contract_service import ContractService

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.get("/", response_model=List[ContractResponse])
async def list_contracts(
    status: Optional[str] = Query(None, description="Filter by workflow status"),
    search: Optional[str] = Query(None, description="Search by title, counterparty, or template"),
    department: Optional[str] = Query(None, description="Filter by department"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_permission("read")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    return await service.list_contracts(
        status=status,
        search=search,
        department=department,
        skip=skip,
        limit=limit
    )

@router.get("/bi-metrics", response_model=BiMetricsResponse)
def get_bi_analytics(
    current_user: User = Depends(require_permission("read")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    return service.get_bi_metrics()

@router.post("/sync-ironclad", response_model=ContractSyncResponse)
async def sync_ironclad_workflows(
    current_user: User = Depends(require_permission("write")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    return await service.sync_with_ironclad()

@router.post("/ironclad-record", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_ironclad_record_endpoint(
    record_in: IroncladRecordCreate,
    current_user: User = Depends(require_permission("write")),
    db: Session = Depends(get_db)
):
    """
    Creates an Ironclad Record directly following developer.ironcladapp.com/docs/create-a-record-1
    Accepts: { type, name, properties: { ... }, links: [ ... ] }
    """
    service = ContractService(db)
    return await service.create_ironclad_record(record_in, current_user.email)

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract_detail(
    contract_id: int,
    current_user: User = Depends(require_permission("read")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    return service.get_contract(contract_id)

@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract_in: ContractCreate,
    current_user: User = Depends(require_permission("write")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    if not contract_in.creator_email:
        contract_in.creator_email = current_user.email
    return service.create_contract(contract_in)

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    current_user: User = Depends(require_permission("edit")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    return service.update_contract(contract_id, contract_in)

@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: int,
    current_user: User = Depends(require_permission("delete")),
    db: Session = Depends(get_db)
):
    service = ContractService(db)
    service.delete_contract(contract_id)
    return None
