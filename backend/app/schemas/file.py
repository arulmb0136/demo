# S3 is not linked - commented out as of now
# from typing import Optional
# from datetime import datetime
# from pydantic import BaseModel
# 
# class DocumentResponse(BaseModel):
#     id: int
#     contract_id: int
#     name: str
#     s3_key: str
#     file_size_bytes: int
#     content_type: str
#     document_url: Optional[str] = None
#     uploaded_at: datetime
# 
#     class Config:
#         from_attributes = True
# 
# class FileUploadResponse(BaseModel):
#     document: DocumentResponse
#     download_url: str
#     message: str
# 
# class PresignedUrlResponse(BaseModel):
#     download_url: str
#     expires_in_seconds: int
