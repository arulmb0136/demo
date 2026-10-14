import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.core.logging import logger

ALLOWED_RECORD_TYPES = {
    "Property Service Contract",
    "Purchase & Sales Agreement",
    "General Services Agreement"
}

ALLOWED_RECORD_TYPES_PARAM = "Property Service Contract,Purchase & Sales Agreement,General Services Agreement"

class IroncladTokenManager:
    """
    Manages OAuth2 Client Credentials token lifecycle per Ironclad specification.
    Calls POST /oauth/token with scopes:
      public.records.readRecords public.records.readAttachments
    Client Credentials tokens are valid for up to 6 hours (21600 seconds).
    When expired, a new token is requested automatically.
    """
    def __init__(self, token_url: str, client_id: str, client_secret: str):
        self.token_url = token_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token: Optional[str] = None
        self.expires_at: float = 0.0

    def has_credentials(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def is_expired(self) -> bool:
        # Renew token if within 90 seconds of expiry
        return not self.access_token or time.time() >= (self.expires_at - 90)

    async def get_valid_token(self) -> str:
        if not self.has_credentials():
            raise ValueError(
                "Ironclad Client ID and Client Secret are not configured. "
                "Please configure IRONCLAD_CLIENT_ID and IRONCLAD_CLIENT_SECRET in backend/.env"
            )

        if not self.is_expired() and self.access_token:
            return self.access_token

        await self._acquire_token()
        if not self.access_token:
            raise RuntimeError("Failed to acquire access token from Ironclad OAuth endpoint.")
        return self.access_token

    async def _acquire_token(self) -> bool:
        logger.info(f"Requesting Client Credentials token from Ironclad: {self.token_url}")
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "public.records.readRecords public.records.readAttachments"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(self.token_url, data=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                self.access_token = data.get("access_token")
                expires_in = data.get("expires_in", 21600)
                self.expires_at = time.time() + float(expires_in)
                logger.info(f"Acquired Ironclad OAuth token (valid for {expires_in}s / {expires_in // 3600}h)")
                return True
            else:
                logger.error(f"Ironclad Client Credentials grant failed: HTTP {res.status_code} - {res.text}")
                raise RuntimeError(f"Ironclad authentication failure (HTTP {res.status_code}): {res.text}")


class IroncladService:
    """
    Direct client for Ironclad Public REST API (developer.ironcladapp.com).
    Integrates strictly with:
      1. POST /oauth/token (Client Credentials Grant)
      2. GET /records/ids (List All Record IDs filtered to the 3 allowed types)
      3. GET /records/{id} (Retrieve a Record)
      4. GET /records/{id}/attachments/{key} (Retrieve an Attachment on a Record)
    """
    def __init__(self):
        # Normalize base URL to ensure proper endpoint appending
        raw_url = settings.IRONCLAD_API_BASE_URL.rstrip("/")
        if not raw_url.endswith("/public/api/v1"):
            self.api_root = f"{raw_url}/public/api/v1"
        else:
            self.api_root = raw_url

        self.client_id = settings.IRONCLAD_CLIENT_ID
        self.client_secret = settings.IRONCLAD_CLIENT_SECRET
        self.as_user_email = settings.IRONCLAD_AS_USER_EMAIL
        self.token_manager = IroncladTokenManager(
            token_url=settings.IRONCLAD_TOKEN_URL,
            client_id=self.client_id,
            client_secret=self.client_secret
        )

    async def _get_auth_headers(self, user_email: Optional[str] = None) -> Dict[str, str]:
        token = await self.token_manager.get_valid_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        # Send actor header per Ironclad Client Credentials specification
        effective_email = user_email or self.as_user_email
        if effective_email:
            headers["x-as-user-email"] = effective_email
        return headers

    # -------------------------------------------------------------------------
    # 1. List All Record IDs: GET /records/ids
    # -------------------------------------------------------------------------
    async def fetch_record_ids(self, search: Optional[str] = None, user_email: Optional[str] = None) -> List[str]:
        """
        Returns identifiers of records matching the 3 allowed types.
        Endpoint: GET /records/ids
        OAuth Scope: public.records.readRecords
        """
        if not self.token_manager.has_credentials():
            logger.warning("Ironclad credentials not configured. Returning empty record list.")
            return []

        endpoint = f"{self.api_root}/records/ids"
        params: Dict[str, Any] = {
            "pageSize": 10000,
            "types": ALLOWED_RECORD_TYPES_PARAM,
            "sortField": "agreementDate",
            "sortDirection": "DESC"
        }
        if search:
            params["search"] = search[:1000]

        try:
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(endpoint, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    # Per OpenAPI definition, response echoes { page, pageSize, count, list: [ { id, ironcladId } ] }
                    raw_items = data.get("list", data if isinstance(data, list) else [])
                    ids = [
                        item["id"] if isinstance(item, dict) and "id" in item else str(item)
                        for item in raw_items
                    ]
                    logger.info(f"Retrieved {len(ids)} record IDs from Ironclad GET /records/ids")
                    return ids
                elif res.status_code == 401:
                    logger.info("Access token expired during GET /records/ids. Re-authenticating...")
                    self.token_manager.access_token = None
                    headers = await self._get_auth_headers(user_email=user_email)
                    retry_res = await client.get(endpoint, params=params, headers=headers)
                    if retry_res.status_code == 200:
                        retry_data = retry_res.json()
                        raw_items = retry_data.get("list", retry_data if isinstance(retry_data, list) else [])
                        return [item["id"] if isinstance(item, dict) and "id" in item else str(item) for item in raw_items]
                logger.error(f"Ironclad GET /records/ids returned HTTP {res.status_code}: {res.text}")
                return []
        except Exception as exc:
            logger.error(f"Error connecting to Ironclad GET /records/ids: {exc}", exc_info=True)
            return []

    # -------------------------------------------------------------------------
    # 2. Retrieve a Record: GET /records/{id}
    # -------------------------------------------------------------------------
    async def fetch_record_by_id(self, record_id: str, user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves properties and attachments for a specific record.
        Endpoint: GET /records/{id}
        OAuth Scope: public.records.readRecords
        """
        if not self.token_manager.has_credentials():
            return None

        endpoint = f"{self.api_root}/records/{record_id}"
        try:
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(endpoint, headers=headers)
                if res.status_code == 200:
                    return self.normalize_record(res.json())
                elif res.status_code == 401:
                    logger.info(f"Access token expired during GET /records/{record_id}. Re-authenticating...")
                    self.token_manager.access_token = None
                    headers = await self._get_auth_headers(user_email=user_email)
                    retry_res = await client.get(endpoint, headers=headers)
                    if retry_res.status_code == 200:
                        return self.normalize_record(retry_res.json())
                elif res.status_code == 404:
                    logger.warning(f"Record '{record_id}' not found in Ironclad.")
                    return None
                logger.error(f"Ironclad GET /records/{record_id} returned HTTP {res.status_code}: {res.text}")
                return None
        except Exception as exc:
            logger.error(f"Failed to fetch Ironclad record '{record_id}': {exc}", exc_info=True)
            return None

    # -------------------------------------------------------------------------
    # 3. Retrieve All Allowed Whitelisted Records
    # -------------------------------------------------------------------------
    async def fetch_allowed_contracts(self, search: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches record IDs from /records/ids and loads details for whitelisted types:
        - Property Service Contract
        - Purchase & Sales Agreement
        - General Services Agreement
        """
        record_ids = await self.fetch_record_ids(search=search, user_email=user_email)
        allowed_contracts: List[Dict[str, Any]] = []

        for r_id in record_ids:
            record = await self.fetch_record_by_id(r_id, user_email=user_email)
            if record and record.get("record_type") in ALLOWED_RECORD_TYPES:
                allowed_contracts.append(record)

        allowed_contracts.sort(key=lambda x: x.get("last_synced_date") or "", reverse=True)
        return allowed_contracts

    # -------------------------------------------------------------------------
    # 4. Retrieve an Attachment on a Record: GET /records/{id}/attachments/{key}
    # -------------------------------------------------------------------------
    async def get_attachment_stream(
        self,
        record_id: str,
        attachment_key: str = "signedCopy",
        user_email: Optional[str] = None
    ) -> Tuple[Optional[bytes], str, str]:
        """
        Retrieves binary attachment associated with a specific record.
        Endpoint: GET /records/{id}/attachments/{key}
        OAuth Scope: public.records.readAttachments
        """
        clean_key = attachment_key or "signedCopy"
        filename = clean_key.split("/")[-1] if "/" in clean_key else clean_key
        if not filename.endswith(".pdf"):
            filename = f"{filename}.pdf"
        content_type = "application/pdf"

        if not self.token_manager.has_credentials():
            logger.error("Cannot retrieve attachment: Ironclad credentials not configured.")
            return None, filename, content_type

        endpoint = f"{self.api_root}/records/{record_id}/attachments/{attachment_key}"
        try:
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.get(endpoint, headers=headers)
                if res.status_code == 200:
                    ct = res.headers.get("content-type", content_type)
                    return res.content, filename, ct
                elif res.status_code == 401:
                    logger.info("Access token expired during attachment retrieval. Re-authenticating...")
                    self.token_manager.access_token = None
                    headers = await self._get_auth_headers(user_email=user_email)
                    retry_res = await client.get(endpoint, headers=headers)
                    if retry_res.status_code == 200:
                        ct = retry_res.headers.get("content-type", content_type)
                        return retry_res.content, filename, ct
                logger.error(f"Ironclad GET /records/{record_id}/attachments/{attachment_key} returned HTTP {res.status_code}: {res.text}")
                return None, filename, content_type
        except Exception as exc:
            logger.error(f"Failed to retrieve attachment '{attachment_key}' on record '{record_id}': {exc}", exc_info=True)
            return None, filename, content_type

    # -------------------------------------------------------------------------
    # 5. Check Notifications for Newly Arrived Agreements
    # -------------------------------------------------------------------------
    async def check_new_agreements(self, since_iso: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns newly arrived agreements since given ISO timestamp for post-login notifications."""
        all_contracts = await self.fetch_allowed_contracts(user_email=user_email)
        if not since_iso:
            cutoff = datetime.utcnow() - timedelta(hours=24)
        else:
            try:
                clean_str = since_iso.replace("Z", "+00:00")
                cutoff = datetime.fromisoformat(clean_str).replace(tzinfo=None)
            except Exception:
                cutoff = datetime.utcnow() - timedelta(hours=24)

        new_items = []
        for c in all_contracts:
            sync_dt = None
            if c.get("last_synced_date"):
                try:
                    sync_dt = datetime.fromisoformat(str(c["last_synced_date"]).replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    pass
            if sync_dt and sync_dt > cutoff:
                new_items.append({
                    "id": c["ironclad_id"],
                    "title": c["title"],
                    "record_type": c["record_type"],
                    "counterparty_name": c["counterparty_name"],
                    "contract_value": c["contract_value"],
                    "status": c["status"],
                    "arrived_at": c["last_synced_date"]
                })
        return new_items

    # -------------------------------------------------------------------------
    # Record Normalization
    # -------------------------------------------------------------------------
    def normalize_record(self, raw_item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not raw_item:
            return None

        ironclad_id = raw_item.get("id")
        record_type = raw_item.get("type") or raw_item.get("record_type") or "General Services Agreement"
        title = raw_item.get("name") or raw_item.get("title") or f"{record_type} - {ironclad_id}"
        status_val = raw_item.get("step") or raw_item.get("status") or "signed"
        properties = raw_item.get("properties", {})

        def extract_prop(key: str, default: Any = None) -> Any:
            if key in properties:
                prop_item = properties[key]
                if isinstance(prop_item, dict) and "value" in prop_item:
                    return prop_item["value"]
                return prop_item
            return default

        counterparty = extract_prop("counterpartyName") or raw_item.get("counterparty_name") or "Counterparty"
        if isinstance(counterparty, dict):
            counterparty = counterparty.get("name", "Counterparty")

        val_obj = extract_prop("totalContractValue")
        if val_obj is not None:
            if isinstance(val_obj, dict):
                contract_val = float(val_obj.get("amount", 0.0))
                currency = val_obj.get("currency", "USD")
            else:
                contract_val = float(val_obj)
                currency = "USD"
        else:
            contract_val = float(raw_item.get("contract_value", 0.0))
            currency = raw_item.get("currency", "USD")

        department = extract_prop("department") or raw_item.get("department", "Operations")
        creator_email = extract_prop("creatorEmail") or raw_item.get("creator_email") or "legal@company.com"

        def parse_date(date_val: Any) -> Optional[str]:
            if not date_val:
                return None
            try:
                clean_str = str(date_val).replace("Z", "+00:00")
                return datetime.fromisoformat(clean_str).isoformat()
            except Exception:
                return str(date_val)

        now_iso = datetime.utcnow().isoformat()
        agreement_date = parse_date(extract_prop("agreementDate") or raw_item.get("agreement_date")) or now_iso
        start_date = parse_date(extract_prop("startDate") or raw_item.get("start_date")) or agreement_date
        completion_date = parse_date(extract_prop("completionDate") or raw_item.get("completion_date")) or parse_date(extract_prop("expirationDate"))
        last_synced = parse_date(raw_item.get("lastUpdated") or raw_item.get("updatedAt")) or now_iso

        raw_attachments = raw_item.get("attachments", []) or raw_item.get("documentLinks", [])
        clean_attachments = []
        if raw_attachments:
            for idx, att in enumerate(raw_attachments):
                att_name = att.get("name") or f"Document_{idx+1}.pdf"
                att_key = att.get("key") or f"{ironclad_id}/{att_name}"
                clean_attachments.append({
                    "id": idx + 1,
                    "name": att_name,
                    "key": att_key,
                    "content_type": "application/pdf" if att_name.lower().endswith(".pdf") else "application/octet-stream",
                    "file_size": att.get("file_size", att.get("size", 0)),
                    "url": f"/api/v1/contracts/{ironclad_id}/attachments/{att_key}"
                })
        else:
            # Default signedCopy attachment per Ironclad OpenAPI definition
            clean_attachments.append({
                "id": 1,
                "name": f"{title}_SignedCopy.pdf",
                "key": "signedCopy",
                "content_type": "application/pdf",
                "file_size": 0,
                "url": f"/api/v1/contracts/{ironclad_id}/attachments/signedCopy"
            })

        return {
            "id": ironclad_id,
            "ironclad_id": ironclad_id,
            "title": title,
            "record_type": record_type,
            "template_name": record_type,
            "status": status_val,
            "counterparty_name": str(counterparty),
            "contract_value": contract_val,
            "currency": currency,
            "agreement_date": agreement_date,
            "start_date": start_date,
            "completion_date": completion_date,
            "last_synced_date": last_synced,
            "creator_email": str(creator_email),
            "department": str(department),
            "attributes": properties if properties else raw_item.get("attributes", {}),
            "attachments": clean_attachments
        }

ironclad_service = IroncladService()
