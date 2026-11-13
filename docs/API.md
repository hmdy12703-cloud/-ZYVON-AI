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
- GET `/plans` — current user's plans.
- POST `/plans/generate` — request a validated starter plan.
- GET `/plans/:planId`
- PATCH `/plans/:planId` — only permitted plan fields.
- POST `/plans/:planId/activate`

## Exercise library
- GET `/exercises` — published exercises, searchable and filterable.
- GET `/exercises/:exerciseId`
- Admin only:
  - POST `/admin/exercises`
  - PATCH `/admin/exercises/:exerciseId`
  - POST `/admin/exercises/:exerciseId/publish`

## Workout logging
- POST `/workouts` — start session.
- GET `/workouts` — current user's history.
- GET `/workouts/:workoutId`
- POST `/workouts/:workoutId/sets`
- POST `/workouts/:workoutId/complete`

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
