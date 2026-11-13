
# ZYVON AI
### AI-Powered Human Performance Platform

**BECOME MORE.**

ZYVON AI is an intelligent fitness platform designed to help
people improve their strength, endurance, mobility, and
overall physical performance.

## 🚀 Vision

Build a personalized AI fitness coach that adapts to every
user's goals, fitness level, progress, and available equipment.

## 📱 Platforms

- Android
- iOS
- Web Application
- Admin Dashboard

## 🧠 AI Coach

- AI text conversations
- AI voice coaching
- Personalized workout plans
- Adaptive training recommendations
- Workout performance analysis

## 🏋️ Training Programs

- Muscle Building
- Fat Loss
- Strength Training
- Endurance
- Mobility & Flexibility
- Boxing & Kickboxing
- Combat Conditioning

## 🎥 Exercise Library

Every exercise can include:

- Exercise images
- Demonstration videos
- Audio instructions
- Muscle groups
- Equipment requirements
- Sets, reps, and rest periods
- Safety instructions

## 🥗 Smart Nutrition

- Daily calorie tracking
- Protein, carbohydrates, and fats
- Personalized meal guidance
- Nutrition progress tracking

## 🌍 Languages

- Arabic (RTL)
- English (LTR)

## 🎨 Brand Identity

- Brand: ZYVON AI
- Style: Futuristic Technology
- Primary: Electric Red
- Background: Charcoal Black
- Secondary: White

## 🛠️ Technology Stack

- Mobile: React Native / Expo
- Web: Next.js
- Backend: NestJS
- Database: PostgreSQL
- Cache: Redis
- AI: Provider-independent AI engine

## 🗂️ Project Structure

```text
ZYVON-AI/
├── apps/
│   ├── mobile/
│   ├── web/
│   └── api/
├── packages/
│   ├── shared/
│   ├── database/
│   ├── ai-engine/
│   └── localization/
├── docs/
│   ├── PRD.md
│   ├── ERD.md
│   └── API.md
├── infra/
└── README.md
```

## 🔐 Security

- Secure authentication
- Encrypted communication
- User data protection
- Role-based administration
- AI safety validation

## 💰 Business Model

Free at initial launch.

## 📌 Development Status

Version: 1.0.0

Status: Early MVP — active development

## ⚠️ Disclaimer

ZYVON AI is a fitness coaching platform, not a medical
diagnostic or treatment service.

Users should consult qualified professionals when needed.

## License

License to be determined.


---

## Developer setup (foundation stage)

### Requirements
- Node.js 20 or newer
- pnpm 9
- PostgreSQL 15 or newer (needed when the database phase is enabled)

### Install
```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

### Environment
Copy `.env.example` to `.env` and set a strong random `JWT_ACCESS_SECRET` plus your local PostgreSQL connection string. Do not commit `.env` or real API keys.

### Current repository contents
- `docs/`: product requirements, data model, API contract, and roadmap.
- `packages/shared/`: shared TypeScript domain contracts.
- `packages/localization/`: Arabic and English starter strings.
- `packages/database/`: initial Prisma schema and database package.
- Root workspace configuration: pnpm, TypeScript, ignore rules, and environment template.

### Development status
The repository contains a working-scope web MVP, NestJS API modules, Prisma data model, and automated CI checks. It is not yet a public production service: a provisioned production database, deployment, native mobile apps, AI coach integration, and release security work remain outstanding.

### Phone-only workflow
Open the repository in GitHub on your phone to review files and commits. For running builds and tests without a computer, use a browser-based development environment that supports Node.js and pnpm; do not paste secrets into public files or chat.


## Backend API — first implementation slice

The repository includes a NestJS API under `apps/api`:
- `GET /api/v1/health` — health check.
- `POST /api/v1/auth/register` — create an account using a bcrypt password hash.
- `POST /api/v1/auth/login` — verify credentials and issue a short-lived JWT.
- `GET /api/v1/users/me` — protected route requiring `Authorization: Bearer <token>`; checks the account is still active in PostgreSQL.
- `GET /api/v1/users/me/profile` — retrieve the signed-in user's fitness profile.

- `GET /api/v1/exercises` — public, paginated catalog of published exercises; supports `page`, `limit`, `q`, and `difficulty` filters.
- `GET /api/v1/exercises/:slug` — public details for one published exercise, including bilingual instructions, safety notes, and media.

- `POST /api/v1/workouts` — start a workout session for the signed-in user; an optional plan must belong to that user.
- `GET /api/v1/workouts` — list the signed-in user's workout history with pagination.
- `GET /api/v1/workouts/:id` — retrieve one of the signed-in user's sessions and its logged sets.
- `POST /api/v1/workouts/:id/sets` — log a set against a published exercise in an active session.
- `PATCH /api/v1/workouts/:id/complete` — complete an active session.
- `POST /api/v1/coach/chat` — authenticated fitness-coach chat. The API sends profile context to a server-side OpenAI-compatible provider when configured; otherwise it returns an explicitly labeled rule-based starter response. Provider keys must remain in API environment secrets.
- `PATCH /api/v1/users/me/profile` — create or update onboarding data (display name, birth date, height, weight, language, goal, experience, weekly training days, session duration, equipment, and optional safety notes). Only the authenticated user's own profile can be changed; unknown fields are rejected.

### Run locally
1. Install Node.js 20+ and pnpm 9.
2. Start PostgreSQL and create a database named `zyvon_ai`.
3. Copy `apps/api/.env.example` to `apps/api/.env` (or configure the same variables in the process environment).
4. Set `DATABASE_URL` and a unique `JWT_ACCESS_SECRET` with at least 32 characters.
5. Run `pnpm install`.
6. Run `pnpm --filter @zyvon/database db:generate`.
7. Run `pnpm --filter @zyvon/api dev`.

The API listens on port 4000 by default. For deployment, use HTTPS, a secret manager, a production database, rate limiting, refresh-token/session management, email verification, password reset, and security monitoring. Do not use sample secrets in production.

### Verification status
GitHub Actions validates the Prisma schema, generates Prisma Client, builds the API, runs DTO validation tests, and builds the web client. Check the latest run in the Actions tab before treating the current commit as verified. A live PostgreSQL integration test has not yet been run.


### Profile onboarding API

The profile endpoints are protected by the JWT guard. `PATCH` validates input and rejects unknown properties; supported ranges include height 100–230 cm, weight 25–350 kg, training 1–7 days/week, and sessions 10–180 minutes. Equipment is limited to 30 short labels, and optional safety notes are limited to 1,000 characters. A first profile can be created without a display name; the account email prefix is used as a temporary default. The profile endpoint returns only the signed-in user's record.

No live PostgreSQL integration test has been performed.

### Exercise catalog API

Only exercises with `PUBLISHED` status are visible through the public catalog. The list endpoint returns a stable page/limit pagination envelope and supports text search across Arabic/English names and slug, plus experience-level filtering. Draft and archived exercises are never exposed. The detail endpoint returns bilingual instructions, safety notes, and ordered media for the selected published exercise.

### Workout tracking API

Workout endpoints require a valid bearer token and scope every read/write by the authenticated user ID. Sessions can only be started against plans owned by the same user. Set logging requires a published exercise and an active session; each set must include repetitions or a duration. Completion is an atomic state transition from `IN_PROGRESS` to `COMPLETED`.

### Automated tests

The API CI job validates the Prisma schema, generates Prisma Client, builds the NestJS API, and runs DTO validation regression tests using Node's test runner through `tsx`.

### Web application (early MVP / installable PWA)

A responsive Arabic-first React/Vite client lives in `apps/web`. It includes account registration/login, profile onboarding, a published exercise catalog, workout start, per-set repetition and optional weight logging, workout completion, and workout history. Set numbering is restored from the API for the active workout. A first-pass training-plan generator is available based on profile settings and published exercises; it is rule-based, not an AI-generated coaching plan. It uses a short-lived access token in `sessionStorage`; production should move authentication to secure, HttpOnly cookies before public launch. Configure `VITE_API_BASE_URL` and set the API `CORS_ORIGIN` to the web app origin. Local web development runs on `http://localhost:5173`; the API runs on port `4000`.


### ZYVON AI Coach

The dashboard includes an Arabic chat panel backed by `POST /api/v1/coach/chat`. The endpoint requires authentication, accepts a message of 1–1,000 characters, and reads only the signed-in user's fitness profile. When `OPENAI_API_KEY` is configured on the API server, it calls an OpenAI-compatible Chat Completions endpoint using `OPENAI_BASE_URL` and `OPENAI_MODEL`. The key must never be placed in a browser variable or committed to Git.

Without a provider key, the endpoint returns a clearly labeled `RULE_BASED` starter response; this is not represented as a live AI model. The provider prompt instructs the coach not to diagnose injuries, prescribe medication, recommend extreme dieting, or encourage exercising through pain. The coach is educational and not a medical service. Configure the variables in `apps/api/.env.example` through your deployment secret manager.
