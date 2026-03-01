# third-party
import pytest

# local
from app.repositories.client_repo import ClientRepository
from app.services.client_service import ClientService
from mongomock_motor import AsyncMongoMockClient
from pymongo import ASCENDING
from pymongo import IndexModel


@pytest.fixture
async def client_service() -> ClientService:
    """ClientService backed by an in-memory MongoDB mock with unique indexes."""
    mock_client = AsyncMongoMockClient()
    db = mock_client["test_db"]
    collection = db.get_collection("clients")

    # Mirror the unique indexes created by connect_to_mongo() in production
    await collection.create_indexes(
        [
            IndexModel([("email", ASCENDING)], unique=True, name="unique_email"),
            IndexModel([("document", ASCENDING)], unique=True, name="unique_document"),
        ]
    )

    repo = ClientRepository(collection)
    return ClientService(repo)
