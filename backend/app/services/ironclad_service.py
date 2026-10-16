import time
import ssl
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.core.logging import logger

ALLOWED_RECORD_TYPES = {
    "propertyServiceContractBh",
    "purchaseSaleAgreementBh",
    "generalServicesAgreementBh",
    "Property Service Contract (BH)",
    "Purchase & Sale Agreement (BH)",
    "General Services Agreement (BH)",
    "Property Service Contract",
    "Purchase & Sales Agreement",
    "General Services Agreement"
}

ALLOWED_RECORD_TYPES_PARAM = "propertyServiceContractBh,purchaseSaleAgreementBh,generalServicesAgreementBh"

TYPE_DISPLAY_NAMES = {
    "propertyServiceContractBh": "Property Service Contract (BH)",
    "purchaseSaleAgreementBh": "Purchase & Sale Agreement (BH)",
    "generalServicesAgreementBh": "General Services Agreement (BH)"
}

def get_http_client(timeout: float = 20.0) -> httpx.AsyncClient:
    """Creates an httpx client respecting SSL settings with graceful fallback."""
    return httpx.AsyncClient(timeout=timeout, verify=settings.VERIFY_SSL)

class IroncladTokenManager:
    """
    Manages OAuth2 Client Credentials token lifecycle per Ironclad specification.
    Scope: public.records.readRecords
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
            "scope": "public.records.readRecords"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }

        async def _send_token_request(verify_ssl: bool):
            async with httpx.AsyncClient(timeout=15.0, verify=verify_ssl) as client:
                return await client.post(self.token_url, data=payload, headers=headers)

        try:
            res = await _send_token_request(settings.VERIFY_SSL)
        except (httpx.ConnectError, ssl.SSLCertVerificationError) as ssl_err:
            logger.warning(f"SSL certificate error during OAuth token request ({ssl_err}). Retrying with SSL verify fallback...")
            res = await _send_token_request(False)

        if res.status_code == 200:
            data = res.json()
            self.access_token = data.get("access_token")
            expires_in = data.get("expires_in", 21600)
            self.expires_at = time.time() + float(expires_in)
            logger.info(f"Acquired Ironclad OAuth token with scope 'public.records.readRecords' (valid for {expires_in}s)")
            return True
        else:
            logger.error(f"Ironclad Client Credentials grant failed: HTTP {res.status_code} - {res.text}")
            raise RuntimeError(f"Ironclad authentication failure (HTTP {res.status_code}): {res.text}")


class IroncladService:
    """
    Direct client for Ironclad Public REST API (developer.ironcladapp.com).
    Integrates with:
      1. POST /oauth/token (scope: public.records.readRecords)
      2. GET /records/ids?types=...
      3. GET /records?types=... or GET /records/{id}
      4. GET /records/{id}/attachments/{key}
    """
    def __init__(self):
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
        effective_email = user_email or self.as_user_email
        if effective_email:
            headers["x-as-user-email"] = effective_email
        return headers

    # -------------------------------------------------------------------------
    # 1. List All Record IDs: GET /records/ids?types=...
    # -------------------------------------------------------------------------
    async def fetch_record_ids(
        self,
        search: Optional[str] = None,
        user_email: Optional[str] = None,
        record_types: Optional[List[str]] = None
    ) -> List[str]:
        if not self.token_manager.has_credentials():
            logger.warning("Ironclad credentials not configured. Returning empty record list.")
            return []

        if record_types is not None and len(record_types) == 0:
            return []

        types_param = ",".join(record_types) if record_types else ALLOWED_RECORD_TYPES_PARAM
        endpoint = f"{self.api_root}/records/ids"
        params: Dict[str, Any] = {
            "types": types_param,
            "pageSize": 1000
        }
        if search:
            params["search"] = search[:1000]

        async def _call(verify_ssl: bool):
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=20.0, verify=verify_ssl) as client:
                return await client.get(endpoint, params=params, headers=headers)

        try:
            try:
                res = await _call(settings.VERIFY_SSL)
            except (httpx.ConnectError, ssl.SSLCertVerificationError):
                res = await _call(False)

            if res.status_code == 200:
                data = res.json()
                raw_items = data.get("list", data if isinstance(data, list) else [])
                ids = []
                for item in raw_items:
                    if isinstance(item, dict):
                        ids.append(item.get("id") or item.get("ironcladId"))
                    else:
                        ids.append(str(item))
                logger.info(f"Retrieved {len(ids)} record IDs from Ironclad GET /records/ids")
                return [i for i in ids if i]
            elif res.status_code == 401:
                self.token_manager.access_token = None
                res = await _call(settings.VERIFY_SSL)
                if res.status_code == 200:
                    data = res.json()
                    raw_items = data.get("list", data if isinstance(data, list) else [])
                    return [item["id"] if isinstance(item, dict) and "id" in item else str(item) for item in raw_items]
            logger.error(f"Ironclad GET /records/ids returned HTTP {res.status_code}: {res.text}")
            return []
        except Exception as exc:
            logger.error(f"Error connecting to Ironclad GET /records/ids: {exc}", exc_info=True)
            return []

    # -------------------------------------------------------------------------
    # 2. Retrieve a Record: GET /records/{id} or GET /records?id={id}
    # -------------------------------------------------------------------------
    async def fetch_record_by_id(self, record_id: str, user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.token_manager.has_credentials():
            return None

        async def _call(url: str, params: Optional[Dict[str, Any]] = None, verify_ssl: bool = True):
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=15.0, verify=verify_ssl) as client:
                return await client.get(url, params=params, headers=headers)

        endpoints_to_try = [
            (f"{self.api_root}/records/{record_id}", None),
            (f"{self.api_root}/records", {"id": record_id})
        ]

        for url, params in endpoints_to_try:
            try:
                try:
                    res = await _call(url, params, settings.VERIFY_SSL)
                except (httpx.ConnectError, ssl.SSLCertVerificationError):
                    res = await _call(url, params, False)

                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, dict) and "list" in data and isinstance(data["list"], list) and len(data["list"]) > 0:
                        return self.normalize_record(data["list"][0])
                    elif isinstance(data, list) and len(data) > 0:
                        return self.normalize_record(data[0])
                    elif isinstance(data, dict) and ("id" in data or "ironcladId" in data):
                        return self.normalize_record(data)
                elif res.status_code == 401:
                    self.token_manager.access_token = None
                    retry_res = await _call(url, params, False)
                    if retry_res.status_code == 200:
                        data = retry_res.json()
                        item = data["list"][0] if (isinstance(data, dict) and "list" in data and data["list"]) else data
                        return self.normalize_record(item)
            except Exception as exc:
                logger.debug(f"Attempt for {url} encountered: {exc}")
                continue

        logger.warning(f"Could not retrieve record '{record_id}' from Ironclad.")
        return None

    # -------------------------------------------------------------------------
    # -------------------------------------------------------------------------
    # 2b. Attachment Streaming Gateway (Option 1: Secure Server-Side Proxy)
    # -------------------------------------------------------------------------
    async def get_attachment_stream(self, record_id: str, attachment_key: str, user_email: Optional[str] = None):
        """
        Fetches an attachment directly from the Ironclad API using authenticated OAuth token.
        Streams binary data back to the client so that users can view and download documents
        without raw 401 unauthorized errors.
        Returns: (bytes_content, content_type, filename)
        """
        if not self.token_manager.has_credentials():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Ironclad OAuth credentials are not configured on the server."
            )

        headers = await self._get_auth_headers(user_email=user_email)
        if attachment_key.startswith("http"):
            url = attachment_key
        else:
            url = f"{self.api_root}/records/{record_id}/attachments/{attachment_key}"

        async def _download_call(verify_ssl: bool = True):
            async with httpx.AsyncClient(timeout=45.0, verify=verify_ssl, follow_redirects=True) as client:
                return await client.get(url, headers=headers)

        try:
            try:
                res = await _download_call(settings.VERIFY_SSL)
            except (httpx.ConnectError, ssl.SSLCertVerificationError):
                res = await _download_call(False)

            if res.status_code == 401:
                # Token expired, invalidate and retry once
                self.token_manager.access_token = None
                headers = await self._get_auth_headers(user_email=user_email)
                res = await _download_call(False)

            if res.status_code != 200:
                logger.error(f"Ironclad attachment download failed: HTTP {res.status_code} for {url}")
                raise HTTPException(
                    status_code=res.status_code if res.status_code in (403, 404) else status.HTTP_502_BAD_GATEWAY,
                    detail=f"Unable to retrieve attachment from Ironclad API (Status: {res.status_code})."
                )

            content_type = res.headers.get("content-type") or "application/pdf"
            cd = res.headers.get("content-disposition", "")
            filename = f"contract_{record_id}_{attachment_key}.pdf"
            if "filename=" in cd:
                import re
                m = re.search(r'filename="?([^";]+)"?', cd)
                if m:
                    filename = m.group(1).strip()

            return res.content, content_type, filename
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Error streaming attachment {attachment_key} for record {record_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to stream attachment: {str(exc)}"
            )

    # 3. Retrieve All Allowed Whitelisted Records (Filtered to the 3 types)
    # -------------------------------------------------------------------------
    async def fetch_allowed_contracts(
        self,
        search: Optional[str] = None,
        user_email: Optional[str] = None,
        record_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches contracts for the allowed types:
        - propertyServiceContractBh
        - purchaseSaleAgreementBh
        - generalServicesAgreementBh
        Respects granular document-type authorization passed via record_types.
        """
        if not self.token_manager.has_credentials():
            return []

        if record_types is not None and len(record_types) == 0:
            return []

        target_types = record_types if record_types is not None else [
            "propertyServiceContractBh",
            "purchaseSaleAgreementBh",
            "generalServicesAgreementBh"
        ]
        target_types_set = set(target_types)
        for t in list(target_types):
            disp = TYPE_DISPLAY_NAMES.get(t)
            if disp:
                target_types_set.add(disp)

        types_param = ",".join(target_types)

        # Attempt batch records list
        batch_endpoint = f"{self.api_root}/records"
        batch_params: Dict[str, Any] = {
            "types": types_param,
            "pageSize": 100
        }
        if search:
            batch_params["search"] = search[:1000]

        async def _call_batch(verify_ssl: bool):
            headers = await self._get_auth_headers(user_email=user_email)
            async with httpx.AsyncClient(timeout=20.0, verify=verify_ssl) as client:
                return await client.get(batch_endpoint, params=batch_params, headers=headers)

        allowed_contracts: List[Dict[str, Any]] = []
        try:
            try:
                res = await _call_batch(settings.VERIFY_SSL)
            except (httpx.ConnectError, ssl.SSLCertVerificationError):
                res = await _call_batch(False)

            if res.status_code == 200:
                data = res.json()
                raw_list = data.get("list", data if isinstance(data, list) else [])
                if raw_list and isinstance(raw_list[0], dict) and ("properties" in raw_list[0] or "type" in raw_list[0]):
                    for item in raw_list:
                        rec = self.normalize_record(item)
                        if rec and (rec.get("type") in target_types_set or rec.get("record_type") in target_types_set):
                            allowed_contracts.append(rec)
                    if allowed_contracts:
                        allowed_contracts.sort(key=lambda x: x.get("last_synced_date") or x.get("last_updated") or "", reverse=True)
                        return allowed_contracts
        except Exception as exc:
            logger.info(f"Batch GET /records attempt bypassed: {exc}")

        # Fallback to fetching IDs and normalizing individually
        record_ids = await self.fetch_record_ids(search=search, user_email=user_email, record_types=target_types)
        for r_id in record_ids:
            record = await self.fetch_record_by_id(r_id, user_email=user_email)
            if record and (record.get("type") in target_types_set or record.get("record_type") in target_types_set):
                allowed_contracts.append(record)

        allowed_contracts.sort(key=lambda x: x.get("last_synced_date") or x.get("last_updated") or "", reverse=True)
        return allowed_contracts

    # -------------------------------------------------------------------------
    # 4. Check Notifications for Newly Arrived Agreements
    # -------------------------------------------------------------------------
    async def check_new_agreements(self, since_iso: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
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
            date_field = c.get("last_synced_date") or c.get("last_updated")
            if date_field:
                try:
                    sync_dt = datetime.fromisoformat(str(date_field).replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    pass
            if sync_dt and sync_dt > cutoff:
                new_items.append({
                    "id": c["id"],
                    "title": c["name"] or c["title"],
                    "record_type": c["type_display_name"] or c["type"],
                    "counterparty_name": c["counterparty_name"],
                    "contract_value": c.get("contract_value", 0.0),
                    "status": c.get("status", "active"),
                    "arrived_at": date_field
                })
        return new_items

    # -------------------------------------------------------------------------
    # 5. Record Normalization (Handles dynamic Postman schema with direct href)
    # -------------------------------------------------------------------------
    def normalize_record(self, raw_item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not raw_item or not isinstance(raw_item, dict):
            return None

        record_uuid = str(raw_item.get("id") or "")
        ironclad_id = str(raw_item.get("ironcladId") or record_uuid)
        type_key = str(raw_item.get("type") or "generalServicesAgreementBh")
        type_display_name = str(raw_item.get("typeDisplayName") or TYPE_DISPLAY_NAMES.get(type_key, type_key))
        name = raw_item.get("name") or raw_item.get("title") or f"{type_display_name} - {ironclad_id}"
        last_updated = raw_item.get("lastUpdated") or raw_item.get("updatedAt")

        # Parse properties map
        raw_properties = raw_item.get("properties", {})
        clean_properties: Dict[str, Any] = {}
        if isinstance(raw_properties, dict):
            for k, v in raw_properties.items():
                if isinstance(v, dict) and "value" in v:
                    clean_properties[k] = v["value"]
                else:
                    clean_properties[k] = v

        def get_prop(key: str, default: Any = None) -> Any:
            return clean_properties.get(key, default)

        # Counterparty
        counterparty = get_prop("counterpartyName") or raw_item.get("counterparty_name") or "Counterparty"
        if isinstance(counterparty, dict):
            counterparty = counterparty.get("name", "Counterparty")

        # Contract value
        val_obj = get_prop("totalContractValue")
        if val_obj is not None:
            if isinstance(val_obj, dict):
                contract_val = float(val_obj.get("amount", 0.0))
                currency = val_obj.get("currency", "USD")
            else:
                try:
                    contract_val = float(val_obj)
                except (ValueError, TypeError):
                    contract_val = 0.0
                currency = "USD"
        else:
            contract_val = float(raw_item.get("contract_value", 0.0))
            currency = raw_item.get("currency", "USD")

        # Dates
        effective_date = get_prop("effectiveDate") or get_prop("startDate")
        expiration_date = get_prop("expirationDate") or get_prop("terminationDate") or get_prop("completionDate")
        agreement_date = get_prop("agreementDate") or effective_date
        termination_date = get_prop("terminationDate")

        # Contract Status
        cs = raw_item.get("contractStatus", {})
        if isinstance(cs, dict):
            status_val = cs.get("status") or raw_item.get("status") or "active"
            enhanced_status = cs.get("enhancedStatus")
            status_message = cs.get("message")
            remaining_duration = cs.get("remainingDuration")
            event_date = cs.get("eventDate")
        else:
            status_val = raw_item.get("status") or "active"
            enhanced_status = None
            status_message = None
            remaining_duration = None
            event_date = None

        # Terms and Renewal Properties
        renewal_type = get_prop("standard_renewalType") or get_prop("otherRenewalType")
        initial_term_length = get_prop("standard_initialTermLength")
        renewal_term_length = get_prop("standard_renewalTermLength")
        renewal_opt_out_date = get_prop("standard_renewalOptOutDate")
        renewal_opt_out_period = get_prop("standard_renewalOptOutPeriod")
        termination_notice_period = get_prop("standard_terminationNoticePeriod")
        times_renewed = get_prop("standard_timesRenewed")

        # Specific Entity & Property values
        property_id = get_prop("propertyIdBh")
        community_name = get_prop("communityNameBh")
        contracting_entity = get_prop("contractingEntityBh")
        agreement_type = get_prop("serviceContractAgreementTypeBh") or get_prop("agreementType")

        # Attachments map parsing: Preserving original direct Ironclad href
        raw_attachments = raw_item.get("attachments", {})
        clean_attachments = []

        if isinstance(raw_attachments, dict):
            for att_key, att_data in raw_attachments.items():
                if isinstance(att_data, dict):
                    fn = att_data.get("filename") or f"{name}.pdf"
                    ct = att_data.get("contentType") or "application/pdf"
                    direct_href = att_data.get("href") or att_data.get("url") or ""
                    clean_attachments.append({
                        "id": str(att_key),
                        "key": str(att_key),
                        "name": fn,
                        "filename": fn,
                        "content_type": ct,
                        "file_size": att_data.get("fileSize", 0),
                        "file_hash": att_data.get("fileHash"),
                        "hash_algorithm": att_data.get("hashAlgorithm", "sha256"),
                        "href": direct_href,
                        "url": direct_href,
                        "view_url": direct_href,
                        "download_url": direct_href,
                        "can_view": True,
                        "can_download": True
                    })
        elif isinstance(raw_attachments, list):
            for idx, att in enumerate(raw_attachments):
                if isinstance(att, dict):
                    fn = att.get("name") or att.get("filename") or f"Document_{idx+1}.pdf"
                    key = att.get("key") or str(idx+1)
                    direct_href = att.get("href") or att.get("url") or ""
                    clean_attachments.append({
                        "id": key,
                        "key": key,
                        "name": fn,
                        "filename": fn,
                        "content_type": att.get("contentType", "application/pdf"),
                        "file_size": att.get("fileSize", 0),
                        "file_hash": att.get("fileHash"),
                        "hash_algorithm": att.get("hashAlgorithm", "sha256"),
                        "href": direct_href,
                        "url": direct_href,
                        "view_url": direct_href,
                        "download_url": direct_href,
                        "can_view": True,
                        "can_download": True
                    })

        return {
            "id": record_uuid,
            "ironclad_id": ironclad_id,
            "name": name,
            "title": name,
            "type": type_key,
            "type_display_name": type_display_name,
            "record_type": type_display_name,
            "template_name": type_display_name,
            "status": status_val,
            "enhanced_status": enhanced_status,
            "status_message": status_message,
            "remaining_duration": remaining_duration,
            "event_date": event_date,
            "counterparty_name": str(counterparty),
            "contracting_entity": contracting_entity,
            "community_name": community_name,
            "property_id": property_id,
            "agreement_type": agreement_type,
            "agreement_date": agreement_date,
            "effective_date": effective_date,
            "expiration_date": expiration_date,
            "termination_date": termination_date,
            "renewal_type": renewal_type,
            "initial_term_length": initial_term_length,
            "renewal_term_length": renewal_term_length,
            "renewal_opt_out_date": renewal_opt_out_date,
            "renewal_opt_out_period": renewal_opt_out_period,
            "termination_notice_period": termination_notice_period,
            "times_renewed": times_renewed,
            "start_date": effective_date,
            "completion_date": expiration_date,
            "last_synced_date": last_updated or datetime.utcnow().isoformat(),
            "last_updated": last_updated,
            "creator_email": get_prop("creatorEmail", "legal@company.com"),
            "department": get_prop("department", "Operations"),
            "contract_value": contract_val,
            "currency": currency,
            "attachment_count": len(clean_attachments),
            "has_attachments": len(clean_attachments) > 0,
            "properties": clean_properties,
            "attributes": clean_properties,
            "attachments": clean_attachments
        }

ironclad_service = IroncladService()
