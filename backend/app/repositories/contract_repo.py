from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.contract import Contract
from app.models.document import Document
from app.repositories.base import BaseRepository

class ContractRepository(BaseRepository[Contract]):
    def __init__(self, db: Session):
        super().__init__(Contract, db)

    def get_by_ironclad_id(self, ironclad_id: str) -> Optional[Contract]:
        return self.db.query(Contract).filter(Contract.ironclad_id == ironclad_id).first()

    def filter_contracts(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        department: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Contract]:
        query = self.db.query(Contract)
        if status and status != "all":
            query = query.filter(Contract.status == status)
        if department and department != "all":
            query = query.filter(Contract.department == department)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Contract.title.ilike(search_pattern)) |
                (Contract.counterparty_name.ilike(search_pattern)) |
                (Contract.template_name.ilike(search_pattern))
            )
        return query.order_by(desc(Contract.created_at)).offset(skip).limit(limit).all()

    def get_bi_metrics(self) -> Dict[str, Any]:
        contracts = self.db.query(Contract).all()
        total_contracts = len(contracts)
        total_value = sum(c.contract_value for c in contracts)
        active_contracts = sum(1 for c in contracts if c.status in ["in_review", "out_for_signature", "signed"])
        pending_review = sum(1 for c in contracts if c.status == "in_review")
        signed_contracts = sum(1 for c in contracts if c.status == "signed")

        # Status distribution
        status_counts = {}
        for c in contracts:
            status_counts[c.status] = status_counts.get(c.status, 0) + 1

        # Counterparty exposure (top 6 by value)
        cp_exposure = {}
        for c in contracts:
            cp_exposure[c.counterparty_name] = cp_exposure.get(c.counterparty_name, 0.0) + c.contract_value
        
        sorted_cp = sorted(
            [{"counterparty": k, "value": round(v, 2)} for k, v in cp_exposure.items()],
            key=lambda x: x["value"],
            reverse=True
        )[:6]

        # Department distribution
        dept_counts = {}
        for c in contracts:
            dept_counts[c.department] = dept_counts.get(c.department, 0) + 1

        # Monthly Trends (aggregated by created_at YYYY-MM)
        month_map = {}
        for c in contracts:
            month_key = c.created_at.strftime("%b %Y") if c.created_at else "Recent"
            if month_key not in month_map:
                month_map[month_key] = {"month": month_key, "count": 0, "volume": 0.0}
            month_map[month_key]["count"] += 1
            month_map[month_key]["volume"] += c.contract_value

        monthly_trends = list(month_map.values())[-6:]

        return {
            "total_portfolio_value": round(total_value, 2),
            "total_contracts_count": total_contracts,
            "active_contracts_count": active_contracts,
            "pending_review_count": pending_review,
            "signed_contracts_count": signed_contracts,
            "avg_turnaround_days": 14.5,
            "status_distribution": status_counts,
            "counterparty_exposure": sorted_cp,
            "monthly_trends": monthly_trends,
            "department_distribution": dept_counts
        }

    def add_document(
        self,
        contract_id: int,
        name: str,
        s3_key: str,
        file_size_bytes: int,
        content_type: str,
        document_url: Optional[str] = None
    ) -> Document:
        doc = Document(
            contract_id=contract_id,
            name=name,
            s3_key=s3_key,
            file_size_bytes=file_size_bytes,
            content_type=content_type,
            document_url=document_url
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc
