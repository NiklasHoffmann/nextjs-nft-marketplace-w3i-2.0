# Health and Metrics

This project exposes basic health and metrics endpoints for operational monitoring.

## Endpoints

- `GET /api/health` - Service status and auto-start for background sync (public).
- `GET /api/admin/system/health` - Admin health checks (database, sync status, marketplace stats).
- `GET /api/admin/system/metrics` - Admin metrics (process uptime, memory, collection counts, sync status).

## Alerts

Recommended alerts (example thresholds):

- Health endpoint returns non-200 for > 5 minutes.
- `subgraph.status` is `stale` or `delayed` for > 10 minutes.
- `syncService.status` is `idle` and `recentUpdates` stays 0 for > 15 minutes.
- Database latency > 1000 ms for > 5 minutes.

## Notes

- Admin endpoints require a valid admin session cookie.
- For production, wire these endpoints into your monitoring system (e.g., UptimeRobot, Grafana, Datadog).
