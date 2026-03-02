# stdlib
import json
import logging
import time
import uuid
from contextvars import ContextVar
from datetime import datetime
from datetime import timezone

# third-party
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


# ── Request ID context ────────────────────────────────────────
# Armazena o ID único da requisição corrente por task asyncio.
# Valor padrão "-" cobre logs de startup/shutdown (fora de request).
_request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


# ── Atributos nativos do LogRecord ────────────────────────────
# Nunca incluídos como campos extras no JSON.
_RESERVED: frozenset[str] = frozenset(
    {
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "process",
        "message",
        "taskName",
    }
)


class JSONFormatter(logging.Formatter):
    """Serializa cada LogRecord como um objeto JSON single-line."""

    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()
        log_obj: dict = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "request_id": _request_id_var.get(),
            "message": record.message,
        }
        # Campos extras injetados via extra={} nas chamadas logger.*()
        for key, value in record.__dict__.items():
            if key not in _RESERVED:
                log_obj[key] = value
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj, ensure_ascii=False, default=str)


logger = logging.getLogger("api.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs method, path, status code and response time for every request."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())
        _request_id_var.set(request_id)

        start: float = time.perf_counter()

        response: Response = await call_next(request)

        elapsed_ms: float = (time.perf_counter() - start) * 1000

        response.headers["X-Request-ID"] = request_id

        client_ip: str = request.client.host if request.client else "-"

        logger.info(
            "%s %s → %d",
            request.method,
            request.url.path,
            response.status_code,
            extra={
                "http_method": request.method,
                "http_path": request.url.path,
                "http_status": response.status_code,
                "duration_ms": round(elapsed_ms, 2),
                "client_ip": client_ip,
            },
        )

        return response
