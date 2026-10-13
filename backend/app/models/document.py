from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Document(Base):
    __tablename__ = "contract_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    s3_key = Column(String(512), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    content_type = Column(String(100), default="application/pdf")
    document_url = Column(String(1024), nullable=True) # Direct Ironclad document URL or presigned URL
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="documents")

    def __repr__(self):
        return f"<Document id={self.id} name='{self.name}' contract_id={self.contract_id}>"
