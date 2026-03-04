<div align="center">

# ⚡ Quick Start — Frontend (Angular + Tailwind)

**Interface moderna rodando em um comando**

</div>

---

## 🐳 Opção 1 — Docker (Recomendado)

> Sobe Frontend + API + MongoDB de uma vez. Sem instalar Node.js.

### Pré-requisito

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### Passo a passo

```bash
# 1. Clone o repositório (se ainda não clonou)
git clone https://github.com/devviniuchita/clients_api.git
cd clients_api

# 2. Crie o .env (se ainda não criou)
cp .env.example .env          # Linux / macOS
copy .env.example .env        # Windows CMD

# 3. Suba tudo
docker compose up --build
```

### Pronto! Acesse:

| Serviço    | URL                                                   |
| ---------- | ----------------------------------------------------- |
| Frontend   | [localhost:4200](http://localhost:4200)               |
| Swagger    | [localhost:8000/docs](http://localhost:8000/docs)     |
| ReDoc      | [localhost:8000/redoc](http://localhost:8000/redoc)   |
| API Health | [localhost:8000/health](http://localhost:8000/health) |

> O Docker builda o Angular, gera os assets estáticos e serve via **Nginx Alpine** (~25 MB).

### Containers iniciados

| Container  | Imagem           | Porta   | Função                |
| ---------- | ---------------- | ------- | --------------------- |
| `frontend` | Nginx Alpine     | `4200`  | Serve o build Angular |
| `api`      | Python 3.12 Slim | `8000`  | API FastAPI           |
| `mongodb`  | Mongo 4.4        | `27017` | Banco de dados        |

---

## 💻 Opção 2 — Desenvolvimento Local (ng serve)

> Para quem quer editar código com hot reload instantâneo.

### Pré-requisitos

| Ferramenta | Versão | Verificar com    |
| ---------- | ------ | ---------------- |
| Node.js    | 20+    | `node --version` |
| npm        | 10+    | `npm --version`  |

> **Importante:** A API FastAPI deve estar rodando na porta `8000`. Use Docker para a API ou siga o [Quick Start Backend](QUICK_START_BACK.md).

### Passo a passo

```bash
# 1. Entre na pasta do frontend
cd clients-ui

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm start
```

### Pronto! Acesse http://localhost:4200

> O `proxy.conf.json` redireciona todas as chamadas `/api/*` para `http://localhost:8000`, eliminando problemas de CORS no desenvolvimento.

---

## 🎨 O que você vai encontrar

### Tela de Lista (`/clients`)

- **Skeleton loading** enquanto carrega dados da API
- **Empty state** com CTA para criar o primeiro cliente
- **Busca local** com debounce de 300ms (filtra por nome, email, documento)
- **Cards** com avatar (iniciais + gradiente por ID), documento em fonte mono, data formatada
- **Excluir** com modal de confirmação animado
- **Contador** de clientes cadastrados

### Tela de Formulário (`/clients/new` e `/clients/:id/edit`)

- **Modo Create:** formulário vazio, submit via `POST`
- **Modo Edit:** pré-preenche via `GET`, submit via `PATCH` (apenas campos alterados)
- **Máscara automática:** CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
- **Validações inline** aparecem após interação (dirty/touched)
- **Erro 409** (duplicidade) aparece como mensagem inline no campo afetado

### Design

- **Header** com glassmorphism, badge de status da API, toggle dark/light, links Swagger e ReDoc
- **Dark/Light mode** persistido em `localStorage`
- **Toast notifications** com variantes (success/error/warning/info) e barra de progresso
- **Footer** com informações do desenvolvedor e links sociais
- **Responsivo:** 1 coluna (mobile) / 2 colunas (tablet) / 3 colunas (desktop)
- **Acessibilidade:** aria-labels, focus visible, skip-link, navegação por teclado

---

## 🏗️ Estrutura do Frontend

```
clients-ui/
├── src/
│   ├── app/
│   │   ├── core/                    # Infraestrutura compartilhada
│   │   │   ├── config/              # InjectionToken (API URL)
│   │   │   ├── interceptors/        # Erro HTTP + Loading
│   │   │   ├── services/            # Toast + Loading (signals)
│   │   │   ├── directives/          # Máscara CPF/CNPJ
│   │   │   └── components/          # Toast, Modal, Spinner, Footer
│   │   ├── features/clients/        # Feature de clientes
│   │   │   ├── models/              # Interfaces TypeScript
│   │   │   ├── services/            # ClientsService (HTTP)
│   │   │   ├── pages/               # Lista + Formulário
│   │   │   └── components/          # Card + Skeleton
│   │   ├── app.routes.ts            # Rotas com lazy loading
│   │   ├── app.config.ts            # Providers
│   │   └── app.component.ts         # Shell (Header + Footer)
│   ├── environments/                # Dev (proxy) + Production (localhost:8000)
│   └── styles.scss                  # Design tokens + Glassmorphism + Neumorphism
├── nginx.conf                       # SPA routing + security headers
├── Dockerfile                       # Multi-stage (Node → Nginx)
├── proxy.conf.json                  # Proxy /api → localhost:8000
├── tailwind.config.js               # Fontes + Animações customizadas
└── package.json
```

---

## 🔧 Configuração

### Environments

| Ambiente    | `apiUrl`                | Uso                              |
| ----------- | ----------------------- | -------------------------------- |
| Development | `/api` (via proxy)      | `npm start` — proxy resolve CORS |
| Production  | `http://localhost:8000` | Docker — browser acessa direto   |

### Proxy (desenvolvimento)

O `proxy.conf.json` faz o redirecionamento:

```
Browser → localhost:4200/api/clients
                ↓ (proxy)
         localhost:8000/clients
```

---

## 📊 Métricas do Build

| Métrica              | Valor           |
| -------------------- | --------------- |
| Bundle inicial       | ~312 kB         |
| Transfer size (gzip) | ~86 kB          |
| Lazy chunks          | 3 chunks        |
| Imagem Docker final  | ~25 MB          |
| Framework            | Angular 17.3.12 |
| Build time (Docker)  | ~3 min          |

---

## ❓ Problemas Comuns

<details>
<summary><strong>Página carrega mas não mostra dados</strong></summary>

A API não está rodando. Verifique:

```bash
curl http://localhost:8000/health
```

Se não responder, suba a API primeiro: `docker compose up --build`

</details>

<details>
<summary><strong>Erro de CORS no desenvolvimento</strong></summary>

Certifique-se de usar `npm start` (que usa o proxy). Não acesse a API diretamente do browser em outra porta.

</details>

<details>
<summary><strong>Porta 4200 já está em uso</strong></summary>

No `docker-compose.yml`, altere a porta:

```yaml
ports:
  - '4201:80'
```

</details>

<details>
<summary><strong>Build do Docker muito lento</strong></summary>

O primeiro build baixa imagens Docker (~50 MB Node + ~25 MB Nginx). Builds subsequentes são mais rápidos graças ao cache do Docker.

</details>

---

<div align="center">

**[Voltar ao README principal](README.md)** · **[Quick Start Backend](QUICK_START_BACK.md)** · **[Arquitetura detalhada](ARCHITECTURE.md)**

</div>
