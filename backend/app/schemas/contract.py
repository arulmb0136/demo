from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

class ContractAttachment(BaseModel):
    id: Union[int, str]
    name: str
    filename: Optional[str] = None
    key: str
    content_type: str = "application/pdf"
    file_size: int = 0
    file_hash: Optional[str] = None
    hash_algorithm: Optional[str] = "sha256"
    url: Optional[str] = None
    view_url: Optional[str] = None
    download_url: Optional[str] = None
    can_view: bool = True
    can_download: bool = True

class ContractGridItem(BaseModel):
    """
    Lightweight contract summary model optimized for fast dashboard grid rendering.
    """
    id: str
    ironclad_id: str
    name: str
    title: str
    type: str
    type_display_name: str
    record_type: str
    counterparty_name: str
    community_name: Optional[str] = None
    property_id: Optional[str] = None
    effective_date: Optional[str] = None
    expiration_date: Optional[str] = None
    status: str
    enhanced_status: Optional[str] = None
    status_message: Optional[str] = None
    attachment_count: int = 0
    has_attachments: bool = False
    contract_value: float = 0.0
    currency: str = "USD"
    last_synced_date: Optional[str] = None

class ContractDetailResponse(BaseModel):
    """
    Full contract details model loaded when user clicks 'View Details'.
    Includes complete properties, term lengths, and permissions-filtered attachments.
    """
    id: str
    ironclad_id: str
    name: str
    title: str
    type: str
    type_display_name: str
    record_type: str
    template_name: str = ""
    status: str
    enhanced_status: Optional[str] = None
    status_message: Optional[str] = None
    remaining_duration: Optional[str] = None
    event_date: Optional[str] = None
    counterparty_name: str
    contracting_entity: Optional[str] = None
    community_name: Optional[str] = None
    property_id: Optional[str] = None
    agreement_type: Optional[str] = None
    agreement_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiration_date: Optional[str] = None
    termination_date: Optional[str] = None
    renewal_type: Optional[str] = None
    initial_term_length: Optional[str] = None
    renewal_term_length: Optional[str] = None
    renewal_opt_out_date: Optional[str] = None
    renewal_opt_out_period: Optional[str] = None
    termination_notice_period: Optional[str] = None
    times_renewed: Optional[Union[int, str]] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    last_synced_date: Optional[str] = None
    last_updated: Optional[str] = None
    creator_email: Optional[str] = None
    department: Optional[str] = None
    contract_value: float = 0.0
    currency: str = "USD"
    attributes: Dict[str, Any] = Field(default_factory=dict)
    properties: Dict[str, Any] = Field(default_factory=dict)
    permissions: Dict[str, bool] = Field(default_factory=dict)
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
