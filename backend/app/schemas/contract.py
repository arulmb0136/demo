from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

class ContractAttachment(BaseModel):
    id: Union[int, str]
    name: str
    key: str
    content_type: str = "application/pdf"
    file_size: int = 0
    url: str

class ContractDetailResponse(BaseModel):
    id: str # Ironclad record ID
    ironclad_id: str
    title: str
    record_type: str # "Property Service Contract", "Purchase & Sales Agreement", "General Services Agreement"
    template_name: str
    status: str
    counterparty_name: str
    contract_value: float = 0.0
    currency: str = "USD"
    agreement_date: Optional[str] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    last_synced_date: Optional[str] = None
    creator_email: Optional[str] = None
    department: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[ContractAttachment] = Field(default_factory=list)

class ContractNotificationItem(BaseModel):
    id: str
    title: str
    record_type: str
    counterparty_name: str
    contract_value: float
    status: str
    arrived_at: str

class BiMetricsResponse(BaseModel):
    total_portfolio_value: float
    total_contracts_count: int
    active_contracts_count: int
    signed_contracts_count: int
    pending_review_count: int = 0
    avg_turnaround_days: float = 4.5
    status_distribution: Dict[str, int]
    counterparty_exposure: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]
    department_distribution: Dict[str, int]
    record_type_distribution: Dict[str, int]
