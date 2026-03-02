# stdlib
import logging
import logging.config

from contextlib import asynccontextmanager
from typing import AsyncGenerator

# local
from app.core.config import settings
from app.core.logging import RequestLoggingMiddleware
from app.db.mongo import close_mongo_connection
from app.db.mongo import connect_to_mongo
from app.db.mongo import get_database

# third-party
from fastapi import Depends
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError
from pymongo.errors import ServerSelectionTimeoutError


# ── Logging configuration ─────────────────────────────────────
logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {"()": "app.core.logging.JSONFormatter"},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "stream": "ext://sys.stderr",
            },
        },
        "loggers": {
            # Uvicorn already logs each request; our middleware duplicates that.
            # Suppress uvicorn's access log to keep output clean.
            "uvicorn.access": {"level": "WARNING", "propagate": False},
        },
        "root": {"level": settings.LOG_LEVEL, "handlers": ["console"]},
    }
)

logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await connect_to_mongo()
    yield
    close_mongo_connection()


# ── Application factory ───────────────────────────────────────
app = FastAPI(
    title="Clients API",
    description="API RESTful de gerenciamento de clientes — Positivo S+",
    version="1.0.0",
    contact={
        "name": "Vinícius Vieira",
        "url": "https://github.com/devviniuchita",
    },
    lifespan=lifespan,
    redoc_url=None,  # desativado: servido localmente via rota customizada
)

# ── Middlewares (added in reverse execution order: last added = first executed) ──
# RequestLoggingMiddleware runs first on request, last on response
# CORSMiddleware must be last in add_middleware chain (outermost layer)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global HTTP exception handler ────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(ServerSelectionTimeoutError)
async def mongo_timeout_handler(
    request: Request, exc: ServerSelectionTimeoutError
) -> JSONResponse:
    logger.error("MongoDB unreachable: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=503,
        content={"detail": "Service temporarily unavailable. Database is unreachable."},
    )


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    logger.error("MongoDB error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=503,
        content={"detail": "Service temporarily unavailable. Database error."},
    )


# ── Static files (ReDoc bundle offline) ───────────────────────
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ── ReDoc (bundle servido localmente — sem dependência de CDN) ─
@app.get("/redoc", include_in_schema=False)
async def redoc_html() -> HTMLResponse:
    return get_redoc_html(
        openapi_url="/openapi.json",
        title="Clients API — ReDoc",
        redoc_js_url="/static/redoc.standalone.js",
    )


# ── Health check ──────────────────────────────────────────────
@app.get(
    "/health",
    tags=["Health"],
    summary="Verificar saúde da API e conectividade com o banco de dados",
    responses={
        200: {"description": "API e banco de dados operacionais"},
        503: {"description": "Banco de dados inacessível"},
    },
)
async def health_check(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> JSONResponse:
    try:
        await db.command("ping")
        return JSONResponse(
            status_code=200,
            content={"status": "ok", "database": "ok"},
        )
    except Exception as exc:
        logger.warning("Health check — MongoDB unreachable: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unreachable"},
        )


# ── Routers ───────────────────────────────────────────────────
from app.api.routes.clients import router as clients_router


app.include_router(clients_router)
