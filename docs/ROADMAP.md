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

## Current implementation status
- [x] Monorepo workspace, shared contracts, localization starter, and Prisma schema.
- [x] NestJS API health, authentication, profile, exercise catalog, and workout tracking slices.
- [x] React/Vite web MVP for authentication, onboarding, exercise browsing, workout logging, and history.
- [x] Resume active workouts and restore per-exercise set counts from API records.
- [x] Rule-based starter training-plan generation, listing, and activation.
- [x] Installable PWA manifest, icon, and basic offline app-shell fallback.
- [x] CI workflow includes Prisma validation, API build, API DTO tests, and web build.
- [x] Web client restores an active workout from the API and displays its saved sets after reload.
- [x] Web client displays training-plan day and exercise details.
- [ ] Verify the latest CI run after the most recent web workout-logging changes.
- [ ] Add database-backed integration tests using a disposable PostgreSQL service.

## Next build tasks
1. Load active workout sets from the API so set numbering survives refreshes and multiple devices.
2. Add editable exercise selection and full workout detail/history views.
3. Add editable training-plan details, progression logic, and plan ownership regression tests.
4. Add the real AI Coach behind a server-side provider adapter, structured outputs, safety checks, privacy controls, and tests.
5. Add secure production authentication/session handling and deploy a staging environment.
6. Build native Android/iOS clients after the web/API contracts stabilize; the current PWA is not a native app.

## Status policy
A task is complete only after its files are committed and the relevant checks have passed. A design document is not proof of a working feature.
