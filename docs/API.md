# ZYVON AI — API Contract (MVP)

**Base path:** `/api/v1`  
**Format:** JSON over HTTPS  
**Authentication:** Bearer access token (implementation detail to be finalized)

All endpoints must validate input, return consistent errors, and enforce ownership on private resources.

## Response conventions

Success:
```json
{ "data": {}, "meta": {} }
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated",
    "details": []
  }
}
```

## Authentication
- POST `/auth/register` — create account.
- POST `/auth/login` — authenticate.
- POST `/auth/refresh` — refresh session.
- POST `/auth/logout` — revoke session.
- GET `/auth/me` — current authenticated user.

## Profile and onboarding
- GET `/users/me/profile`
- PATCH `/users/me/profile`
- POST `/users/me/onboarding`

## Training plans
- GET `/plans` — list only the authenticated user's plans.
- POST `/plans/generate` — create a first-pass rule-based draft from the user's profile and published exercises for their experience level.
- GET `/plans/:planId` — retrieve an owned plan and its ordered days/exercises.
- POST `/plans/:planId/activate` — activate an owned plan and archive the user's previously active plan.
- GET `/plans/progression/recommendations` — conservative suggestions based on the user's two most recent completed sessions; suppresses progression when pain-related feedback or very high effort is recorded.

The current generator is a deterministic starter-plan feature. It is not the AI Coach and does not replace individualized professional assessment.

## Exercise library
- GET `/exercises` — published exercises, searchable and filterable.
- GET `/exercises/:exerciseId`
- Admin only:
  - POST `/admin/exercises`
  - PATCH `/admin/exercises/:exerciseId` — update bilingual exercise content, equipment, muscles, difficulty, and safety notes.
  - PATCH `/admin/exercises/:exerciseId/status` — set `DRAFT`, `PUBLISHED`, or `ARCHIVED`.

## User feedback
- POST `/feedback` — submit an authenticated rating (1–5) and optional comment.
- GET `/feedback/mine` — list only the signed-in user's latest feedback entries.

## Workout logging
- POST `/workouts` — start session.
- GET `/workouts` — current user's history.
- GET `/workouts/:workoutId`
- POST `/workouts/:workoutId/sets`
- PATCH `/workouts/:workoutId/complete`

Set logging request fields: `exerciseId` and `setNumber` are required; provide `reps` or `durationSeconds`; `loadKg` and `completed` are optional. Set numbers start at 1 for each exercise in a workout. The current web client increments these locally during the active browser session.

## AI coach
- POST `/coach/conversations`
- GET `/coach/conversations`
- GET `/coach/conversations/:conversationId/messages`
- POST `/coach/conversations/:conversationId/messages`

Example request:
```json
{
  "message": "Help me plan today's workout",
  "language": "en",
  "context": { "sessionMinutes": 40 }
}
```

AI responses must be validated server-side. Never expose provider API keys to clients. The AI service must not diagnose or treat medical conditions.

## Nutrition
- GET `/nutrition/logs`
- POST `/nutrition/logs`
- PATCH `/nutrition/logs/:logId`
- DELETE `/nutrition/logs/:logId`

## Administration
- GET `/admin/feedback` — administrator-only latest user ratings and comments.
- GET `/admin/overview`
- GET `/admin/users`
- GET `/admin/content/exercises`
- All admin routes require server-verified ADMIN role.

## HTTP status guidance
- 200 successful read/update.
- 201 resource created.
- 204 successful deletion with no response body.
- 400 invalid request.
- 401 missing or invalid authentication.
- 403 authenticated but not authorized.
- 404 resource not found or not visible to caller.
- 409 conflicting state.
- 422 semantically invalid request.
- 429 rate limit exceeded.
- 500 unexpected server error.

This contract is a design baseline; endpoint implementations and automated contract tests are not yet complete.
