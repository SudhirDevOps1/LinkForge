# 🚀 Production Readiness & Operations Guide

This guide details best practices, operational checklists, backup strategies, and monitoring procedures for running LinkForge in mission-critical production environments.

---

## ✅ Production Checklist

Before launching LinkForge to public audiences, verify each configuration:

- [ ] **Cryptographic Secrets**: `BETTER_AUTH_SECRET` and `AUTH_SECRET` are set to at least 32 cryptographically random bytes generated via `openssl rand -hex 32`.
- [ ] **ALTCHA Proof-of-Work**: `ALTCHA_HMAC_KEY` is configured to prevent bot registrations and brute-force login attempts.
- [ ] **SSL / TLS Enforcement**: Domain enforces HTTPS (`Strict-Transport-Security` header active).
- [ ] **Database Connection Limits**: If using serverless environments (Vercel, AWS Lambda), verify connection pooling is active (e.g. Neon HTTP driver or Supabase Transaction Pooler on port 6543).
- [ ] **Storage Buckets & CORS**: S3 / B2 / R2 bucket CORS allows PUT and GET requests from your production domain.
- [ ] **Rate Limiting**: Multi-instance deployments have configured Upstash Redis (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) for shared rate-limiting state.
- [ ] **Daily Blog Engine**: Public blog feed loads dynamically and manifest is verified in object storage.

---

## 💾 Database Backup & Recovery

### PostgreSQL / Neon Backup
To perform an automated backup of your PostgreSQL database:

```bash
# Dump the complete LinkForge schema and data:
pg_dump "$DATABASE_URL" --format=custom --no-owner --file=linkforge_backup_$(date +%F).dump

# Restore from backup:
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" linkforge_backup_2026-09-11.dump
```

### SQLite / Turso Backup
```bash
# Turso point-in-time backup:
turso db dump linkforge > linkforge_backup_$(date +%F).sql
```

---

## 🔍 Health Checks & Monitoring

LinkForge exposes an unauthenticated health check endpoint for uptime monitoring services (e.g. BetterStack, UptimeRobot, Datadog):

* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-11T12:00:00.000Z",
  "uptimeSeconds": 86400
}
```
If the database connection fails, the endpoint responds with `HTTP 503 Service Unavailable`.
