<div align="center">

# Clients UI

**Frontend Angular do sistema de gerenciamento de clientes — Positivo S+ Technical Challenge**

[![Angular](https://img.shields.io/badge/Angular-17.3-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Nginx_Alpine-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/)

_Interface moderna com glassmorphism, dark mode e CRUD completo integrado à API FastAPI._

</div>

---

## Visão Geral

Frontend **Standalone Components** (sem NgModules) construído com **Angular 17 + Tailwind CSS**. Consome a API REST FastAPI via `HttpClient` com interceptors para tratamento de erros e loading. Design system customizado com glassmorphism, neumorphism e micro-interactions.

---

## Início Rápido

### Com Docker (recomendado)

Na raiz do repositório:

```bash
docker compose up --build
```

| Serviço   | URL                         |
|-----------|-----------------------------|
| Frontend  | http://localhost:4200       |
| API       | http://localhost:8000       |
| Swagger   | http://localhost:8000/docs  |
| ReDoc     | http://localhost:8000/redoc |

### Desenvolvimento Local

Requer **Node.js 20+**.

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (com proxy para a API)
npm start
```

Acesse http://localhost:4200. O proxy redireciona `/api/*` para `http://localhost:8000`.

> **Nota:** A API FastAPI deve estar rodando na porta `8000` para o frontend funcionar corretamente.

---

## Funcionalidades

- **Listagem** com busca local (debounce 300ms) por nome, email e documento
- **Cadastro** com validação em tempo real + máscara automática CPF/CNPJ
- **Edição** com PATCH semântico (envia apenas campos alterados)
- **Exclusão** com modal de confirmação e remoção local sem reload
- **Dark/Light mode** persistido em `localStorage`
- **Toast notifications** com auto-dismiss e barra de progresso
- **Skeleton loading** + empty states + error state com retry
- **Responsivo** mobile-first (1/2/3 colunas)
- **Acessibilidade** WCAG 2.1 AA (aria-labels, focus trap, skip-link, navegação por teclado)

---

## Arquitetura

```
src/app/
├── core/                          # Infraestrutura compartilhada
│   ├── config/api.config.ts       # InjectionToken para API URL
│   ├── interceptors/              # Interceptors HTTP (erro + loading)
│   ├── services/                  # ToastService + LoadingService (signals)
│   ├── directives/                # DocumentMaskDirective (CPF/CNPJ)
│   └── components/                # Toast, ConfirmModal, LoadingSpinner, Footer
├── features/clients/              # Feature module
│   ├── models/client.model.ts     # Interfaces TypeScript
│   ├── services/clients.service.ts# HttpClient (GET, POST, PATCH, DELETE)
│   ├── pages/                     # ClientsListPage + ClientFormPage
│   └── components/                # ClientCard + Skeleton
├── app.routes.ts                  # Lazy loading de rotas
├── app.config.ts                  # Providers (Router, HttpClient, Interceptors)
└── app.component.ts               # Header + Footer + RouterOutlet
```

---

## Design System

| Elemento        | Técnica                                                   |
|-----------------|-----------------------------------------------------------|
| Cards e Header  | Glassmorphism (`backdrop-filter: blur(20px)`)             |
| Inputs          | Neumorphism (sombras internas + glow no focus)            |
| Botões          | Gradiente brand + glow hover + scale transitions          |
| Tema            | CSS custom properties + `[data-theme]` attribute          |
| Tipografia      | Outfit (UI) + JetBrains Mono (dados técnicos)            |
| Animações       | Shimmer skeleton, slide-in toasts, fade-scale modais      |

---

## Decisões Técnicas

| Decisão                          | Justificativa                                              |
|----------------------------------|------------------------------------------------------------|
| PATCH em vez de PUT              | Backend usa `exclude_unset=True` — só campos alterados     |
| Standalone Components            | Padrão Angular 17+ — sem NgModules, tree-shaking eficiente |
| Signal-based services            | Padrão moderno Angular — sem BehaviorSubject boilerplate   |
| Diretiva de máscara customizada  | Zero dependências externas — espelha regex do backend      |
| Lazy loading de rotas            | Bundle inicial menor — features carregadas sob demanda     |
| Proxy no dev server              | Elimina CORS no desenvolvimento — sem hardcode de porta    |
| Nginx Alpine em produção         | Imagem ~25MB — zero Node.js necessário no deploy           |

---

## Build de Produção

```bash
# Build local
npm run build -- --configuration=production

# A imagem Docker faz isso automaticamente (multi-stage)
# Stage 1: Node 20 Alpine → ng build
# Stage 2: Nginx Alpine → serve assets estáticos
```

| Métrica        | Valor      |
|----------------|------------|
| Bundle inicial | ~312 kB    |
| Transfer size  | ~86 kB     |
| Imagem Docker  | ~25 MB     |

---

<div align="center">

Feito com Angular 17 + Tailwind CSS · Glassmorphism Design System

</div>
