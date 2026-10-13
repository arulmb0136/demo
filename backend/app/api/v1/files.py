import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.contract import Contract
from app.schemas.file import DocumentResponse, FileUploadResponse, PresignedUrlResponse
from app.services.s3_service import s3_service
from app.core.logging import logger

router = APIRouter(prefix="/files", tags=["Documents & S3 Storage"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    contract_id: int = Form(...),
    current_user: User = Depends(require_permission("write")),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    file_bytes = await file.read()
    file_size = len(file_bytes)
    safe_filename = file.filename.replace(" ", "_")
    s3_key = f"contracts/{contract_id}/{uuid.uuid4().hex[:8]}_{safe_filename}"

    # Upload to S3 or local fallback
    success, download_url = s3_service.upload_file_bytes(
        file_bytes=file_bytes,
        s3_key=s3_key,
        content_type=file.content_type or "application/octet-stream"
    )

    doc = Document(
        contract_id=contract_id,
        name=file.filename,
        s3_key=s3_key,
        file_size_bytes=file_size,
        content_type=file.content_type or "application/pdf",
        document_url=download_url
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    logger.info(f"User {current_user.email} uploaded document '{file.filename}' for Contract #{contract_id}")

    return FileUploadResponse(
        document=DocumentResponse.from_orm(doc),
        download_url=download_url,
        message=f"File '{file.filename}' uploaded successfully"
    )

@router.get("/{document_id}/download", response_model=PresignedUrlResponse)
def get_document_download_url(
    document_id: int,
    current_user: User = Depends(require_permission("read")),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # If document has direct external URL (from Ironclad)
    if doc.document_url and doc.document_url.startswith("http"):
        return PresignedUrlResponse(download_url=doc.document_url, expires_in_seconds=3600)

    presigned_url = s3_service.generate_presigned_download_url(doc.s3_key)
    return PresignedUrlResponse(download_url=presigned_url, expires_in_seconds=3600)

@router.get("/contract/{contract_id}", response_model=List[DocumentResponse])
def get_contract_documents(
    contract_id: int,
    current_user: User = Depends(require_permission("read")),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.contract_id == contract_id).all()
    return docs

@router.get("/download-local/{filename}")
def download_local_file(filename: str):
    """Fallback endpoint for serving files saved locally"""
    storage_dir = s3_service.local_storage_dir
    file_path = os.path.join(storage_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on local storage")
    return FileResponse(file_path, filename=filename)
