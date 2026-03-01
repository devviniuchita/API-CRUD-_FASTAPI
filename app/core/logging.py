# stdlib
import logging
import time

# third-party
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs method, path, status code and response time for every request."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start: float = time.perf_counter()

        response: Response = await call_next(request)

        elapsed_ms: float = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s → %d  (%.2f ms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )

        return response
