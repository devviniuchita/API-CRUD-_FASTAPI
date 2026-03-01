# stdlib
import logging

# third-party
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, IndexModel

# local
from app.core.config import settings

logger = logging.getLogger(__name__)

# Module-level singletons — populated by connect_to_mongo()
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Open the Motor client and create unique indexes on the clients collection."""
    global _client, _db

    logger.info("Connecting to MongoDB at %s …", settings.MONGO_URI)
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.DB_NAME]

    await _create_indexes()
    logger.info("Connected to MongoDB — database: %s", settings.DB_NAME)


async def _create_indexes() -> None:
    """Create unique indexes for email and document fields in the clients collection."""
    collection = _db["clients"]

    indexes = [
        IndexModel([("email", ASCENDING)], unique=True, name="unique_email"),
        IndexModel([("document", ASCENDING)], unique=True, name="unique_document"),
    ]

    await collection.create_indexes(indexes)
    logger.info("Unique indexes ensured: email, document")


async def close_mongo_connection() -> None:
    """Close the Motor client gracefully."""
    global _client, _db

    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency-injection helper.
    Returns the active database instance.
    Raises RuntimeError if called before connect_to_mongo().
    """
    if _db is None:
        raise RuntimeError("Database not initialised. Call connect_to_mongo() first.")
    return _db
