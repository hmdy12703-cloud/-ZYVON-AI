# Production readiness and database migration policy

## Current release gate

The repository currently has a Prisma schema but no committed Prisma migration history. Therefore a production database rollout is **blocked** until a reviewed initial migration is created, tested against an empty PostgreSQL database, and verified against any existing data that must be retained.

Do not run `prisma db push` against production. It synchronizes schema state directly and is not a reviewed, versioned migration process.

## Docker safety behavior

The API container no longer runs schema synchronization automatically. This prevents a routine container restart or deployment from silently changing a persistent database.

- Default: `ALLOW_PRISMA_DB_PUSH=false`; API starts without modifying the database.
- Development only: set `ALLOW_PRISMA_DB_PUSH=true` for a disposable local database when intentionally applying the current Prisma schema.
- Never enable this flag for production or for a database containing user data.

With the default setting, a brand-new database has no application tables until a reviewed migration is applied. The API may consequently fail its health check. This is intentional fail-safe behavior, not a completed deployment workflow.

## Required before production

1. Create and commit an initial Prisma migration from the reviewed schema.
2. Test `prisma migrate deploy` against a clean PostgreSQL instance and a copy of any existing database.
3. Add a dedicated migration job that runs before the API rollout; do not migrate independently from every API replica.
4. Configure production secrets in the hosting provider's secret manager.
5. Restrict CORS to exact HTTPS origins; put the API behind HTTPS.
6. Add authentication rate limiting, secure session/refresh-token handling, CSRF protections where cookie auth is used, and account recovery.
7. Verify database backups and perform a restore drill.
8. Run device QA and produce signed Android and iOS builds.
9. Complete privacy policy, terms, monitoring, alerting, and incident-response review.

## Verified CI scope

The current GitHub Actions workflow validates Prisma schema, generates Prisma Client, builds the API and web app, runs API validation and PostgreSQL integration tests, typechecks the mobile app, exports Android/iOS JavaScript bundles, and builds API/web Docker images.

A successful CI run does not prove a production deployment, signed store binaries, live provider credentials, real-device behavior, or production database migration readiness.

## Authentication request throttling

The API applies conservative per-IP limits to public authentication routes:

- Login: 10 requests per 15 minutes per IP.
- Registration: 5 requests per hour per IP.
- Excess requests receive HTTP 429 and a `Retry-After` header.
- Expired buckets are reset and the in-memory map is bounded.

This implementation is process-local. It is a useful baseline for a single API instance, but it is not a distributed limiter: multiple API replicas each maintain separate counters, and restarts clear the counters. Before horizontally scaling or relying on it as a production abuse-control boundary, move the counters to a shared atomic store such as Redis and configure trusted proxy IP ranges correctly. Do not blindly trust arbitrary `X-Forwarded-For` headers.
