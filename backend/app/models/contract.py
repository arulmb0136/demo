from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin

class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ironclad_id = Column(String(100), unique=True, index=True, nullable=True) # UUID or record/workflow ID
    title = Column(String(255), nullable=False, index=True) # Record name in Ironclad
    template_name = Column(String(150), nullable=False, index=True) # Workflow template or record type
    record_type = Column(String(50), default="contract", nullable=False, index=True) # "contract", "record", "statement-of-work"
    status = Column(String(50), nullable=False, default="draft", index=True) # draft, in_review, out_for_signature, signed, archived
    counterparty_name = Column(String(255), nullable=False, index=True)
    contract_value = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    # Lifecycle & Tracking Dates (per developer.ironcladapp.com Data Lake / Warehouse schema)
    agreement_date = Column(DateTime, nullable=True, index=True) # Date agreement was formalized (properties.agreementDate)
    start_date = Column(DateTime, nullable=True, index=True) # Effective start of deliverables/term
    completion_date = Column(DateTime, nullable=True, index=True) # Projected or actual completion/expiration
    signed_date = Column(DateTime, nullable=True) # Timestamp countersignatures completed
    last_synced_date = Column(DateTime, nullable=True, default=datetime.utcnow) # Ironclad lastUpdated sync audit
    renewal_notice_date = Column(DateTime, nullable=True) # Notice deadline for non-renewal

    effective_date = Column(DateTime, nullable=True) # Backward-compatible alias for start/agreement date
    expiration_date = Column(DateTime, nullable=True) # Backward-compatible alias for completion date

    creator_email = Column(String(255), nullable=True)
    department = Column(String(100), default="General", nullable=False, index=True)
    attributes = Column(JSON, default=dict, nullable=False) # Full Ironclad typed properties dictionary
    related_records = Column(JSON, default=list, nullable=False) # Ironclad bi-directional links [{"recordId": "..."}]

    documents = relationship("Document", back_populates="contract", cascade="all, delete-orphan", lazy="joined")

    def __repr__(self):
        return f"<Contract id={self.id} title='{self.title}' status='{self.status}' start={self.start_date} completion={self.completion_date}>"
