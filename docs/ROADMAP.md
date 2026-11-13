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
- [x] Expo React Native starter for Android/iOS with registration, login, and coach chat.
- [x] Role-protected admin overview and bilingual exercise draft/publish/archive workflow.
- [x] Operator-only admin account promotion script; public signup cannot assign admin role.
- [x] Docker Compose deployment foundation for PostgreSQL, API, and web/PWA; CI builds both images.
- [x] Role-protected administrator metrics and exercise publishing/archive workflow.
- [x] CI typechecks the mobile client and exports Android/iOS JavaScript bundles.
- [x] Authenticated server-side AI coach endpoint with provider configuration kept on the API.
- [x] Arabic-first web chat panel with clear rule-based fallback labeling when no AI key is configured.
- [x] Coach request validation tests for empty, oversized, whitespace-only, and unexpected fields.
- [x] Authenticated nutrition log API with user-scoped reads/writes and bounded macro/calorie validation.
- [x] Equipment alias normalization (Arabic/English) and strict all-required-equipment matching in plan generation.
- [x] Mobile active-session restoration now reloads saved sets and uses the highest existing set number to avoid duplicate numbering.
- [x] Mobile nutrition screen shows same-day calorie and macro totals from user-entered logs.
- [x] Web nutrition entry form and recent-log history.
- [ ] Verify CI for the latest plan-generator and mobile-client commits.
- [ ] Add database-backed integration tests using a disposable PostgreSQL service.

## Next build tasks
1. Add plan progression recommendations based on completed sessions, with conservative increments and explicit pain/fatigue stop rules.
2. Add admin exercise editing (not only create/publish/archive), audit events, and user-support workflows.
3. Add mobile plan browsing/generation/activation and full completed-workout detail/history views.
4. Add database-backed integration tests using a disposable PostgreSQL service.
5. Expand AI Coach with conversation persistence, structured exercise recommendations, voice input/output, rate limits, and additional safety regression tests. Configure `OPENAI_API_KEY` only in the API deployment secret store to enable provider-backed responses.
6. Replace browser `sessionStorage` tokens with secure HttpOnly cookie sessions, add rate limiting and CSRF protections, then deploy a staging environment.
7. Establish reviewed Prisma migrations, HTTPS/reverse proxy, secrets management, database backups/restore drills, monitoring, and a production deployment.
8. Complete device QA, signed Android/iOS builds, privacy policy/terms review, accessibility, and store submission.
9. Add nutrition targets and progress charts only after collecting validated user-entered data.

## Status policy
A task is complete only after its files are committed and the relevant checks have passed. A design document is not proof of a working feature.
