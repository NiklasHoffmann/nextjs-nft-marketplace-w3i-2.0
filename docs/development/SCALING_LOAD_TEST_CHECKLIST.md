# Scaling & Load Test Checklist

Praktische Checkliste, um zu verifizieren, dass die App unter gleichzeitiger Nutzung stabil bleibt (inkl. Redis-Cache, globalem Rate-Limit und SSE Pub/Sub).

## 1) Voraussetzungen

- Deployment mit **mindestens 2 Instanzen**
- `REDIS_URL` gesetzt
- `REDIS_DISABLED=false`
- Optional (empfohlen): `REDIS_SSE_CHANNEL` pro Umgebung eindeutig setzen
- Monitoring aktiv (Logs + Health Endpoints)

## 2) Health-Precheck (vor Lasttest)

### Öffentliche Health

`GET /api/health`

Erwartung:

- `infrastructure.redis.mode = "redis"`
- `infrastructure.redis.available = true`
- `infrastructure.redis.pingMs <= 50` (gut), `<= 100` (akzeptabel)
- `infrastructure.sse.instanceId` gesetzt

### Admin Health

`GET /api/admin/system/health`

Erwartung:

- `infrastructure.redis.available = true`
- `infrastructure.sse.redisSubscriberStatus` ist `ready` oder `connect`
- `database.latency <= 150ms` (akzeptabel)

## 3) Lasttest-Szenarien (MVP)

## Szenario A: Marketplace Read-Last

Ziel: Prüfen, dass Read-Traffic stabil und schnell bleibt.

- Endpoint: `GET /api/marketplace/items?limit=50&includeFilters=false`
- Last: 100 gleichzeitige Nutzer, 10 Minuten
- Zielwerte:
  - Error-Rate < 1%
  - p95 < 800ms
  - p99 < 1500ms

## Szenario B: Wallet Discovery Burst

Ziel: Prüfen, dass teure Wallet-Reads durch Dedupe/Cache abgefedert werden.

- Endpoint: `GET /api/wallet/nfts?address=<test_wallet>&source=auto`
- Last: 30 gleichzeitige Nutzer, 5 Minuten
- Zielwerte:
  - Error-Rate < 2%
  - p95 < 2000ms
  - wiederholte Requests zeigen Cache-Hits (`X-Cache: HIT`, `HIT-SHARED`, `HIT-INFLIGHT`)

## Szenario C: Realtime Event-Fanout (2+ Instanzen)

Ziel: Prüfen, dass ein Event auf Instanz A bei SSE-Clients auf Instanz B/C ankommt.

- Testablauf:
  1. Mehrere Browser/Tabs verbinden auf `/api/events/subscribe` (über App)
  2. Marketplace-Event auslösen (List/Buy/Cancel)
  3. Prüfen, dass alle Clients Update erhalten
- Zielwerte:
  - Event-Fanout-Latenz (Emitter → letzter Client) < 2s
  - Keine dauerhaften `redis publish failed` / `Redis subscriber error` Logs

## 4) Pass/Fail Kriterien

Ein Testlauf gilt als **bestanden**, wenn alle Punkte erfüllt sind:

- Redis im Health-Check verfügbar (`available=true`)
- SSE-Subscriber ist verbunden (`ready`/`connect`)
- Error-Raten bleiben unter Zielwerten
- p95/p99 bleiben unter Zielwerten
- Keine eskalierenden Memory-/CPU-Trends über Testdauer

## 5) Schnelle Diagnose bei Problemen

Wenn Grenzwerte gerissen werden:

1. Health prüfen (`/api/health`, `/api/admin/system/health`)
2. Redis-Status prüfen (`mode`, `available`, `pingMs`)
3. SSE-Status prüfen (`redisSubscriberInitialized`, `redisSubscriberStatus`, `activeConnections`)
4. Logs auf diese Patterns filtern:
   - `Redis connect failed`
   - `Redis publish failed`
   - `Redis subscriber error`
   - `RATE_LIMIT_EXCEEDED`
5. Falls Redis instabil: kurzfristig Fallback akzeptieren, aber Lasttest als **nicht bestanden** markieren (Multi-Instance-Kriterium)

## 6) Empfehlung für regelmäßige Durchführung

- Vor jedem größeren Release
- Nach Änderungen an Cache/Rate-Limit/SSE
- Mindestens 1x pro Woche in Staging
