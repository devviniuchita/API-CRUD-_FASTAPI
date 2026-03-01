# stdlib
import re

from datetime import datetime
from typing import Optional

# third-party
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field
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
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": _EX_NAME_UPDATE},
    )
    email: Optional[EmailStr] = Field(
        None,
        json_schema_extra={"example": _EX_EMAIL_UPDATE},
    )
    document: Optional[str] = Field(
        None,
        description="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)",
        json_schema_extra={"example": _EX_CNPJ},
    )

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


# ── ClientResponse ────────────────────────────────────────────
class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., json_schema_extra={"example": _EX_ID})
    name: str = Field(..., json_schema_extra={"example": _EX_NAME})
    email: str = Field(..., json_schema_extra={"example": _EX_EMAIL})
    document: str = Field(..., json_schema_extra={"example": _EX_CPF})
    created_at: datetime
    updated_at: datetime
    name: str = Field(..., json_schema_extra={"example": "João Silva"})
    email: str = Field(..., json_schema_extra={"example": "joao.silva@email.com"})
    document: str = Field(..., json_schema_extra={"example": "123.456.789-09"})
    created_at: datetime
    updated_at: datetime
