import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import logger, set_correlation_id

class CorrelationIdAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # 1. Extract or generate Correlation ID
        correlation_id = request.headers.get("X-Correlation-ID")
        if not correlation_id:
            correlation_id = str(uuid.uuid4())

        # 2. Store in async ContextVar for this request lifecycle
        set_correlation_id(correlation_id)

        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        logger.info(f"Incoming Request -> {request.method} {request.url.path} (Client: {client_ip})")

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # 3. Inject correlation ID into response headers
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Response-Time-Ms"] = str(duration_ms)

            logger.info(
                f"Completed Request <- {request.method} {request.url.path} - Status: {response.status_code} "
                f"({duration_ms}ms)"
            )
            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Failed Request <- {request.method} {request.url.path} - Exception: {str(exc)} "
                f"({duration_ms}ms)",
                exc_info=True
            )
            raise exc
