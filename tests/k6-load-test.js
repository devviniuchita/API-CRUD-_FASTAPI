/**
 * k6 Load & Concurrency Test — Clients API
 *
 * Cenários:
 *   1. smoke      — 1 VU, 10s  → valida que nada está quebrado
 *   2. concurrency— 50 VUs criando o mesmo email simultaneamente → testa índice único
 *   3. load       — rampa até 100 VUs, 2 min → throughput e latência sob carga
 *
 * Como instalar k6:
 *   Windows: winget install k6 --source winget
 *   Ou baixar em: https://k6.io/docs/get-started/installation/
 *
 * Como executar (escolha um cenário):
 *   k6 run tests/k6-load-test.js                         # smoke (padrão)
 *   k6 run --env SCENARIO=concurrency tests/k6-load-test.js
 *   k6 run --env SCENARIO=load tests/k6-load-test.js
 *
 * Limiar de aprovação (thresholds):
 *   - 95% das requisições < 500ms
 *   - Taxa de erro HTTP < 1%
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Métricas customizadas ───────────────────────────────────────────────────
const conflictRate = new Rate('conflict_409_rate');
const createSuccess = new Counter('create_201_total');
const createDuration = new Trend('create_duration_ms', true);

// ─── Configuração por cenário ────────────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'smoke';

const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '10s',
  },
  concurrency: {
    // 50 VUs se lançam ao mesmo tempo tentando criar o MESMO email
    executor: 'shared-iterations',
    vus: 50,
    iterations: 50,
    maxDuration: '30s',
  },
  load: {
    // Rampa: 0→20→100→100→0 VUs
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '20s', target: 20 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 100 },
      { duration: '10s', target: 0 },
    ],
  },
};

// Thresholds aplicam-se apenas ao smoke e load (excluem concurrency via tag).
// No cenário concurrency, 409 é o comportamento esperado (índice único Mongo);
// o próprio check "apenas 201 ou 409" é o critério de aprovação.
const THRESHOLDS_BY_SCENARIO = {
  smoke: {
    'http_req_duration{method:POST,scenario:smoke}': ['p(95)<500'],
    'http_req_failed{scenario:smoke}': ['rate<0.01'],
  },
  load: {
    'http_req_duration{method:POST,scenario:load}': ['p(95)<500'],
    'http_req_failed{scenario:load}': ['rate<0.01'],
  },
  concurrency: {
    // Critério: zero 500s (panic). 409 é esperado e NÃO é falha aqui.
    'checks{scenario:concurrency}': ['rate==1'],
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: { ...SCENARIOS[SCENARIO], tags: { scenario: SCENARIO } },
  },
  thresholds: THRESHOLDS_BY_SCENARIO[SCENARIO],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const HEADERS = { 'Content-Type': 'application/json' };

function uniqueEmail() {
  // VU_ID + timestamp para garantir email único por VU em smoke/load
  return `k6.vu${__VU}.t${Date.now()}@test.com`;
}

function uniqueDoc() {
  // CPF sintético único: último dígito do VU + timestamp truncado
  const ts = Date.now().toString().slice(-6);
  const vu = String(__VU).padStart(3, '0');
  return `${vu.slice(0, 3)}.${ts.slice(0, 3)}.${ts.slice(3, 6)}-${String(__VU % 100).padStart(2, '0')}`;
}

// ─── Cenário Smoke & Load: ciclo CRUD completo ────────────────────────────────
export default function runScenario() {
  if (SCENARIO === 'concurrency') {
    concurrencyTest();
  } else {
    crudCycleTest();
  }
}

function crudCycleTest() {
  let clientId;

  group('POST /clients — Create', () => {
    const payload = JSON.stringify({
      name: `k6 User VU${__VU}`,
      email: uniqueEmail(),
      document: uniqueDoc(),
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/clients`, payload, { headers: HEADERS });
    createDuration.add(Date.now() - start);

    const ok = check(res, {
      'POST 201': (r) => r.status === 201,
      'Response has id': (r) => r.json('id') !== undefined,
      'Response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (ok && res.status === 201) {
      createSuccess.add(1);
      clientId = res.json('id');
    }
  });

  if (!clientId) return;

  group('GET /clients/:id — Read', () => {
    const res = http.get(`${BASE_URL}/clients/${clientId}`, { headers: HEADERS });
    check(res, {
      'GET 200': (r) => r.status === 200,
      'GET: id matches': (r) => r.json('id') === clientId,
    });
  });

  group('PATCH /clients/:id — Partial Update', () => {
    const payload = JSON.stringify({ name: `k6 Updated VU${__VU}` });
    const res = http.patch(`${BASE_URL}/clients/${clientId}`, payload, { headers: HEADERS });
    check(res, {
      'PATCH 200': (r) => r.status === 200,
      'PATCH: name updated': (r) => r.json('name') === `k6 Updated VU${__VU}`,
    });
  });

  group('DELETE /clients/:id — Remove', () => {
    const res = http.del(`${BASE_URL}/clients/${clientId}`, null, { headers: HEADERS });
    check(res, {
      'DELETE 204': (r) => r.status === 204,
    });
  });

  sleep(0.1);
}

// ─── Cenário de Concorrência: 50 VUs → mesmo email ───────────────────────────
// Objetivo: apenas 1 deve receber 201, os demais devem receber 409
const SHARED_EMAIL = `concurrency.shared@test.com`;
const SHARED_DOC_BASE = '777.888.999';

function concurrencyTest() {
  const payload = JSON.stringify({
    name: 'Concurrent User',
    email: SHARED_EMAIL,
    document: `${SHARED_DOC_BASE}-${String(__VU).padStart(2, '0')}`,
  });

  // responseCallback: marca 201 e 409 como respostas esperadas
  // → 409 NÃO será contabilizado em http_req_failed
  const res = http.post(`${BASE_URL}/clients`, payload, {
    headers: HEADERS,
    responseCallback: http.expectedStatuses(201, 409),
  });

  check(res, {
    'Concorrência: apenas 201 ou 409 são aceitáveis': (r) => r.status === 201 || r.status === 409,
    'Nenhum 500 (panic) sob concorrência': (r) => r.status !== 500,
  });

  if (res.status === 409) {
    conflictRate.add(1);
  } else if (res.status === 201) {
    // Limpar o cliente criado para não poluir o banco
    const id = res.json('id');
    if (id) {
      http.del(`${BASE_URL}/clients/${id}`, null, { headers: HEADERS });
    }
  }
}

// ─── Teardown: limpar clientes k6 que possam ter ficado no banco ──────────────
export function teardown() {
  // Remove clientes com email contendo 'concurrency.shared@test.com' via list+delete
  // (só relevante após cenário concurrency)
  const listRes = http.get(`${BASE_URL}/clients`, { headers: HEADERS });
  if (listRes.status !== 200) return;

  const clients = listRes.json();
  if (!Array.isArray(clients)) return;

  clients
    .filter((c) => c.email && (c.email.includes('k6.vu') || c.email === SHARED_EMAIL))
    .forEach((c) => http.del(`${BASE_URL}/clients/${c.id}`, null, { headers: HEADERS }));
}
