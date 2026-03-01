# stdlib
from typing import Optional

# third-party
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import DuplicateKeyError as MongoDuplicateKeyError
from pymongo.errors import PyMongoError


# ── Custom exception ──────────────────────────────────────────
class DuplicateFieldError(Exception):
    """Raised when a MongoDB unique-index constraint is violated."""

    def __init__(self, field: str) -> None:
        self.field = field
        super().__init__(f"Duplicate value for field: {field}")


# ── Repository ────────────────────────────────────────────────
class ClientRepository:
    def __init__(self, collection: AsyncIOMotorCollection) -> None:
        self.collection = collection

    # ── helpers ───────────────────────────────────────────────
    @staticmethod
    def _serialize(doc: dict) -> dict:
        """Convert MongoDB document: replace _id (ObjectId) with id (str)."""
        doc["id"] = str(doc.pop("_id"))
        return doc

    @staticmethod
    def _extract_duplicate_field(error: PyMongoError) -> str:
        """Parse the duplicate key error to identify which field is duplicated."""
        details = getattr(error, "details", {}) or {}
        key_value: dict = details.get("keyValue", {})
        if key_value:
            return next(iter(key_value))
        # fallback: parse error message for field name
        message = str(error)
        if "email" in message:
            return "email"
        if "document" in message:
            return "document"
        return "unknown"

    # ── CRUD ──────────────────────────────────────────────────
    async def create(self, data: dict) -> dict:
        try:
            result = await self.collection.insert_one(data)
            created = await self.collection.find_one({"_id": result.inserted_id})
            return self._serialize(created)  # type: ignore[arg-type]
        except MongoDuplicateKeyError as exc:
            raise DuplicateFieldError(self._extract_duplicate_field(exc)) from exc

    async def find_all(self) -> list[dict]:
        cursor = self.collection.find({})
        return [self._serialize(doc) async for doc in cursor]

    async def find_by_id(self, id: str) -> Optional[dict]:
        doc = await self.collection.find_one({"_id": ObjectId(id)})
        return self._serialize(doc) if doc else None

    async def update(self, id: str, data: dict) -> Optional[dict]:
        """Full replacement (PUT). Returns updated doc or None if not found."""
        result = await self.collection.replace_one({"_id": ObjectId(id)}, data)
        if result.matched_count == 0:
            return None
        return await self.find_by_id(id)

    async def patch(self, id: str, data: dict) -> Optional[dict]:
        """Partial update (PATCH). Returns updated doc or None if not found."""
        result = await self.collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        if result.matched_count == 0:
            return None
        return await self.find_by_id(id)

    async def delete(self, id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count == 1
