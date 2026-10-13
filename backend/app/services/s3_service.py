import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

class S3Service:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.mock_fallback = settings.S3_MOCK_FALLBACK
        self.local_storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
        os.makedirs(self.local_storage_dir, exist_ok=True)

        self.s3_client = None
        try:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL if settings.S3_ENDPOINT_URL else None,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
                use_ssl=settings.S3_USE_SSL
            )
            # Check or create bucket
            self._ensure_bucket_exists()
        except Exception as e:
            logger.warning(f"Could not connect to S3/MinIO ({str(e)}). Local fallback storage will be used.")

    def _ensure_bucket_exists(self):
        if not self.s3_client:
            return
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                logger.info(f"Created S3 bucket: {self.bucket_name}")
            except Exception as e:
                logger.warning(f"Could not create S3 bucket '{self.bucket_name}': {e}")

    def upload_file_bytes(
        self,
        file_bytes: bytes,
        s3_key: str,
        content_type: str = "application/pdf"
    ) -> Tuple[bool, str]:
        """Uploads file bytes to S3 or saves to fallback local directory"""
        if self.s3_client and not self.mock_fallback:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType=content_type
                )
                logger.info(f"Uploaded object to S3: s3://{self.bucket_name}/{s3_key}")
                download_url = self.generate_presigned_download_url(s3_key)
                return True, download_url
            except Exception as e:
                logger.warning(f"S3 put_object failed ({e}). Saving to local disk fallback.")

        # Local storage fallback
        file_path = os.path.join(self.local_storage_dir, os.path.basename(s3_key))
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        logger.info(f"Stored file in local fallback: {file_path}")
        return True, f"/api/v1/files/download-local/{os.path.basename(s3_key)}"

    def generate_presigned_download_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate presigned download URL for S3 object"""
        if self.s3_client and not self.mock_fallback:
            try:
                url = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket_name, "Key": s3_key},
                    ExpiresIn=expires_in
                )
                return url
            except Exception as e:
                logger.warning(f"Failed to generate presigned S3 URL: {e}")

        # Return mock / direct local download path
        return f"/api/v1/files/download-local/{os.path.basename(s3_key)}"

s3_service = S3Service()
