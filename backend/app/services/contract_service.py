from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.models.contract import Contract
from app.repositories.contract_repo import ContractRepository
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractSyncResponse,
    BiMetricsResponse,
    IroncladRecordCreate
)
from app.services.ironclad_service import ironclad_service

class ContractService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ContractRepository(db)

    async def list_contracts(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        department: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Contract]:
        """Lists contracts honoring the configured DATA_SOURCE toggle"""
        if settings.DATA_SOURCE == "ironclad":
            logger.info("Serving contracts directly via Ironclad API integration mode")
            await self.sync_with_ironclad()
        
        return self.repo.filter_contracts(
            status=status,
            search=search,
            department=department,
            skip=skip,
            limit=limit
        )

    def get_contract(self, contract_id: int) -> Contract:
        contract = self.repo.get(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract with ID {contract_id} not found"
            )
        return contract

    def create_contract(self, contract_in: ContractCreate) -> Contract:
        now = datetime.utcnow()
        start = contract_in.start_date or contract_in.agreement_date or contract_in.effective_date or now
        completion = contract_in.completion_date or contract_in.expiration_date

        contract = Contract(
            ironclad_id=contract_in.ironclad_id,
            title=contract_in.title,
            template_name=contract_in.template_name,
            record_type=contract_in.record_type or "contract",
            status=contract_in.status,
            counterparty_name=contract_in.counterparty_name,
            contract_value=contract_in.contract_value,
            currency=contract_in.currency,
            agreement_date=contract_in.agreement_date or start,
            start_date=start,
            completion_date=completion,
            signed_date=contract_in.signed_date or (start if contract_in.status == "signed" else None),
            last_synced_date=now,
            renewal_notice_date=contract_in.renewal_notice_date,
            effective_date=start,
            expiration_date=completion,
            creator_email=contract_in.creator_email,
            department=contract_in.department,
            attributes=contract_in.attributes,
            related_records=contract_in.related_records or []
        )
        return self.repo.create(contract)

    async def create_ironclad_record(self, record_in: IroncladRecordCreate, creator_email: str) -> Contract:
        """
        Creates an Ironclad Record directly following developer.ironcladapp.com/docs/create-a-record-1
        Payload: { type, name, properties: { ... }, links: [ ... ] }
        """
        record_payload = {
            "type": record_in.type,
            "name": record_in.name,
            "properties": {
                k: (v.dict() if hasattr(v, "dict") else v)
                for k, v in record_in.properties.items()
            },
            "links": [
                link.dict() if hasattr(link, "dict") else link
                for link in (record_in.links or [])
            ]
        }

        # 1. Post to Ironclad API or sandbox mock
        ironclad_res = await ironclad_service.create_record(record_payload)
        
        # 2. Normalize response to PostgreSQL contract format
        normalized = ironclad_service.normalize_ironclad_data(ironclad_res)
        if not normalized.get("creator_email"):
            normalized["creator_email"] = creator_email

        # 3. Persist in local database with lifecycle tracking dates
        contract = Contract(
            ironclad_id=normalized["ironclad_id"],
            title=normalized["title"],
            template_name=normalized["template_name"],
            record_type=normalized["record_type"],
            status=normalized["status"] or "active",
            counterparty_name=normalized["counterparty_name"],
            contract_value=normalized["contract_value"],
            currency=normalized["currency"],
            agreement_date=normalized["agreement_date"],
            start_date=normalized["start_date"],
            completion_date=normalized["completion_date"],
            signed_date=normalized["signed_date"],
            last_synced_date=normalized["last_synced_date"],
            renewal_notice_date=normalized["renewal_notice_date"],
            effective_date=normalized["start_date"],
            expiration_date=normalized["completion_date"],
            creator_email=creator_email,
            department=normalized["department"],
            attributes=normalized["attributes"],
            related_records=normalized["related_records"]
        )
        return self.repo.create(contract)

    def update_contract(self, contract_id: int, contract_in: ContractUpdate) -> Contract:
        contract = self.get_contract(contract_id)
        update_data = contract_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contract, field, value)
        contract.last_synced_date = datetime.utcnow()
        return self.repo.update(contract)

    def delete_contract(self, contract_id: int) -> bool:
        contract = self.get_contract(contract_id)
        return self.repo.delete(contract.id)

    async def sync_with_ironclad(self) -> ContractSyncResponse:
        """
        Pulls both Workflows and Repository Records from Ironclad,
        normalizes according to developer.ironcladapp.com/docs/data-lakedata-warehouse-integration,
        and seamlessly synchronizes into PostgreSQL.
        """
        logger.info("Initiating unified synchronization with Ironclad Workflows & Records APIs")
        
        workflows = await ironclad_service.fetch_workflows()
        records = await ironclad_service.fetch_records()
        
        raw_items = workflows + records
        synced_count = len(raw_items)
        created_count = 0
        updated_count = 0

        for raw_item in raw_items:
            norm = ironclad_service.normalize_ironclad_data(raw_item)
            ironclad_id = norm["ironclad_id"]
            existing = self.repo.get_by_ironclad_id(ironclad_id) if ironclad_id else None

            if existing:
                existing.title = norm["title"]
                existing.template_name = norm["template_name"]
                existing.record_type = norm["record_type"]
                existing.status = norm["status"]
                existing.counterparty_name = norm["counterparty_name"]
                existing.contract_value = norm["contract_value"]
                existing.currency = norm["currency"]
                existing.agreement_date = norm["agreement_date"]
                existing.start_date = norm["start_date"]
                existing.completion_date = norm["completion_date"]
                existing.signed_date = norm["signed_date"]
                existing.last_synced_date = norm["last_synced_date"]
                existing.renewal_notice_date = norm["renewal_notice_date"]
                existing.effective_date = norm["start_date"]
                existing.expiration_date = norm["completion_date"]
                existing.department = norm["department"]
                existing.attributes = norm["attributes"]
                existing.related_records = norm["related_records"]
                self.repo.update(existing)
                updated_count += 1
                contract_target = existing
            else:
                new_contract = Contract(
                    ironclad_id=norm["ironclad_id"],
                    title=norm["title"],
                    template_name=norm["template_name"],
                    record_type=norm["record_type"],
                    status=norm["status"],
                    counterparty_name=norm["counterparty_name"],
                    contract_value=norm["contract_value"],
                    currency=norm["currency"],
                    agreement_date=norm["agreement_date"],
                    start_date=norm["start_date"],
                    completion_date=norm["completion_date"],
                    signed_date=norm["signed_date"],
                    last_synced_date=norm["last_synced_date"],
                    renewal_notice_date=norm["renewal_notice_date"],
                    effective_date=norm["start_date"],
                    expiration_date=norm["completion_date"],
                    creator_email=norm["creator_email"],
                    department=norm["department"],
                    attributes=norm["attributes"],
                    related_records=norm["related_records"]
                )
                contract_target = self.repo.create(new_contract)
                created_count += 1

            # Sync document attachments / links
            doc_links = norm.get("document_links", [])
            for doc in doc_links:
                existing_doc = any(d.name == doc.get("name") for d in contract_target.documents)
                if not existing_doc:
                    self.repo.add_document(
                        contract_id=contract_target.id,
                        name=doc.get("name", "Document.pdf"),
                        s3_key=doc.get("key", f"ironclad/{contract_target.id}/{doc.get('name')}"),
                        file_size_bytes=1048576,
                        content_type="application/pdf",
                        document_url=doc.get("url")
                    )

        logger.info(
            f"Ironclad unified sync complete: {synced_count} processed ({len(workflows)} workflows, "
            f"{len(records)} records). Created: {created_count}, Updated: {updated_count}."
        )

        return ContractSyncResponse(
            synced_count=synced_count,
            created_count=created_count,
            updated_count=updated_count,
            source=f"Ironclad Workflows & Records APIs ({settings.IRONCLAD_API_BASE_URL})",
            timestamp=datetime.utcnow(),
            message="Successfully synchronized workflows, repository records, and tracking dates from Ironclad"
        )

    def get_bi_metrics(self) -> BiMetricsResponse:
        """Aggregates real-time KPIs and chart distributions for Lite BI Tool"""
        raw_metrics = self.repo.get_bi_metrics()
        return BiMetricsResponse(**raw_metrics)
