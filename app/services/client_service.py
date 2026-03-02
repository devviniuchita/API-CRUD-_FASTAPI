# stdlib
import logging
from datetime import datetime
from datetime import timezone
from typing import NoReturn

# local
from app.repositories.client_repo import ClientRepository
from app.repositories.client_repo import DuplicateFieldError
from app.schemas.client import ClientCreate
from app.schemas.client import ClientUpdate

# third-party
from bson import ObjectId
from fastapi import HTTPException
from fastapi import status

logger = logging.getLogger(__name__)


class ClientService:
    def __init__(self, repo: ClientRepository) -> None:
        self.repo = repo

    # ── helpers ───────────────────────────────────────────────
    @staticmethod
    def _validate_object_id(id: str) -> None:
        if not ObjectId.is_valid(id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid ID: '{id}'. Must be a 24-character hexadecimal ObjectId.",
            )

    @staticmethod
    def _handle_duplicate(exc: DuplicateFieldError) -> NoReturn:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Field '{exc.field}' already registered.",
        )

    # ── CRUD ──────────────────────────────────────────────────
    async def create_client(self, payload: ClientCreate) -> dict:
        now = datetime.now(timezone.utc)
        data = payload.model_dump()
        data["created_at"] = now
        data["updated_at"] = now
        try:
            result = await self.repo.create(data)
        except DuplicateFieldError as exc:
            self._handle_duplicate(exc)
        logger.info("Client created", extra={"client_id": result["id"]})
        return result

    async def list_clients(self) -> list[dict]:
        return await self.repo.find_all()

    async def get_client_by_id(self, id: str) -> dict:
        self._validate_object_id(id)
        client = await self.repo.find_by_id(id)
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client '{id}' not found.",
            )
        return client

    async def update_client(self, id: str, payload: ClientCreate) -> dict:
        """Full replacement (PUT). Preserves created_at from original document."""
        self._validate_object_id(id)
        # Verify existence first
        existing = await self.repo.find_by_id(id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client '{id}' not found.",
            )
        data = payload.model_dump()
        data["created_at"] = existing["created_at"]
        data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = await self.repo.update(id, data)
        except DuplicateFieldError as exc:
            self._handle_duplicate(exc)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client '{id}' not found.",
            )
        logger.info("Client updated", extra={"client_id": id})
        return result

    async def patch_client(self, id: str, payload: ClientUpdate) -> dict:
        """Partial update (PATCH). Only updates fields that were explicitly sent."""
        self._validate_object_id(id)
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No fields provided for update.",
            )
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = await self.repo.patch(id, update_data)
        except DuplicateFieldError as exc:
            self._handle_duplicate(exc)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client '{id}' not found.",
            )
        logger.info("Client patched", extra={"client_id": id})
        return result

    async def delete_client(self, id: str) -> None:
        self._validate_object_id(id)
        deleted = await self.repo.delete(id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client '{id}' not found.",
            )
        logger.info("Client deleted", extra={"client_id": id})
