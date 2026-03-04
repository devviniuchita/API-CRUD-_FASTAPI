<div align="center">

# ⚡ Quick Start — Backend (API FastAPI)

**Do zero ao Swagger UI em menos de 2 minutos**

</div>

---

## 🐳 Opção 1 — Docker (Recomendado)

> A forma mais rápida. Não precisa instalar Python nem MongoDB.

### Pré-requisito

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/devviniuchita/clients_api.git
cd clients_api

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env          # Linux / macOS
copy .env.example .env        # Windows CMD
Copy-Item .env.example .env   # Windows PowerShell

# 3. Suba tudo com um comando
docker compose up --build
```

### Pronto! Acesse:

| Serviço      | URL                                                   |
| ------------ | ----------------------------------------------------- |
| Swagger UI   | [localhost:8000/docs](http://localhost:8000/docs)     |
| ReDoc        | [localhost:8000/redoc](http://localhost:8000/redoc)   |
| Health Check | [localhost:8000/health](http://localhost:8000/health) |

> Aguarde a mensagem `Application startup complete.` nos logs antes de acessar.

### Comandos úteis

```bash
# Rodar em background
docker compose up -d --build

# Ver logs em tempo real
docker compose logs -f api

# Parar tudo (mantém dados do MongoDB)
docker compose down

# Parar e limpar volumes (apaga dados)
docker compose down -v
```

---

## 🐍 Opção 2 — Python Local (venv)

> Para quem quer editar código com hot reload.

### Pré-requisitos

| Ferramenta | Versão | Verificar com          |
| ---------- | ------ | ---------------------- |
| Python     | 3.12+  | `python --version`     |
| pip        | 24+    | `pip --version`        |
| MongoDB    | 4.4+   | Rodando na porta 27017 |

> **Dica:** Se não quer instalar o MongoDB, use a [Opção 1 (Docker)](#-opção-1--docker-recomendado) — ela já inclui o MongoDB automaticamente.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/devviniuchita/clients_api.git
cd clients_api

# 2. Crie e ative o ambiente virtual
python -m venv .venv

# Windows CMD / PowerShell:
.venv\Scripts\activate

# Linux / macOS:
# source .venv/bin/activate

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure o .env para MongoDB local
cp .env.example .env
# Edite o .env e altere:
# MONGO_URI=mongodb://localhost:27017
```

```bash
# 5. Inicie a API com hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Pronto! Mesmos endpoints da Opção 1.

---

## 🧪 Testes

```bash
# Testes unitários (não precisa de MongoDB rodando)
pytest

# Com saída detalhada
pytest -v --tb=short
```

> Os testes usam `mongomock-motor` — um MongoDB em memória.

---

## 📡 Endpoints da API

| Método   | Rota            | Descrição                   | Status |
| -------- | --------------- | --------------------------- | ------ |
| `GET`    | `/health`       | Health check + MongoDB      | `200`  |
| `POST`   | `/clients`      | Criar cliente               | `201`  |
| `GET`    | `/clients`      | Listar todos                | `200`  |
| `GET`    | `/clients/{id}` | Buscar por ID               | `200`  |
| `PUT`    | `/clients/{id}` | Substituir (todos campos)   | `200`  |
| `PATCH`  | `/clients/{id}` | Atualizar (campos parciais) | `200`  |
| `DELETE` | `/clients/{id}` | Remover                     | `204`  |

### Exemplo de cliente (JSON)

```json
{
  "id": "60b8d295f1d2c3e4a5b6c7d8",
  "name": "João Silva",
  "email": "joao.silva@email.com",
  "document": "123.456.789-09",
  "created_at": "2026-03-01T10:00:00",
  "updated_at": "2026-03-01T10:00:00"
}
```

---

## 🔧 Variáveis de Ambiente

| Variável    | Padrão                    | Descrição                         |
| ----------- | ------------------------- | --------------------------------- |
| `MONGO_URI` | `mongodb://mongodb:27017` | Conexão MongoDB (Docker)          |
| `DB_NAME`   | `clients_db`              | Nome do banco                     |
| `LOG_LEVEL` | `INFO`                    | Nível de log (DEBUG/INFO/WARNING) |

> **Docker:** use `mongodb://mongodb:27017` (padrão do `.env.example`)
> **Local:** altere para `mongodb://localhost:27017`

---

## ❓ Problemas Comuns

<details>
<summary><strong>Porta 8000 já está em uso</strong></summary>

Altere a porta no `docker-compose.yml`:

```yaml
ports:
  - '8001:8000'
```

Acesse em: http://localhost:8001/docs

</details>

<details>
<summary><strong>"Cannot connect to the Docker daemon"</strong></summary>

O Docker Desktop não está rodando. Abra-o e aguarde o ícone ficar verde.

</details>

<details>
<summary><strong>Erro de conexão ao rodar localmente</strong></summary>

Verifique se o MongoDB está rodando na porta 27017 e se o `.env` tem:

```
MONGO_URI=mongodb://localhost:27017
```

</details>

---

<div align="center">

**[Voltar ao README principal](README.md)** · **[Arquitetura detalhada](ARCHITECTURE.md)** · **[Guia de testes](tests/TUTORIAL_TESTS.md)**

</div>
