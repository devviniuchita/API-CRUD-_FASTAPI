# Arquitetura do Projeto — Clients API

## Visão Geral

API RESTful construída em **FastAPI + MongoDB (Motor)**, organizada em **arquitetura em camadas estrita** com separação total de responsabilidades. Cada camada conhece apenas a imediatamente abaixo dela — nenhuma query de banco existe fora do `Repository`, nenhuma regra de negócio existe fora do `Service`.

---

## Fluxo de uma Requisição

```
Cliente HTTP
    │
    ▼
┌─────────────────────────────────────────────────┐
│  MIDDLEWARE LAYER  (app/core/logging.py)        │
│  CORSMiddleware + RequestLoggingMiddleware      │
│  → JSON estruturado: request_id, client_ip,    │
│    http_method, http_path, status, duration_ms  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  ROUTER  (app/api/routes/clients.py)            │
│  FastAPI APIRouter — valida payload via Pydantic│
│  → injeta ClientService via Depends()           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  SERVICE  (app/services/client_service.py)      │
│  Regras de negócio: validação de ObjectId,      │
│  injeção de timestamps (created_at/updated_at), │
│  captura de DuplicateFieldError → HTTP 409,     │
│  captura de ID inválido → HTTP 400/404          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  REPOSITORY  (app/repositories/client_repo.py)  │
│  Acesso direto ao MongoDB via Motor (async).    │
│  Converte _id (ObjectId) → id (str) em todos    │
│  os retornos. Lança DuplicateFieldError em      │
│  violação de índice único (código 11000).       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  DATABASE  (app/db/mongo.py)                    │
│  Motor AsyncIOMotorClient — singleton gerenciado│
│  pelo lifespan do FastAPI. Cria índices únicos  │
│  em email e document na inicialização.          │
└─────────────────────────────────────────────────┘
```

---

## Camadas em Detalhe

### `app/main.py` — Bootstrap

Ponto de entrada da aplicação. Instancia o `FastAPI` com metadados `OpenAPI`, registra os `middlewares (CORS e logging)`, o handler global de exceções HTTP e o router de clientes. Usa o padrão `lifespan` (context manager assíncrono) para gerenciar o ciclo de vida da conexão com o MongoDB — abrindo na startup e fechando no shutdown de forma garantida.

### `app/core/config.py` — Configuração

`Pydantic BaseSettings` lendo variáveis de ambiente (`MONGO_URI`, `DB_NAME`, `LOG_LEVEL`). Zero credenciais hardcoded. Valores padrão via `.env` ou variáveis do container Docker.

### `app/core/logging.py` — Middleware de Logging

Dois componentes: `JSONFormatter` (formata todo log da aplicação como JSON single-line, via stdlib puro) e `RequestLoggingMiddleware` (`BaseHTTPMiddleware` que gera um `request_id` UUID por requisição via `ContextVar`, expõe-o no header `X-Request-ID`, e loga `client_ip`, `http_method`, `http_path`, `http_status` e `duration_ms` como campos estruturados). Log duplicado do uvicorn suprimido via `dictConfig`.

### `app/db/mongo.py` — Conexão com MongoDB

Gerencia o singleton `AsyncIOMotorClient`. Na inicialização, além de abrir a conexão, cria programaticamente os **índices únicos** (`unique_email`, `unique_document`) na coleção `clients` — garantindo integridade no nível do banco, independente da camada de aplicação.

### `app/schemas/client.py` — Contratos de Dados (Pydantic V2)

- `ClientCreate`: validação de entrada com `@field_validator` para CPF/CNPJ via regex
- `ClientUpdate`: todos os campos `Optional` — habilita `model_dump(exclude_unset=True)` para PATCH semântico
- `ClientResponse`: serialização de saída, `id` como string, `ConfigDict(from_attributes=True)`

### `app/repositories/client_repo.py` — Acesso a Dados

Interface com o MongoDB. Define um `Protocol` (`AsyncCollection`) que tanto `AsyncIOMotorCollection` (produção) quanto `AsyncMongoMockCollection` (testes) satisfazem — **desacoplamento estrutural sem herança**. Toda conversão `ObjectId → str` acontece exclusivamente aqui, via `_serialize()`. Erros de chave duplicada (código `11000`) são capturados e reemitidos como `DuplicateFieldError` com o campo conflitante identificado.

### `app/services/client_service.py` — Lógica de Negócio

Única camada que conhece `HTTPException`. Valida `ObjectId` antes de qualquer operação (`bson.ObjectId.is_valid`), injeta `datetime.now(timezone.utc)` nos campos de auditoria e traduz exceções de domínio (`DuplicateFieldError`) em respostas HTTP semânticas (`409 Conflict`). O PUT preserva `created_at` do documento original. Emite eventos de log `INFO` para todas as operações de mutação (`create`, `update`, `patch`, `delete`) com o `client_id` afetado.

### `app/api/routes/clients.py` — Endpoints HTTP

`APIRouter` com prefix `/clients`. Cada rota declara `response_model`, `status_code`, `summary` e `responses` com todos os status codes de erro possíveis — Swagger totalmente funcional como ferramenta de teste. A injeção de `ClientService` ocorre via `Depends(get_client_service)`, que constrói `Repository → Service` a partir da conexão ativa.

---

## Padrões e Decisões Técnicas

| Decisão                           | Justificativa                                                              |
| --------------------------------- | -------------------------------------------------------------------------- |
| `motor` (async MongoDB)           | Não bloqueia o event loop do FastAPI em operações de I/O                   |
| Índices únicos no banco           | Integridade garantida mesmo com acesso direto ao MongoDB                   |
| `Protocol` em vez de herança      | Repository testável com mock sem importar dependências de produção         |
| `exclude_unset=True` no PATCH     | Apenas campos explicitamente enviados são atualizados                      |
| `lifespan` no FastAPI             | Garante fechamento da conexão mesmo em shutdown abrupto                    |
| `DuplicateFieldError` customizada | Desacopla o Repository do HTTP — nenhum `HTTPException` na camada de dados |

---

## Erros HTTP Mapeados

| Código | Cenário                                                                   |
| ------ | ------------------------------------------------------------------------- |
| `400`  | `id` não é um ObjectId hexadecimal válido (24 chars)                      |
| `404`  | Documento não encontrado no banco                                         |
| `409`  | Violação de índice único (`email` ou `document` já cadastrado)            |
| `422`  | Payload inválido pelo Pydantic (tipo, formato, campo obrigatório ausente) |

---

## Estrutura de Pastas

```
├── 📁 app
│   ├── 📁 api
│   │   └── 📁 routes
│   │       └── 🔹 clients.py
│   ├── 📁 core
│   │   ├── 🔹 config.py
│   │   └── 🔹 logging.py
│   ├── 📁 db
│   │   └── 🔹 mongo.py
│   ├── 📁 repositories
│   │   └── 🔹 client_repo.py
│   ├── 📁 schemas
│   │   └── 🔹 client.py
│   ├── 📁 services
│   │   └── 🔹 client_service.py
│   ├── 📁 static
│   │   └── ⚡ redoc.standalone.js
│   └── 🔹 main.py
├── 📁 images
│   ├── 🖼️ fastapi_clients_architecture.svg
│   ├── 🖼️ spec_driven_dev.svg
│   └── 🖼️ swagger_ui.png
├── 📁 postman
│   └── ⚙️ clients-api-tests.postman_collection.json
├── 📁 tests
│   ├── 📝 TUTORIAL_TESTS.md
│   ├── 🔹 conftest.py
│   ├── ⚡ k6-load-test.js
│   ├── 🔷 test-mongo-offline.ps1
│   └── 🔹 test_client_service.py
├── 🐳 .dockerignore
├── ⚙️ .gitignore
├── 🐳 Dockerfile
├── 📝 README.md
├── 🐳 docker-compose.yml
├── ⚙️ pyproject.toml
└── 📄 requirements.txt
```

---
