from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, computed_field
from app.schemas.file import DocumentResponse

class ContractBase(BaseModel):
    title: str
    template_name: str
    record_type: str = "contract" # "contract", "record", "workflow", "statement-of-work"
    status: str = "draft" # draft, in_review, out_for_signature, signed, archived
    counterparty_name: str
    contract_value: float = 0.0
    currency: str = "USD"

    # Tracking & Lifecycle Dates
    agreement_date: Optional[datetime] = None # Date formalized (properties.agreementDate)
    start_date: Optional[datetime] = None # When contract starts
    completion_date: Optional[datetime] = None # When contract will be completed/expires
    signed_date: Optional[datetime] = None # When executed
    last_synced_date: Optional[datetime] = None # Ironclad lastUpdated sync timestamp
    renewal_notice_date: Optional[datetime] = None # Cutoff for renewal decision

    effective_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    creator_email: Optional[str] = None
    department: str = "General"
    attributes: Dict[str, Any] = {}
    related_records: List[Dict[str, Any]] = []

class ContractCreate(ContractBase):
    ironclad_id: Optional[str] = None

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    template_name: Optional[str] = None
    record_type: Optional[str] = None
    status: Optional[str] = None
    counterparty_name: Optional[str] = None
    contract_value: Optional[float] = None
    currency: Optional[str] = None
    agreement_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    signed_date: Optional[datetime] = None
    renewal_notice_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    department: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    related_records: Optional[List[Dict[str, Any]]] = None

class ContractResponse(ContractBase):
    id: int
    ironclad_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentResponse] = []

    @computed_field
    def current_date(self) -> datetime:
        return datetime.utcnow()

    @computed_field
    def days_remaining(self) -> Optional[int]:
        target = self.completion_date or self.expiration_date
        if not target:
            return None
        now = datetime.utcnow()
        # Handle naive datetime comparison
        delta = (target.replace(tzinfo=None) - now).days
        return delta

    @computed_field
    def progress_percent(self) -> float:
        start = self.start_date or self.agreement_date or self.effective_date or self.created_at
        end = self.completion_date or self.expiration_date
        if not start or not end:
            return 50.0
        now = datetime.utcnow()
        start_naive = start.replace(tzinfo=None)
        end_naive = end.replace(tzinfo=None)
        if end_naive <= start_naive:
            return 100.0
        if now <= start_naive:
            return 0.0
        if now >= end_naive:
            return 100.0
        total_span = (end_naive - start_naive).total_seconds()
        elapsed = (now - start_naive).total_seconds()
        return round(min(100.0, max(0.0, (elapsed / total_span) * 100.0)), 1)

    @computed_field
    def tracking_status(self) -> str:
        if self.status == "signed" or self.status == "completed":
            target = self.completion_date or self.expiration_date
            if target and target.replace(tzinfo=None) < datetime.utcnow():
                return "completed"
            rem = self.days_remaining
            if rem is not None and rem < 30 and rem >= 0:
                return "expiring_soon"
            return "active"
        if self.status in ["in_review", "out_for_signature"]:
            return "in_progress"
        return "draft"

    class Config:
        from_attributes = True

# Schemas matching developer.ironcladapp.com/docs/create-a-record-1 & data-lake
class IroncladRecordLink(BaseModel):
    recordId: str

class IroncladRecordProperty(BaseModel):
    type: str # string, number, monetary_amount, duration, date, email, address
    value: Any

class IroncladRecordCreate(BaseModel):
    type: str # e.g. "contract", "nda", "statement-of-work"
    name: str # e.g. "SOW with Acme LLC"
    properties: Dict[str, Union[IroncladRecordProperty, Dict[str, Any], Any]] = Field(default_factory=dict)
    links: Optional[List[IroncladRecordLink]] = Field(default_factory=list)

class ContractSyncResponse(BaseModel):
    synced_count: int
    created_count: int
    updated_count: int
    source: str
    timestamp: datetime
    message: str

class BiMetricsResponse(BaseModel):
    total_portfolio_value: float
    total_contracts_count: int
    active_contracts_count: int
    pending_review_count: int
    signed_contracts_count: int
    avg_turnaround_days: float
    status_distribution: Dict[str, int]
    counterparty_exposure: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]
    department_distribution: Dict[str, int]
