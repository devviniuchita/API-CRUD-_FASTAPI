# stdlib
import re
from datetime import datetime
from typing import Optional

# third-party
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ── ClientCreate ──────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        example="João Silva",
    )
    email: EmailStr = Field(
        ...,
        example="joao.silva@email.com",
    )
    document: str = Field(
        ...,
        example="123.456.789-09",
        description="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)",
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
        example="Maria Souza",
    )
    email: Optional[EmailStr] = Field(
        None,
        example="maria.souza@email.com",
    )
    document: Optional[str] = Field(
        None,
        example="12.345.678/0001-95",
        description="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)",
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

    id: str = Field(
        ...,
        example="60b8d295f1d2c3e4a5b6c7d8",
    )
    name: str = Field(
        ...,
        example="João Silva",
    )
    email: str = Field(
        ...,
        example="joao.silva@email.com",
    )
    document: str = Field(
        ...,
        example="123.456.789-09",
    )
    created_at: datetime
    updated_at: datetime
