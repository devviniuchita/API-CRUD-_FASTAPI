# stdlib
import pytest

# third-party
from fastapi import HTTPException

# local
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.client_service import ClientService


# ── Helpers ───────────────────────────────────────────────────
def _make_payload(**overrides) -> ClientCreate:
    defaults = {
        "name": "João Silva",
        "email": "joao.silva@email.com",
        "document": "123.456.789-09",
    }
    defaults.update(overrides)
    return ClientCreate(**defaults)


# ── create_client ─────────────────────────────────────────────
async def test_create_client_success(client_service: ClientService) -> None:
    """create_client: deve retornar o cliente criado com timestamps automáticos."""
    payload = _make_payload()
    result = await client_service.create_client(payload)

    assert result["name"] == payload.name
    assert result["email"] == payload.email
    assert result["document"] == payload.document
    assert "id" in result
    assert result["created_at"] is not None
    assert result["updated_at"] is not None
    assert result["created_at"] == result["updated_at"]


async def test_create_client_duplicate_email_raises_409(
    client_service: ClientService,
) -> None:
    """create_client: deve lançar HTTPException 409 ao tentar duplicar email."""
    payload = _make_payload()
    await client_service.create_client(payload)

    with pytest.raises(HTTPException) as exc_info:
        await client_service.create_client(payload)

    assert exc_info.value.status_code == 409
    assert "email" in exc_info.value.detail


# ── get_client_by_id ──────────────────────────────────────────
async def test_get_client_by_id_invalid_format_raises_400(
    client_service: ClientService,
) -> None:
    """get_client_by_id: deve lançar HTTPException 400 para ObjectId inválido."""
    with pytest.raises(HTTPException) as exc_info:
        await client_service.get_client_by_id("id-invalido")

    assert exc_info.value.status_code == 400


async def test_get_client_by_id_not_found_raises_404(
    client_service: ClientService,
) -> None:
    """get_client_by_id: deve lançar HTTPException 404 para ID inexistente."""
    with pytest.raises(HTTPException) as exc_info:
        await client_service.get_client_by_id("000000000000000000000000")

    assert exc_info.value.status_code == 404


# ── patch_client ──────────────────────────────────────────────
async def test_patch_client_no_fields_raises_422(
    client_service: ClientService,
) -> None:
    """patch_client: deve lançar HTTPException 422 se nenhum campo for enviado."""
    created = await client_service.create_client(_make_payload())
    empty_payload = ClientUpdate()

    with pytest.raises(HTTPException) as exc_info:
        await client_service.patch_client(created["id"], empty_payload)

    assert exc_info.value.status_code == 422


# ── delete_client ─────────────────────────────────────────────
async def test_delete_client_not_found_raises_404(
    client_service: ClientService,
) -> None:
    """delete_client: deve lançar HTTPException 404 para ID inexistente."""
    with pytest.raises(HTTPException) as exc_info:
        await client_service.delete_client("000000000000000000000000")

    assert exc_info.value.status_code == 404
