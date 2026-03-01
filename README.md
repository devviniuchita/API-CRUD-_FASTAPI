# Clients API

> API RESTful de gerenciamento de clientes — Desafio Técnico Programador Pleno (Positivo S+)

**Stack:** Python 3.12 · FastAPI 0.111 · MongoDB 4.4 · Motor 3.4 · Pydantic V2 · Docker

---

## Como rodar

**Pré-requisito:** Docker e Docker Compose instalados.

```bash
git clone <url-do-repositorio>
cd <diretorio-do-projeto>
docker compose up --build
```

Acesse a documentação interativa em: **http://localhost:8000/docs**

Todas as rotas podem ser testadas diretamente pelo Swagger — sem nenhuma configuração adicional.

---

## Rotas disponíveis

| Método   | Rota              | Descrição                               | Status de sucesso |
|----------|-------------------|-----------------------------------------|-------------------|
| `POST`   | `/clients`        | Criar novo cliente                      | `201 Created`     |
| `GET`    | `/clients`        | Listar todos os clientes                | `200 OK`          |
| `GET`    | `/clients/{id}`   | Buscar cliente por ID                   | `200 OK`          |
| `PUT`    | `/clients/{id}`   | Substituição completa dos dados         | `200 OK`          |
| `PATCH`  | `/clients/{id}`   | Atualização parcial dos campos enviados | `200 OK`          |
| `DELETE` | `/clients/{id}`   | Remover cliente                         | `204 No Content`  |

### Códigos de erro semânticos

| Código | Quando ocorre                                            |
|--------|----------------------------------------------------------|
| `400`  | `{id}` não é um ObjectId hexadecimal de 24 caracteres   |
| `404`  | Cliente não encontrado no banco                          |
| `409`  | `email` ou `document` já cadastrado (índice único)       |
| `422`  | Payload com formato inválido ou PATCH sem campos         |

---

## Modelo de dados

```json
{
  "id":         "60b8d295f1d2c3e4a5b6c7d8",
  "name":       "João Silva",
  "email":      "joao.silva@email.com",
  "document":   "123.456.789-09",
  "created_at": "2026-03-01T10:00:00",
  "updated_at": "2026-03-01T10:00:00"
}
```

**Formatos aceitos para `document`:**

- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`

> Apenas o formato é validado via regex — o dígito verificador não é calculado.

---

## Decisões técnicas

### Arquitetura em camadas

A aplicação segue separação estrita de responsabilidades:

```
Router → Service → Repository → MongoDB
```

- **Router** (`app/api/routes/`): recebe a requisição HTTP, chama o Service, retorna a resposta. Zero lógica de negócio.
- **Service** (`app/services/`): valida ObjectId, injeta timestamps, traduz erros do banco em `HTTPException`.
- **Repository** (`app/repositories/`): executa queries MongoDB, converte `_id` → `id`. Zero lógica de negócio.

### Motor assíncrono

Toda comunicação com o MongoDB usa `motor` (driver 100% assíncrono), garantindo que o event loop do FastAPI nunca bloqueie em operações de I/O.

### Índices únicos no banco

`email` e `document` possuem **Unique Indexes** criados na inicialização da aplicação (`connect_to_mongo()`). Isso garante integridade de dados mesmo sob concorrência — duas requisições simultâneas com o mesmo email não passam pelo índice, independentemente da lógica da aplicação.

### Serialização do ObjectId

O `_id` do MongoDB (tipo `ObjectId`) é sempre convertido para string no campo `id` **dentro do Repository**, nunca expondo `$oid` ou `ObjectId(...)` ao consumidor da API.

### Validação de document

Validação por regex via `@field_validator` no schema Pydantic. Dois padrões aceitos:

- CPF: `^\d{3}\.\d{3}\.\d{3}-\d{2}$`
- CNPJ: `^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$`

### Lifespan (startup/shutdown)

A conexão com o MongoDB é gerenciada pelo `@asynccontextmanager lifespan`, substituindo os eventos depreciados `@app.on_event`. Garante que a API só aceita requisições após a conexão estar estabelecida.

### Docker sem root

O container da API roda com usuário não-root (`appuser`, UID 1001), seguindo o princípio de menor privilégio.

---

## Executar testes

```bash
# Com o ambiente virtual ativado
pip install -r requirements.txt
pytest
```

Os testes unitários usam `mongomock-motor` — nenhuma conexão real com MongoDB é necessária.

---

## Uso de IA

Este projeto foi desenvolvido com auxílio de ferramentas de IA generativa:

- **Claude (Anthropic)** via **Claude Code** — geração, revisão e refatoração de código, análise de compatibilidade de dependências, estruturação da arquitetura em camadas e depuração de comportamento do `mongomock-motor` com índices únicos.

O uso de IA é um requisito explícito do desafio técnico e está declarado conforme solicitado.
