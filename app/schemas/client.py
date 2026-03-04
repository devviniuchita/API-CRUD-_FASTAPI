# stdlib
import re

from datetime import datetime
from typing import Annotated
from typing import Optional
from zoneinfo import ZoneInfo

# third-party
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field
from pydantic import field_serializer
from pydantic import field_validator


# ── Example constants (avoids duplicate literals flagged by linters) ──────────
_EX_NAME = "João Silva"
_EX_EMAIL = "joao.silva@email.com"
_EX_CPF = "123.456.789-09"
_EX_CNPJ = "12.345.678/0001-95"
_EX_ID = "60b8d295f1d2c3e4a5b6c7d8"
_EX_NAME_UPDATE = "Maria Souza"
_EX_EMAIL_UPDATE = "maria.souza@email.com"


# ── ClientCreate ──────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": _EX_NAME},
    )
    email: EmailStr = Field(
        ...,
        json_schema_extra={"example": _EX_EMAIL},
    )
    document: str = Field(
        ...,
        description="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)",
        json_schema_extra={"example": _EX_CPF},
    )

    @field_validator("document")
    @classmethod
    def validate_document_format(cls, v: str) -> str:
        cpf_pattern = r"^\d{3}\.\d{3}\.\d{3}-\d{2}$"
        cnpj_pattern = r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$"
        if not (re.match(cpf_pattern, v) or re.match(cnpj_pattern, v)):
            raise ValueError(
                "Formato inválido. Use CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)"
            )
        return v


# ── ClientUpdate ──────────────────────────────────────────────
class ClientUpdate(BaseModel):
    name: Annotated[
        Optional[str],
        Field(
            min_length=2, max_length=100, json_schema_extra={"example": _EX_NAME_UPDATE}
        ),
    ] = None
    email: Annotated[
        Optional[EmailStr],
        Field(json_schema_extra={"example": _EX_EMAIL_UPDATE}),
    ] = None
    document: Annotated[
        Optional[str],
        Field(
            description="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)",
            json_schema_extra={"example": _EX_CNPJ},
        ),
    ] = None

    @field_validator("document", mode="before")
    @classmethod
    def validate_document_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cpf_pattern = r"^\d{3}\.\d{3}\.\d{3}-\d{2}$"
        cnpj_pattern = r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$"
        if not (re.match(cpf_pattern, v) or re.match(cnpj_pattern, v)):
            raise ValueError(
                "Formato inválido. Use CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)"
            )
        return v


# ── Timezone ──────────────────────────────────────────────────
_BR_TZ = ZoneInfo("America/Sao_Paulo")


# ── ClientResponse ────────────────────────────────────────────
class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., json_schema_extra={"example": _EX_ID})
    name: str = Field(..., json_schema_extra={"example": _EX_NAME})
    email: str = Field(..., json_schema_extra={"example": _EX_EMAIL})
    document: str = Field(..., json_schema_extra={"example": _EX_CPF})
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_to_br(self, value: datetime, _info: object) -> str:
        if value.tzinfo is not None:
            value = value.astimezone(_BR_TZ)
        return value.strftime("%Y-%m-%dT%H:%M:%S")
