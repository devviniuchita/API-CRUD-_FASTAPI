# third-party
# local
from app.db.mongo import get_database
from app.repositories.client_repo import ClientRepository
from app.schemas.client import ClientCreate
from app.schemas.client import ClientResponse
from app.schemas.client import ClientUpdate
from app.services.client_service import ClientService
from fastapi import APIRouter
from fastapi import Depends
from fastapi import Response
from fastapi import status
from motor.motor_asyncio import AsyncIOMotorDatabase


# ── Dependency factory ────────────────────────────────────────
def get_client_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ClientService:
    repo = ClientRepository(db.get_collection("clients"))
    return ClientService(repo)


# ── Router ────────────────────────────────────────────────────
router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar um novo cliente",
    responses={
        409: {"description": "Email ou documento já cadastrado"},
        422: {"description": "Payload inválido"},
    },
)
async def create_client(
    payload: ClientCreate,
    service: ClientService = Depends(get_client_service),
) -> ClientResponse:
    result = await service.create_client(payload)
    return ClientResponse.model_validate(result)


@router.get(
    "",
    response_model=list[ClientResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar todos os clientes",
)
async def list_clients(
    service: ClientService = Depends(get_client_service),
) -> list[ClientResponse]:
    results = await service.list_clients()
    return [ClientResponse.model_validate(c) for c in results]


@router.get(
    "/{id}",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Buscar cliente por ID",
    responses={
        400: {"description": "ID com formato inválido"},
        404: {"description": "Cliente não encontrado"},
    },
)
async def get_client(
    id: str,
    service: ClientService = Depends(get_client_service),
) -> ClientResponse:
    result = await service.get_client_by_id(id)
    return ClientResponse.model_validate(result)


@router.put(
    "/{id}",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Substituir completamente os dados de um cliente",
    responses={
        400: {"description": "ID com formato inválido"},
        404: {"description": "Cliente não encontrado"},
        409: {"description": "Email ou documento já cadastrado"},
        422: {"description": "Payload inválido"},
    },
)
async def update_client(
    id: str,
    payload: ClientCreate,
    service: ClientService = Depends(get_client_service),
) -> ClientResponse:
    result = await service.update_client(id, payload)
    return ClientResponse.model_validate(result)


@router.patch(
    "/{id}",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar parcialmente os dados de um cliente",
    responses={
        400: {"description": "ID com formato inválido"},
        404: {"description": "Cliente não encontrado"},
        409: {"description": "Email ou documento já cadastrado"},
        422: {"description": "Nenhum campo fornecido ou payload inválido"},
    },
)
async def patch_client(
    id: str,
    payload: ClientUpdate,
    service: ClientService = Depends(get_client_service),
) -> ClientResponse:
    result = await service.patch_client(id, payload)
    return ClientResponse.model_validate(result)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover um cliente",
    responses={
        400: {"description": "ID com formato inválido"},
        404: {"description": "Cliente não encontrado"},
    },
)
async def delete_client(
    id: str,
    service: ClientService = Depends(get_client_service),
) -> Response:
    await service.delete_client(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
