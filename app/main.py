# stdlib
import logging
import logging.config
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# third-party
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# local
from app.core.logging import RequestLoggingMiddleware
from app.db.mongo import close_mongo_connection, connect_to_mongo

# ── Logging configuration ─────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await connect_to_mongo()
    yield
    await close_mongo_connection()


# ── Application factory ───────────────────────────────────────
app = FastAPI(
    title="Clients API",
    description="API RESTful de gerenciamento de clientes — Positivo S+",
    version="1.0.0",
    contact={
        "name": "Cauã Barros",
        "email": "cauabarros.dev@gmail.com",
    },
    lifespan=lifespan,
)

# ── Middlewares ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)


# ── Global HTTP exception handler ────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# ── Routers (registered here — clients router added by Agente 2) ──
# from app.api.routes.clients import router as clients_router
# app.include_router(clients_router)
