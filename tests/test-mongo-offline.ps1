#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Testa o comportamento da API quando o MongoDB fica offline.

.DESCRIPTION
    Simula uma falha no banco de dados:
      1. Para o container do MongoDB via docker compose
      2. Faz requisições à API e verifica se ela responde de forma graceful
         (deve retornar 503 ou 500 em < 5s, NÃO deve travar ou crashar)
      3. Reinicia o MongoDB (always, via finally)
      4. Verifica que a API se recupera automaticamente (reconexão automática)

.NOTES
    Pré-requisitos:
      - Docker Desktop em execução
      - API e MongoDB rodando via: docker compose up -d
      - PowerShell 7+ (pwsh)

    Comportamento esperado vs. encontrado:
      Se o driver Motor não tiver serverSelectionTimeoutMS configurado,
      a API pode travar (hang) ao invés de retornar 503 rapidamente.
      Esse script detecta e reporta esse caso.

.EXAMPLE
    pwsh tests/test-mongo-offline.ps1
#>

$ErrorActionPreference = 'Continue'   # não aborta no primeiro erro

# ─── Configuração ─────────────────────────────────────────────────────────────
$API_URL       = "http://localhost:8000"
$MONGO_SERVICE = "mongodb"            # nome do serviço no docker-compose.yml
$COMPOSE_FILE  = "docker-compose.yml"
$TIMEOUT_SEC   = 5                    # timeout por request (detecta hang rápido)

$PASS      = 0
$FAIL      = 0
$fixtureId = $null

# ─── Helpers ──────────────────────────────────────────────────────────────────
function Write-Step { param([string]$msg) Write-Host "`n━━ $msg" -ForegroundColor Cyan }

function Pass {
    param([string]$name)
    $script:PASS++
    Write-Host "  ✅ $name" -ForegroundColor Green
}

function Fail {
    param([string]$name, [string]$detail = '')
    $script:FAIL++
    Write-Host "  ❌ $name$(if ($detail) { " — $detail" })" -ForegroundColor Red
}

function Info {
    param([string]$msg)
    Write-Host "  ℹ️  $msg" -ForegroundColor DarkYellow
}

function Invoke-ApiRequest {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null)
    $uri     = "$API_URL$Path"
    $headers = @{ "Content-Type" = "application/json" }
    try {
        $params = @{
            Uri         = $uri
            Method      = $Method
            Headers     = $headers
            TimeoutSec  = $TIMEOUT_SEC
            ErrorAction = 'Stop'
        }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress) }
        $resp = Invoke-WebRequest @params -SkipHttpErrorCheck
        return @{ Status = [int]$resp.StatusCode; Body = $resp.Content; TimedOut = $false; Error = $null }
    } catch {
        $msg = $_.Exception.Message
        $timedOut = $msg -match 'timeout|timed out|cancel|HttpClient'
        return @{ Status = 0; Body = ''; TimedOut = $timedOut; Error = $msg }
    }
}

function Wait-ApiHealth {
    param([int]$MaxRetries = 25, [int]$DelaySec = 2)
    Write-Host "    Aguardando API recuperar (máx $($MaxRetries * $DelaySec)s)..." -ForegroundColor DarkYellow
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        $r = Invoke-ApiRequest -Method GET -Path "/clients"
        if ($r.Status -eq 200) { return $true }
        Start-Sleep -Seconds $DelaySec
        Write-Host "    ... tentativa $($i+1)/$MaxRetries (status: $($r.Status))" -ForegroundColor DarkGray
    }
    return $false
}

function Assert-OfflineResponse {
    param([string]$Label, [hashtable]$Response)
    if ($Response.Status -in @(500, 503, 504)) {
        Pass "$Label → $($Response.Status) (graceful error — correto)"
    } elseif ($Response.TimedOut) {
        Fail "$Label → HANG / timeout após ${TIMEOUT_SEC}s (API travada — driver sem serverSelectionTimeoutMS)"
        Info "Correção: adicionar serverSelectionTimeoutMS=3000 na URL do MongoDB em core/config.py"
    } elseif ($Response.Status -eq 0) {
        Fail "$Label → conexão recusada / crash (API morta)" $Response.Error
    } elseif ($Response.Status -eq 200 -or $Response.Status -eq 201) {
        Fail "$Label → $($Response.Status) (dados fantasma — API deveria falhar sem Mongo!)"
    } else {
        Fail "$Label → status inesperado: $($Response.Status)"
    }
}

# ─── Verificação inicial ──────────────────────────────────────────────────────
Write-Step "Verificando pré-condições"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Docker não encontrado." -ForegroundColor Red; exit 1
}
if (-not (Test-Path $COMPOSE_FILE)) {
    Write-Host "ERRO: $COMPOSE_FILE não encontrado. Execute no diretório raiz." -ForegroundColor Red; exit 1
}

$baseline = Invoke-ApiRequest -Method GET -Path "/clients"
if ($baseline.Status -ne 200) {
    if ($baseline.TimedOut) {
        Write-Host "ERRO: API travada (timeout). Reinicie com: docker compose restart" -ForegroundColor Red
    } else {
        Write-Host "ERRO: API não responde (status: $($baseline.Status)). Suba com: docker compose up -d" -ForegroundColor Red
    }
    exit 1
}
Write-Host "  API online e respondendo 200 ✔" -ForegroundColor Green

# ─── Criar fixture antes de derrubar o Mongo ─────────────────────────────────
Write-Step "Criando fixture antes da falha"

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
$s1 = $ts.Substring(5, 3)
$s2 = $ts.Substring(8, 3)
$s3 = $ts.Substring(11, 2)

$fixture = Invoke-ApiRequest -Method POST -Path "/clients" -Body @{
    name     = "Mongo Offline Test"
    email    = "mongo.offline.$ts@test.com"
    document = "$s1.$s2.999-$s3"
}
if ($fixture.Status -eq 201) {
    $fixtureId = ($fixture.Body | ConvertFrom-Json).id
    Pass "Fixture criado antes da falha (id: $fixtureId)"
} else {
    Fail "Falha ao criar fixture" "status: $($fixture.Status)"
}

# ─── Bloco principal com try/finally para garantir restart do Mongo ───────────
try {
    # Parar o MongoDB
    Write-Step "Parando MongoDB ($MONGO_SERVICE)"
    docker compose stop $MONGO_SERVICE 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "  MongoDB parado." -ForegroundColor DarkYellow

    # Testar comportamento da API com Mongo offline
    Write-Step "Testando API com MongoDB offline"

    Assert-OfflineResponse "GET  /clients" (Invoke-ApiRequest -Method GET -Path "/clients")
    Assert-OfflineResponse "POST /clients" (Invoke-ApiRequest -Method POST -Path "/clients" -Body @{
        name     = "Should Fail"
        email    = "offline.post.$ts@test.com"
        document = "999.888.777-66"
    })

    if ($fixtureId) {
        Assert-OfflineResponse "GET  /clients/:id" (Invoke-ApiRequest -Method GET -Path "/clients/$fixtureId")
    }

    # Zerar TIMEOUT contagem de tempo real de resposta
    Write-Step "Medindo tempo de resposta com Mongo offline"
    $sw = [Diagnostics.Stopwatch]::StartNew()
    Invoke-ApiRequest -Method GET -Path "/clients" | Out-Null
    $sw.Stop()
    $elapsed = [Math]::Round($sw.Elapsed.TotalSeconds, 1)
    if ($elapsed -lt $TIMEOUT_SEC) {
        Pass "API responde em ${elapsed}s com Mongo offline (< ${TIMEOUT_SEC}s — não trava)"
    } else {
        Fail "API trava ${elapsed}s com Mongo offline (hang — precisa de serverSelectionTimeoutMS)"
        Info "Correção sugerida em app/core/config.py:"
        Info "  MONGO_URL = 'mongodb://mongo:27017/?serverSelectionTimeoutMS=3000'"
    }

} finally {
    # ─── Reiniciar o MongoDB (SEMPRE — mesmo que algo falhe) ─────────────────
    Write-Step "Reiniciando MongoDB (finally)"
    docker compose start $MONGO_SERVICE 2>&1 | Out-Null

    $recovered = Wait-ApiHealth -MaxRetries 25 -DelaySec 2
    if ($recovered) {
        Pass "API se recuperou automaticamente após MongoDB voltar"
    } else {
        Fail "API NÃO recuperou após MongoDB voltar"
        docker compose restart api 2>&1 | Out-Null
        Start-Sleep 5
        Write-Host "  API reiniciada manualmente como fallback." -ForegroundColor DarkYellow
    }

    # Verificar integridade dos dados após recovery
    if ($fixtureId -and $recovered) {
        Write-Step "Verificando integridade dos dados após recovery"
        $r4 = Invoke-ApiRequest -Method GET -Path "/clients/$fixtureId"
        if ($r4.Status -eq 200) {
            Pass "Dados persistidos íntegros após restart (fixture encontrado)"
        } else {
            Fail "Fixture não encontrado após restart (status: $($r4.Status))"
        }
    }

    # Teardown: limpar fixture
    if ($fixtureId) {
        $del = Invoke-ApiRequest -Method DELETE -Path "/clients/$fixtureId"
        if ($del.Status -in @(204, 404)) {
            Write-Host "`n  [Cleanup] Fixture deletado." -ForegroundColor DarkGray
        }
    }
}

# ─── Resultado final ──────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " RESULTADO: $PASS passaram | $FAIL falharam" -ForegroundColor $(if ($FAIL -eq 0) { 'Green' } else { 'Red' })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if ($FAIL -gt 0) { exit 1 } else { exit 0 }
