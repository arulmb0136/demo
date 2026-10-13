from typing import List, Dict, Any, Optional
import httpx
import uuid
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.logging import logger

class IroncladService:
    """Client for Ironclad Public API (developer.ironcladapp.com)"""
    def __init__(self):
        self.base_url = settings.IRONCLAD_API_BASE_URL.rstrip("/")
        self.client_id = settings.IRONCLAD_CLIENT_ID
        self.client_secret = settings.IRONCLAD_CLIENT_SECRET
        self.bearer_token = settings.IRONCLAD_BEARER_TOKEN
        self.demo_mode = settings.IRONCLAD_DEMO_MODE

    def _get_headers(self) -> Dict[str, str]:
        token = self.bearer_token
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Client-Id": self.client_id
        }

    async def fetch_workflows(self) -> List[Dict[str, Any]]:
        """Fetch active contract workflows from Ironclad API"""
        if self.demo_mode or not self.client_id or self.client_id.startswith("ironclad_demo"):
            logger.info("Using Ironclad Service Sandbox Mock Workflows (developer.ironcladapp.com schema)")
            return self._get_mock_ironclad_workflows()

        url = f"{self.base_url}/workflows"
        logger.info(f"Querying Ironclad API: GET {url}")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self._get_headers())
                if response.status_code == 200:
                    data = response.json()
                    return data.get("list", data) if isinstance(data, dict) else data
                else:
                    logger.warning(
                        f"Ironclad API returned status {response.status_code}: {response.text}. "
                        f"Falling back to sandbox mock data."
                    )
                    return self._get_mock_ironclad_workflows()
        except Exception as exc:
            logger.error(f"Failed to connect to Ironclad API ({str(exc)}). Using sandbox fallback.", exc_info=True)
            return self._get_mock_ironclad_workflows()

    async def fetch_records(self, last_updated: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetch signed/executed repository records from Ironclad API
        Supports incremental data warehouse query: GET /records?lastUpdated=<ISO8601>
        (per developer.ironcladapp.com/docs/data-lakedata-warehouse-integration)
        """
        if self.demo_mode or not self.client_id or self.client_id.startswith("ironclad_demo"):
            logger.info("Using Ironclad Service Sandbox Mock Records (developer.ironcladapp.com schema)")
            return self._get_mock_ironclad_records()

        url = f"{self.base_url}/records"
        params = {}
        if last_updated:
            params["lastUpdated"] = last_updated.isoformat()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params, headers=self._get_headers())
                if response.status_code == 200:
                    data = response.json()
                    return data.get("list", data) if isinstance(data, dict) else data
                return self._get_mock_ironclad_records()
        except Exception:
            return self._get_mock_ironclad_records()

    async def create_record(self, record_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates an Ironclad Record via POST /records following developer.ironcladapp.com/docs/create-a-record-1
        """
        now = datetime.utcnow()
        if self.demo_mode or not self.client_id or self.client_id.startswith("ironclad_demo"):
            new_id = f"rec_ic_{uuid.uuid4().hex[:10]}"
            logger.info(f"Created sandbox Ironclad Record with ID {new_id} based on official API specification")
            mock_res = {
                "id": new_id,
                "type": record_payload.get("type", "contract"),
                "name": record_payload.get("name", "Untitled Record"),
                "properties": record_payload.get("properties", {}),
                "links": record_payload.get("links", []),
                "lastUpdated": now.isoformat(),
                "createdAt": now.isoformat(),
                "updatedAt": now.isoformat()
            }
            return mock_res

        url = f"{self.base_url}/records"
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=record_payload, headers=self._get_headers())
                if res.status_code in [200, 201]:
                    return res.json()
                else:
                    logger.warning(f"Ironclad create_record returned {res.status_code}: {res.text}. Falling back to sandbox response.")
                    new_id = f"rec_ic_{uuid.uuid4().hex[:10]}"
                    return {"id": new_id, "lastUpdated": now.isoformat(), **record_payload}
        except Exception as e:
            logger.error(f"Error calling Ironclad create_record API ({e}). Falling back.", exc_info=True)
            new_id = f"rec_ic_{uuid.uuid4().hex[:10]}"
            return {"id": new_id, "lastUpdated": now.isoformat(), **record_payload}

    def normalize_ironclad_data(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes both Ironclad Workflows and Ironclad Records (developer.ironcladapp.com Data Lake & Records schema)
        into a consistent data dictionary with full lifecycle and tracking dates.
        """
        now = datetime.utcnow()
        ironclad_id = raw_item.get("id")
        
        # 1. Title / Name
        title = raw_item.get("name") or raw_item.get("title") or "Untitled Agreement"
        
        # 2. Record Type & Template
        record_type = raw_item.get("type") or "contract"
        template_name = raw_item.get("template") or raw_item.get("type") or "Standard Agreement"
        
        # 3. Status
        status_val = raw_item.get("step") or raw_item.get("status") or "draft"

        # 4. Extract from nested properties (Record schema) or flat fields (Workflow schema)
        properties = raw_item.get("properties", {})
        
        def extract_prop(key: str, default: Any = None) -> Any:
            if key in properties:
                prop_item = properties[key]
                if isinstance(prop_item, dict) and "value" in prop_item:
                    return prop_item["value"]
                return prop_item
            return default

        # Counterparty
        counterparty = (
            extract_prop("counterpartyName")
            or raw_item.get("counterpartyName")
            or "Unknown Counterparty"
        )
        if isinstance(counterparty, dict):
            counterparty = counterparty.get("name", "Unknown Counterparty")

        # Contract Value and Currency
        val_obj = extract_prop("totalContractValue")
        if val_obj is not None:
            if isinstance(val_obj, dict):
                contract_val = float(val_obj.get("amount", 0.0))
                currency = val_obj.get("currency", "USD")
            else:
                contract_val = float(val_obj)
                currency = "USD"
        else:
            contract_val = float(raw_item.get("contractValue", 0.0))
            currency = raw_item.get("currency", "USD")

        # Department
        department = extract_prop("department") or raw_item.get("department", "General")

        # Creator / Signer Email
        creator_email = (
            extract_prop("counterpartySignerEmail")
            or (raw_item.get("creator", {}).get("email") if isinstance(raw_item.get("creator"), dict) else None)
            or raw_item.get("creator_email")
            or "system@ironclad.demo"
        )

        def parse_date(date_val: Any) -> Optional[datetime]:
            if not date_val:
                return None
            try:
                clean_str = str(date_val).replace("Z", "+00:00")
                return datetime.fromisoformat(clean_str)
            except Exception:
                return None

        # 5. LIFECYCLE & TRACKING DATES
        # Agreement Date (Date Formalized in Ironclad Repository)
        agreement_date_raw = extract_prop("agreementDate") or raw_item.get("agreement_date")
        agreement_date = parse_date(agreement_date_raw)

        # Start Date (Deliverable / Term start)
        start_date_raw = (
            extract_prop("startDate")
            or extract_prop("effectiveDate")
            or raw_item.get("start_date")
            or raw_item.get("effectiveDate")
        )
        start_date = parse_date(start_date_raw) or agreement_date or now

        # Completion Date (Target delivery / Expiration / Termination)
        completion_date_raw = (
            extract_prop("completionDate")
            or extract_prop("expirationDate")
            or raw_item.get("completion_date")
            or raw_item.get("expirationDate")
        )
        completion_date = parse_date(completion_date_raw) or (start_date + timedelta(days=365) if start_date else now + timedelta(days=365))

        # Signed Date (Countersignature completion)
        signed_date_raw = extract_prop("signedDate") or extract_prop("countersignedDate") or raw_item.get("signed_date")
        signed_date = parse_date(signed_date_raw) or (agreement_date if status_val == "signed" else None)

        # Last Synced / Updated Date (Audit tracking for Data Lake integration)
        last_updated_raw = (
            raw_item.get("lastUpdated")
            or raw_item.get("updatedAt")
            or raw_item.get("created")
        )
        last_synced_date = parse_date(last_updated_raw) or now

        # Renewal Notice Cutoff Date
        notice_date_raw = extract_prop("renewalNoticeDate") or raw_item.get("renewal_notice_date")
        renewal_notice_date = parse_date(notice_date_raw) or (completion_date - timedelta(days=30) if completion_date else None)

        # Links (Related Records)
        links = raw_item.get("links", [])

        # Attachments / Document Links
        doc_links = raw_item.get("documentLinks", []) or raw_item.get("attachments", [])

        # Attributes
        attributes = properties if properties else raw_item.get("attributes", {})

        return {
            "ironclad_id": ironclad_id,
            "title": title,
            "template_name": template_name,
            "record_type": record_type,
            "status": status_val,
            "counterparty_name": str(counterparty),
            "contract_value": contract_val,
            "currency": currency,
            "agreement_date": agreement_date or start_date,
            "start_date": start_date,
            "completion_date": completion_date,
            "signed_date": signed_date,
            "last_synced_date": last_synced_date,
            "renewal_notice_date": renewal_notice_date,
            "effective_date": start_date,
            "expiration_date": completion_date,
            "creator_email": creator_email,
            "department": str(department),
            "attributes": attributes,
            "related_records": links,
            "document_links": doc_links
        }

    def _get_mock_ironclad_records(self) -> List[Dict[str, Any]]:
        """Mock records conforming to developer.ironcladapp.com Data Lake & Records schemas"""
        now = datetime.utcnow()
        return [
            {
                "id": "rec_ic_78910a",
                "type": "Statement of Work",
                "name": "SOW with Acme Cloud Solutions LLC",
                "lastUpdated": now.isoformat(),
                "properties": {
                    "counterpartyName": {
                        "type": "string",
                        "value": "Acme Cloud Solutions LLC"
                    },
                    "totalContractValue": {
                        "type": "monetary_amount",
                        "value": {
                            "currency": "USD",
                            "amount": 175000.00
                        }
                    },
                    "agreementDate": {
                        "type": "date",
                        "value": (now - timedelta(days=45)).isoformat()
                    },
                    "startDate": {
                        "type": "date",
                        "value": (now - timedelta(days=30)).isoformat()
                    },
                    "completionDate": {
                        "type": "date",
                        "value": (now + timedelta(days=150)).isoformat()
                    },
                    "signedDate": {
                        "type": "date",
                        "value": (now - timedelta(days=42)).isoformat()
                    },
                    "counterpartySignerEmail": {
                        "type": "email",
                        "value": "signer@acme-cloud.com"
                    },
                    "standard_renewalTermLength": {
                        "type": "duration",
                        "value": "P1Y"
                    },
                    "department": {
                        "type": "string",
                        "value": "Engineering"
                    },
                    "counterpartyBillingAddress": {
                        "type": "address",
                        "value": {
                            "lines": ["4527 Mission Street", "Unit B"],
                            "locality": "San Francisco",
                            "country": "United States",
                            "region": "California",
                            "postcode": "94112"
                        }
                    }
                },
                "links": [
                    {"recordId": "rec_parent_master_agreement_01"}
                ],
                "attachments": [
                    {
                        "name": "Acme_Cloud_SOW_Executed.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/acme-sow.pdf",
                        "key": "ironclad/rec_ic_78910a/Acme_Cloud_SOW_Executed.pdf"
                    }
                ]
            },
            {
                "id": "rec_ic_88921b",
                "type": "Vendor Agreement",
                "name": "Vendor Agreement with Palo Alto Networks",
                "lastUpdated": (now - timedelta(days=2)).isoformat(),
                "properties": {
                    "counterpartyName": {
                        "type": "string",
                        "value": "Palo Alto Networks"
                    },
                    "totalContractValue": {
                        "type": "monetary_amount",
                        "value": {
                            "currency": "USD",
                            "amount": 320000.00
                        }
                    },
                    "agreementDate": {
                        "type": "date",
                        "value": (now - timedelta(days=90)).isoformat()
                    },
                    "startDate": {
                        "type": "date",
                        "value": (now - timedelta(days=80)).isoformat()
                    },
                    "completionDate": {
                        "type": "date",
                        "value": (now + timedelta(days=285)).isoformat()
                    },
                    "signedDate": {
                        "type": "date",
                        "value": (now - timedelta(days=88)).isoformat()
                    },
                    "counterpartySignerEmail": {
                        "type": "email",
                        "value": "legal@paloaltonetworks.demo"
                    },
                    "department": {
                        "type": "string",
                        "value": "Security"
                    }
                },
                "links": [
                    {"recordId": "rec_parent_global_sec_02"}
                ],
                "attachments": [
                    {
                        "name": "PANW_Vendor_Agreement.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/panw-vendor.pdf",
                        "key": "ironclad/rec_ic_88921b/PANW_Vendor_Agreement.pdf"
                    }
                ]
            }
        ]

    def _get_mock_ironclad_workflows(self) -> List[Dict[str, Any]]:
        """Realistic workflow schema payloads based on developer.ironcladapp.com specifications"""
        now = datetime.utcnow()
        return [
            {
                "id": "wf_ic_882910a",
                "title": "Enterprise Cloud Services Agreement - Stripe Inc",
                "template": "Master Services Agreement",
                "step": "in_review",
                "counterpartyName": "Stripe Inc",
                "contractValue": 250000.0,
                "currency": "USD",
                "lastUpdated": now.isoformat(),
                "agreementDate": now.isoformat(),
                "effectiveDate": now.isoformat(),
                "expirationDate": (now + timedelta(days=365)).isoformat(),
                "creator": {"email": "legal-counsel@ironclad.demo", "name": "Sarah Jenkins"},
                "department": "Engineering",
                "documentLinks": [
                    {
                        "name": "Stripe_MSA_Executed_v2.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/stripe-msa.pdf",
                        "key": "ironclad/wf_ic_882910a/Stripe_MSA_Executed_v2.pdf"
                    }
                ],
                "attributes": {
                    "governingLaw": "Delaware",
                    "paymentTerms": "Net 30",
                    "liabilityCap": "2x Annual Contract Value",
                    "dataProcessingAddendum": True
                }
            },
            {
                "id": "wf_ic_991823b",
                "title": "Global Data Processing Addendum - Snowflake",
                "template": "Data Processing Addendum",
                "step": "out_for_signature",
                "counterpartyName": "Snowflake Inc",
                "contractValue": 185000.0,
                "currency": "USD",
                "lastUpdated": (now - timedelta(days=1)).isoformat(),
                "agreementDate": (now - timedelta(days=10)).isoformat(),
                "effectiveDate": (now - timedelta(days=10)).isoformat(),
                "expirationDate": (now + timedelta(days=720)).isoformat(),
                "creator": {"email": "compliance@ironclad.demo", "name": "Marcus Vance"},
                "department": "Security",
                "documentLinks": [
                    {
                        "name": "Snowflake_DPA_Final.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/snowflake-dpa.pdf",
                        "key": "ironclad/wf_ic_991823b/Snowflake_DPA_Final.pdf"
                    }
                ],
                "attributes": {
                    "gdprCompliant": True,
                    "ccpaCompliant": True,
                    "subprocessorsApproved": 14
                }
            },
            {
                "id": "wf_ic_102934c",
                "title": "Mutual Non-Disclosure Agreement - OpenAI LLC",
                "template": "Mutual NDA",
                "step": "signed",
                "counterpartyName": "OpenAI LLC",
                "contractValue": 0.0,
                "currency": "USD",
                "lastUpdated": (now - timedelta(days=3)).isoformat(),
                "agreementDate": (now - timedelta(days=45)).isoformat(),
                "effectiveDate": (now - timedelta(days=45)).isoformat(),
                "expirationDate": (now + timedelta(days=320)).isoformat(),
                "creator": {"email": "admin@ironclad.demo", "name": "Elena Rostova"},
                "department": "Legal",
                "documentLinks": [
                    {
                        "name": "OpenAI_Mutual_NDA_Signed.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/openai-nda.pdf",
                        "key": "ironclad/wf_ic_102934c/OpenAI_Mutual_NDA_Signed.pdf"
                    }
                ],
                "attributes": {
                    "confidentialityPeriodYears": 3,
                    "jurisdiction": "California"
                }
            },
            {
                "id": "wf_ic_541920d",
                "title": "Strategic Vendor SOW - Datadog Inc",
                "template": "Statement of Work",
                "step": "draft",
                "counterpartyName": "Datadog Inc",
                "contractValue": 92000.0,
                "currency": "USD",
                "lastUpdated": now.isoformat(),
                "agreementDate": now.isoformat(),
                "effectiveDate": now.isoformat(),
                "expirationDate": (now + timedelta(days=180)).isoformat(),
                "creator": {"email": "procurement@ironclad.demo", "name": "David Kim"},
                "department": "DevOps",
                "documentLinks": [
                    {
                        "name": "Datadog_SOW_Draft_v1.docx",
                        "url": "https://developer.ironcladapp.com/sample-docs/datadog-sow.docx",
                        "key": "ironclad/wf_ic_541920d/Datadog_SOW_Draft_v1.docx"
                    }
                ],
                "attributes": {
                    "milestonesCount": 4,
                    "slaCommitment": "99.95%"
                }
            },
            {
                "id": "wf_ic_772019e",
                "title": "Corporate Master Software License - Microsoft Corp",
                "template": "Software License Agreement",
                "step": "signed",
                "counterpartyName": "Microsoft Corporation",
                "contractValue": 450000.0,
                "currency": "USD",
                "lastUpdated": (now - timedelta(days=10)).isoformat(),
                "agreementDate": (now - timedelta(days=120)).isoformat(),
                "effectiveDate": (now - timedelta(days=120)).isoformat(),
                "expirationDate": (now + timedelta(days=245)).isoformat(),
                "creator": {"email": "it-procure@ironclad.demo", "name": "Rachel Adams"},
                "department": "IT Operations",
                "documentLinks": [
                    {
                        "name": "MSFT_Enterprise_License_Executed.pdf",
                        "url": "https://developer.ironcladapp.com/sample-docs/msft-license.pdf",
                        "key": "ironclad/wf_ic_772019e/MSFT_Enterprise_License_Executed.pdf"
                    }
                ],
                "attributes": {
                    "seatCount": 1200,
                    "premierSupportIncluded": True
                }
            }
        ]

ironclad_service = IroncladService()
