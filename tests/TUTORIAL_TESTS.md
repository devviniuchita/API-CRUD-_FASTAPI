# Tutorial de Testes — Clients API

Guia completo e prático para compreender, executar e interpretar todos os testes disponíveis neste projeto.

---

## Índice

1. [Visão Geral da Suíte](#visão-geral-da-suíte)
2. [Pré-requisitos](#pré-requisitos)
3. [conftest.py — Infraestrutura de Testes](#conftest-py)
4. [test_client_service.py — Testes Unitários](#test-client-service-py)
5. [k6-load-test.js — Testes de Carga e Concorrência](#k6-load-test-js)
6. [test-mongo-offline.ps1 — Resiliência a Falha de Banco](#test-mongo-offline-ps1)
7. [Executando Tudo em Sequência](#executando-tudo-em-sequência)
8. [Interpretando Falhas](#interpretando-falhas)

---

## Visão Geral da Suíte

A suíte cobre **quatro dimensões de qualidade** distintas e complementares:

| Arquivo                  | Tipo                 | Ferramenta               | O que valida                                                   |
| ------------------------ | -------------------- | ------------------------ | -------------------------------------------------------------- |
| `conftest.py`            | Infraestrutura       | pytest + mongomock-motor | Fornece banco in-memory isolado para os testes unitários       |
| `test_client_service.py` | Unitário             | pytest + anyio           | Lógica de negócio da camada de serviço, sem I/O real           |
| `k6-load-test.js`        | Carga / Concorrência | k6                       | Throughput, latência sob carga e integridade de índices únicos |
| `test-mongo-offline.ps1` | Resiliência          | PowerShell + Docker      | Comportamento da API quando o MongoDB fica indisponível        |

> **Regra de ouro:** os testes unitários rodam sem Docker. Os demais exigem a stack completa em execução (`docker compose up -d`).

---

## Pré-requisitos

### Para testes unitários (`test_client_service.py`)

```bash
# Instalar dependências do projeto no ambiente virtual
.venv\Scripts\pip install -r requirements.txt
```

Pacotes necessários (já declarados no projeto):

- `pytest`
- `pytest-asyncio`
- `anyio`
- `mongomock-motor`

### Para testes de carga (`k6-load-test.js`)

```bash
# Instalar k6 no Windows
winget install k6 --source winget

# Verificar instalação
k6 version
```

A API deve estar rodando em `http://localhost:8000`.

### Para o teste de resiliência (`test-mongo-offline.ps1`)

- PowerShell 7+ (`pwsh`)
- Docker em execução
- API e MongoDB rodando via `docker compose up -d`
- Executar **sempre a partir da raiz do projeto**

---

## conftest.py

<a id="conftest-py"></a>

**Arquivo:** [conftest.py](conftest.py)
**Papel:** infraestrutura compartilhada — não contém testes, apenas fornece fixtures.

### O que faz

Define a fixture `client_service`, que é injetada automaticamente pelo pytest em todos os testes que a declaram como parâmetro. Ela:

1. Cria um cliente MongoDB **in-memory** usando `AsyncMongoMockClient` — sem nenhuma conexão de rede real
2. Cria um banco de dados temporário chamado `test_db`
3. Cria a collection `clients`
4. Espelha os **índices únicos de produção** (`email` e `document`), garantindo que o comportamento de unicidade seja idêntico ao do MongoDB real
5. Instancia `ClientRepository` com essa collection mock
6. Retorna um `ClientService` pronto para uso

```python
@pytest.fixture
async def client_service() -> ClientService:
    mock_client = AsyncMongoMockClient()
    db = mock_client["test_db"]
    collection = db.get_collection("clients")

    await collection.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True, name="unique_email"),
        IndexModel([("document", ASCENDING)], unique=True, name="unique_document"),
    ])

    repo = ClientRepository(cast(AsyncCollection, collection))
    return ClientService(repo)
```

### Por que `cast(AsyncCollection, collection)`?

`ClientRepository` aceita qualquer objeto que satisfaça o protocolo `AsyncCollection` (definido em `client_repo.py`). O `mongomock_motor` implementa os mesmos métodos que o Motor em runtime, mas seus type stubs são incompletos — o Pylance não consegue verificar isso estaticamente. O `cast` instrui o type checker a confiar na compatibilidade sem inserir `# type: ignore`.

### Isolamento por teste

Cada teste recebe uma **instância nova e limpa** da fixture. Não há estado compartilhado entre testes — o banco in-memory é recriado a cada execução de fixture.

---

## test_client_service.py

<a id="test-client-service-py"></a>

**Arquivo:** [test_client_service.py](test_client_service.py)
**Tipo:** Unitário | **Ferramenta:** pytest + anyio
**Como executar:**

```bash
# Na raiz do projeto
.venv\Scripts\pytest tests/test_client_service.py -v
```

### O que valida

Testa a camada `ClientService` — a lógica de negócio pura — em **total isolamento** do banco real, da rede e das rotas HTTP.

### Helper `_make_payload`

```python
def _make_payload(**overrides) -> ClientCreate:
    defaults = {
        "name": "João Silva",
        "email": "joao.silva@email.com",
        "document": "123.456.789-09",
    }
    defaults.update(overrides)
    return ClientCreate(**defaults)
```

Utilitário que cria um `ClientCreate` com dados padrão válidos. Qualquer campo pode ser sobrescrito via `**overrides`, evitando repetição nos testes.

---

### Testes disponíveis

#### `test_create_client_success`

**O que testa:** criação bem-sucedida de um cliente.

**Verifica:**

- `name`, `email` e `document` retornados batem com o payload enviado
- Campo `id` presente no resultado
- Campos `created_at` e `updated_at` foram gerados automaticamente
- `created_at == updated_at` na criação (ainda não houve atualização)

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_create_client_success -v
```

---

#### `test_create_client_duplicate_email_raises_409`

**O que testa:** unicidade de email — o índice único do MongoDB deve rejeitar duplicatas.

**Cenário:** cria o mesmo cliente duas vezes com o mesmo email.

**Verifica:**

- Segunda chamada lança `HTTPException` com `status_code == 409`
- A mensagem de erro (`detail`) menciona o campo `"email"`

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_create_client_duplicate_email_raises_409 -v
```

---

#### `test_get_client_by_id_invalid_format_raises_400`

**O que testa:** validação de formato do ObjectId do MongoDB.

**Cenário:** busca por ID com formato inválido (`"id-invalido"` não é um ObjectId hexadecimal de 24 caracteres).

**Verifica:**

- Lança `HTTPException` com `status_code == 400`

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_get_client_by_id_invalid_format_raises_400 -v
```

---

#### `test_get_client_by_id_not_found_raises_404`

**O que testa:** busca por ID válido mas inexistente.

**Cenário:** ObjectId `"000000000000000000000000"` tem formato correto mas não existe no banco.

**Verifica:**

- Lança `HTTPException` com `status_code == 404`

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_get_client_by_id_not_found_raises_404 -v
```

---

#### `test_patch_client_no_fields_raises_422`

**O que testa:** que um PATCH sem nenhum campo é rejeitado.

**Cenário:** envia um `ClientUpdate()` vazio (nenhum campo preenchido).

**Verifica:**

- Lança `HTTPException` com `status_code == 422`

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_patch_client_no_fields_raises_422 -v
```

---

#### `test_delete_client_not_found_raises_404`

**O que testa:** deleção de ID inexistente.

**Cenário:** tenta deletar o ObjectId `"000000000000000000000000"`.

**Verifica:**

- Lança `HTTPException` com `status_code == 404`

```bash
.venv\Scripts\pytest tests/test_client_service.py::test_delete_client_not_found_raises_404 -v
```

---

### Saída esperada (todos passando)

```
tests/test_client_service.py::test_create_client_success                     PASSED
tests/test_client_service.py::test_create_client_duplicate_email_raises_409  PASSED
tests/test_client_service.py::test_get_client_by_id_invalid_format_raises_400 PASSED
tests/test_client_service.py::test_get_client_by_id_not_found_raises_404     PASSED
tests/test_client_service.py::test_patch_client_no_fields_raises_422         PASSED
tests/test_client_service.py::test_delete_client_not_found_raises_404        PASSED

6 passed in ~0.26s
```

---

## k6-load-test.js

<a id="k6-load-test-js"></a>

**Arquivo:** [k6-load-test.js](k6-load-test.js)
**Tipo:** Carga e Concorrência | **Ferramenta:** k6
**Pré-requisito:** API rodando em `http://localhost:8000`

### Arquitetura do script

O script expõe **três cenários independentes** selecionáveis via variável de ambiente `SCENARIO`. Cada cenário tem sua própria configuração de VUs (Virtual Users), duração e thresholds de aprovação.

### Métricas customizadas

| Métrica              | Tipo    | O que mede                                             |
| -------------------- | ------- | ------------------------------------------------------ |
| `conflict_409_rate`  | Rate    | Percentual de respostas 409 no cenário de concorrência |
| `create_201_total`   | Counter | Total de criações bem-sucedidas                        |
| `create_duration_ms` | Trend   | Distribuição de latência do POST (p50, p95, p99)       |

---

### Cenário 1 — `smoke`

**Objetivo:** verificação rápida de sanidade. Valida que a API está respondendo corretamente sem nenhuma carga.

**Configuração:**

- 1 VU (Virtual User)
- Duração: 10 segundos
- Executor: `constant-vus`

**Como executar:**

```bash
# Cenário padrão — smoke é selecionado automaticamente
k6 run tests/k6-load-test.js

# Com URL customizada
k6 run --env BASE_URL=http://meuservidor:8000 tests/k6-load-test.js
```

**O que cada iteração faz (ciclo CRUD completo):**

1. `POST /clients` — cria um cliente com email e documento únicos por VU + timestamp
2. `GET /clients/:id` — busca o cliente criado pelo ID retornado
3. `PATCH /clients/:id` — atualiza o nome do cliente
4. `DELETE /clients/:id` — remove o cliente (teardown inline)

**Checks por grupo:**

| Grupo  | Check           | Critério                      |
| ------ | --------------- | ----------------------------- |
| POST   | Status 201      | Criação bem-sucedida          |
| POST   | `id` presente   | Campo obrigatório no response |
| POST   | Tempo < 500ms   | Performance                   |
| GET    | Status 200      | Leitura bem-sucedida          |
| GET    | ID confere      | Integridade dos dados         |
| PATCH  | Status 200      | Atualização bem-sucedida      |
| PATCH  | Nome atualizado | Consistência de dados         |
| DELETE | Status 204      | Deleção bem-sucedida          |

**Thresholds (critérios de aprovação):**

```
p(95) de POST < 500ms      → 95% das criações em menos de 500ms
http_req_failed < 1%       → menos de 1% de erros HTTP
```

---

### Cenário 2 — `concurrency`

**Objetivo:** testar a integridade do índice único do MongoDB sob condição de corrida — 50 VUs tentam criar o **mesmo email simultaneamente**.

**Configuração:**

- 50 VUs simultâneos
- 50 iterações totais (1 por VU)
- Executor: `shared-iterations`
- Duração máxima: 30 segundos

**Como executar:**

```bash
k6 run --env SCENARIO=concurrency tests/k6-load-test.js
```

**O que cada VU faz:**

- Tenta criar um cliente com `email = "concurrency.shared@test.com"` (fixo para todos)
- Cada VU usa um `document` diferente para evitar colisão de documento também
- Resposta esperada: **exatamente 1 VU recebe 201**, todos os demais recebem **409**

**Por que 409 não conta como falha aqui?**

O script usa `responseCallback: http.expectedStatuses(201, 409)` — isso instrui o k6 a **não** contabilizar 409 em `http_req_failed`. O 409 é o comportamento correto e esperado do índice único MongoDB.

**Checks:**

```javascript
'Concorrência: apenas 201 ou 409 são aceitáveis': (r) => r.status === 201 || r.status === 409
'Nenhum 500 (panic) sob concorrência':            (r) => r.status !== 500
```

**Threshold:** `checks{scenario:concurrency} == 1` — 100% dos checks precisam passar (zero 500s).

**Teardown automático:** o VU que recebeu 201 imediatamente deleta o cliente criado para não poluir o banco.

---

### Cenário 3 — `load`

**Objetivo:** estressar a API com carga crescente e sustentada, medindo throughput e latência real sob pressão.

**Configuração (rampa de VUs):**

```
0s  → 20s  : sobe de 0 para 20 VUs
20s → 1m20s: sobe de 20 para 100 VUs
1m20s→1m50s: mantém 100 VUs
1m50s→2m   : desce de 100 para 0 VUs
Total: ~2 minutos
```

**Como executar:**

```bash
k6 run --env SCENARIO=load tests/k6-load-test.js
```

**O que cada iteração faz:** mesmo ciclo CRUD completo do cenário `smoke`, com 100 VUs simultâneos no pico.

**Thresholds:**

```
p(95) de POST < 500ms      → 95% das criações em menos de 500ms sob carga máxima
http_req_failed < 1%       → menos de 1% de erros HTTP
```

**Teardown global:** após todos os cenários, a função `teardown()` lista todos os clientes e remove qualquer um cujo email contenha `k6.vu` ou seja igual a `concurrency.shared@test.com`, garantindo banco limpo.

---

### Variáveis de ambiente do k6

| Variável   | Padrão                  | Descrição                                            |
| ---------- | ----------------------- | ---------------------------------------------------- |
| `SCENARIO` | `smoke`                 | Cenário a executar: `smoke`, `concurrency` ou `load` |
| `BASE_URL` | `http://localhost:8000` | URL base da API                                      |

---

### Saída típica (smoke)

```
✓ POST 201
✓ Response has id
✓ Response time < 500ms
✓ GET 200
✓ GET: id matches
✓ PATCH 200
✓ PATCH: name updated
✓ DELETE 204

http_req_duration............: avg=32ms  p(95)=48ms
http_req_failed..............: 0.00%
create_duration_ms...........: avg=35ms  p(95)=51ms
```

---

## test-mongo-offline.ps1

<a id="test-mongo-offline-ps1"></a>

**Arquivo:** [test-mongo-offline.ps1](test-mongo-offline.ps1)
**Tipo:** Resiliência / Infraestrutura | **Ferramenta:** PowerShell 7 + Docker
**Pré-requisito:** stack completa rodando (`docker compose up -d`), executar da raiz do projeto

### O que valida

Simula uma **falha real do banco de dados** em produção, verificando:

1. A API retorna erro gracioso (`503`/`500`/`504`) em vez de travar (_hang_)
2. O tempo de resposta com banco offline é inferior a 5 segundos (detecta ausência de `serverSelectionTimeoutMS`)
3. Os dados persistidos **antes** da falha continuam intactos **após** a recuperação
4. A API se reconecta automaticamente quando o MongoDB volta

### Como executar

```bash
# A partir da raiz do projeto (onde está o docker-compose.yml)
pwsh tests/test-mongo-offline.ps1
```

---

### Fluxo de execução passo a passo

#### Fase 1 — Verificação de pré-condições

- Confirma que o Docker está disponível no PATH
- Confirma que o `docker-compose.yml` existe no diretório atual
- Faz um `GET /clients` baseline — se a API não responder 200, aborta com instrução de correção

#### Fase 2 — Criação de fixture

- Gera timestamp Unix para criar email e documento **únicos** a cada execução (evita colisão entre runs)
- Cria um cliente via `POST /clients` com esses dados únicos
- Salva o `id` retornado para verificação posterior de integridade

#### Fase 3 — Falha simulada (bloco `try`)

Derruba o container MongoDB:

```powershell
docker compose stop mongodb
```

Em seguida executa 3 requisições com Mongo offline e verifica cada resposta com `Assert-OfflineResponse`:

| Requisição         | Resposta esperada |
| ------------------ | ----------------- |
| `GET /clients`     | 500, 503 ou 504   |
| `POST /clients`    | 500, 503 ou 504   |
| `GET /clients/:id` | 500, 503 ou 504   |

**Lógica de `Assert-OfflineResponse`:**

```
503/500/504  → ✅ PASS — erro gracioso correto
Timeout (>5s)→ ❌ FAIL — API travada (falta serverSelectionTimeoutMS)
Status 0     → ❌ FAIL — API crashou ou conexão recusada
200/201      → ❌ FAIL — "dados fantasma" (impossível sem Mongo)
Outro status → ❌ FAIL — comportamento inesperado
```

#### Fase 4 — Medição de tempo de resposta offline

```powershell
$sw = [Diagnostics.Stopwatch]::StartNew()
Invoke-ApiRequest -Method GET -Path "/clients"
$sw.Stop()
```

- Se `elapsed < 5s` → ✅ API responde rapidamente (driver configurado corretamente)
- Se `elapsed >= 5s` → ❌ API trava (falta `serverSelectionTimeoutMS` na config do Motor)

#### Fase 5 — Recovery (bloco `finally` — executa SEMPRE)

O bloco `finally` garante que o MongoDB **sempre** será reiniciado, mesmo se algum teste falhar:

```powershell
docker compose start mongodb
```

Depois aguarda a API recuperar (até 50 segundos, verificando a cada 2s):

- Se recuperar → ✅ PASS
- Se não recuperar → reinicia o container da API como fallback

#### Fase 6 — Verificação de integridade pós-recovery

Busca o fixture criado na Fase 2 pelo ID salvo:

- Se `GET /clients/:id` retornar 200 → ✅ Dados íntegros após restart
- Se retornar 404 → ❌ Fixture perdido (problema de persistência)

#### Fase 7 — Teardown

Remove o fixture do banco via `DELETE /clients/:id`, deixando o banco limpo.

---

### Saída esperada (todos os checks passando)

```
━━ Verificando pré-condições
  API online e respondendo 200 ✔

━━ Criando fixture antes da falha
  ✅ Fixture criado antes da falha (id: 69a50d97...)

━━ Parando MongoDB (mongodb)
  MongoDB parado.

━━ Testando API com MongoDB offline
  ✅ GET  /clients → 503 (graceful error — correto)
  ✅ POST /clients → 503 (graceful error — correto)
  ✅ GET  /clients/:id → 503 (graceful error — correto)

━━ Medindo tempo de resposta com Mongo offline
  ✅ API responde em 0.3s com Mongo offline (< 5s — não trava)

━━ Reiniciando MongoDB (finally)
  Aguardando API recuperar (máx 50s)...
  ✅ API se recuperou automaticamente após MongoDB voltar

━━ Verificando integridade dos dados após recovery
  ✅ Dados persistidos íntegros após restart (fixture encontrado)

  [Cleanup] Fixture deletado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESULTADO: 5 passaram | 0 falharam
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Configuração interna

```powershell
$API_URL       = "http://localhost:8000"
$MONGO_SERVICE = "mongodb"      # deve bater com o nome do serviço no docker-compose.yml
$COMPOSE_FILE  = "docker-compose.yml"
$TIMEOUT_SEC   = 5              # tempo máximo por request antes de detectar hang
```

---

## Executando Tudo em Sequência

Sequência recomendada para validação completa:

```bash
# 1. Suba a stack
docker compose up -d

# 2. Testes unitários (sem Docker, rápidos — rodar primeiro)
.venv\Scripts\pytest tests/test_client_service.py -v

# 3. Teste de sanidade com k6 (smoke — ~10s)
k6 run tests/k6-load-test.js

# 4. Teste de concorrência com k6 (~30s)
k6 run --env SCENARIO=concurrency tests/k6-load-test.js

# 5. Teste de resiliência MongoDB (requer Docker — ~1-2min)
pwsh tests/test-mongo-offline.ps1

# 6. Teste de carga completo com k6 (~2min — opcional, mais pesado)
k6 run --env SCENARIO=load tests/k6-load-test.js
```

---

## Interpretando Falhas

### Testes unitários

| Falha                                 | Causa provável                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `ImportError`                         | Dependências não instaladas — rode `.venv\Scripts\pip install -r requirements.txt` |
| `409` não levantado em duplicata      | Índice único não está sendo criado na fixture do `conftest.py`                     |
| `created_at != updated_at` na criação | Serviceestá sobrescrevendo `created_at` indevidamente                              |

### k6

| Falha                        | Causa provável                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `POST 201` fail rate > 0%    | Colisão de email/documento entre VUs — verificar `uniqueEmail()` e `uniqueDoc()` |
| `p(95) > 500ms`              | API ou banco com lentidão — verificar recursos do Docker                         |
| `500` no cenário concurrency | Race condition não tratada na camada de serviço/repositório                      |
| `checks rate < 1`            | Algum VU recebeu resposta fora de 201/409 no cenário concurrency                 |

### test-mongo-offline.ps1

| Falha                                     | Causa provável                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `HANG / timeout após 5s`                  | Motor sem `serverSelectionTimeoutMS` — adicionar `?serverSelectionTimeoutMS=3000` na `MONGO_URL` |
| `dados fantasma (200/201)`                | API com cache ou conexão persistente ignorando falha do banco                                    |
| `API NÃO recuperou`                       | Container da API crashou — verificar logs com `docker compose logs api`                          |
| `Fixture não encontrado após restart`     | Problema de persistência do volume MongoDB                                                       |
| `ERRO: docker-compose.yml não encontrado` | Script executado fora da raiz do projeto                                                         |
