# ZYVON AI — Implementation Roadmap

## Confirmed product decisions
- Platforms: Android, iOS, Web.
- Launch pricing: free.
- Coaching: text and voice.
- Exercise learning: images, video, and spoken explanation.
- Languages: Arabic and English.
- Admin dashboard: required.
- Coaching: adaptive to user level, goals, and progress.
- Development constraint: owner is working from an Android phone; use browser-accessible cloud workflows.

## Delivery gates

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 1. Foundation | PRD, ERD, API contract, repository structure | Documents reviewed and repository files committed |
| 2. Backend core | NestJS API, Prisma schema, PostgreSQL setup, auth | Migrations and auth tests pass |
| 3. Training core | Exercise library, plans, workout logging | User can complete and review a workout |
| 4. AI coach | Provider adapter, prompt policies, safety validation | Structured response tests and safety tests pass |
| 5. Clients | Expo mobile app, Next.js web/admin, localization | Main journeys work in Arabic and English |
| 6. Release readiness | CI, security checks, deployment, device QA | Build, tests, and smoke tests pass |

## Immediate next build tasks
1. Add monorepo workspace configuration.
2. Add shared TypeScript contracts and localization resources.
3. Add Prisma schema and initial migration.
4. Add API health endpoint and authentication module.
5. Add a minimal mobile onboarding and workout shell.
6. Add a minimal web/admin shell with server-side role checks.

## Status policy
A task is complete only after its files are committed and the relevant checks have passed. A design document is not proof of a working feature.
