# ZYVON AI — Product Requirements Document

**Product:** ZYVON AI  
**Tagline:** BECOME MORE.  
**Version:** 1.0 — MVP definition  
**Status:** Approved foundation / implementation pending

## 1. Product vision
ZYVON AI is a multilingual, adaptive fitness and human-performance platform. It helps people build sustainable training habits and improve strength, endurance, mobility, and conditioning through an AI coach.

## 2. Release principles
- Initial release is free.
- Support Android, iOS, and Web.
- Provide an adaptive AI coach in both text and voice modes.
- Exercise learning content includes images, demonstration videos, and spoken instructions.
- Arabic (right-to-left) and English (left-to-right) are first-class languages.
- Provide a protected administration dashboard.
- The coach adapts recommendations to the user's goal, experience, progress, and available equipment.

## 3. Target users
1. Beginners who need clear, safe instructions.
2. Returning trainees rebuilding consistency and capacity.
3. Intermediate users pursuing strength, muscle development, fat loss, endurance, or mobility.
4. Users interested in boxing and kickboxing conditioning.

## 4. MVP scope
### Included
- Account registration, sign-in, sign-out, and profile.
- Onboarding: goal, experience level, training days, session duration, available equipment, and language.
- Personalized training plan and daily workout view.
- Exercise library with muscles, equipment, instructions, sets/reps/rest, media references, and safety notes.
- Workout session logging and progress history.
- AI coach chat interface with a provider-independent service boundary.
- Voice interaction interface prepared for speech-to-text and text-to-speech providers.
- Basic nutrition guidance and calorie/macronutrient logging (informational, not medical).
- Admin dashboard for managing users, exercises, programs, and content.
- Arabic/English localization and RTL/LTR layout.

### Not in the first MVP
- Payments or subscriptions.
- Social feed, public challenges, and user-to-user messaging.
- Medical diagnosis, rehabilitation prescriptions, or automated injury treatment.
- Wearable integrations.
- Unsupervised AI changes to a user's plan without validation.

## 5. Core user journeys
1. User creates an account and completes onboarding.
2. System creates a starter plan based on declared goals and constraints.
3. User opens today's session and views exercise demonstrations.
4. User records completed sets, reps, load, duration, or perceived effort.
5. System updates progress and proposes an adjusted next session.
6. User asks the AI coach a question by text or voice.
7. Admin reviews and maintains exercise and program content.

## 6. Adaptive coaching inputs
- Goal and experience level.
- Training availability and session duration.
- Equipment availability.
- Recent workout completion and performance.
- User feedback: difficulty, fatigue, and discomfort.
- Explicit safety restrictions supplied by the user.

The AI engine must return structured recommendations. The backend validates the output against allowed exercise IDs, session limits, and safety rules before saving or displaying it.

## 7. Safety and trust
- Clearly state that ZYVON AI is not a medical service.
- Ask users to stop an exercise that causes sharp pain, dizziness, chest pain, or unusual symptoms and seek appropriate help.
- Do not diagnose conditions or prescribe treatment.
- Flag reported pain, injuries, and red-flag symptoms for conservative guidance.
- Never recommend training through acute or worsening pain.
- Store only necessary profile and training data; enforce access controls.
- Keep AI provider credentials on the server, never in mobile or browser code.

## 8. Success metrics
- Onboarding completion rate.
- Weekly active users.
- Workout completion rate.
- 7-day and 30-day retention.
- AI coach helpfulness feedback.
- Exercise content completion and error rate.
- Crash-free sessions and API availability.

## 9. Functional acceptance criteria
- A user can register, sign in, and edit their profile.
- A user can complete onboarding in Arabic or English.
- A user can view a generated plan and its exercises.
- A user can log a workout and see it in history.
- An admin can create, edit, publish, and archive exercise content.
- API authorization prevents users from accessing another user's private records.
- AI responses are schema-validated and pass safety checks.
- The interface supports RTL Arabic and LTR English.

## 10. Initial technical direction
Use a TypeScript monorepo:
- Mobile: React Native with Expo.
- Web and admin: Next.js.
- API: NestJS.
- Database: PostgreSQL with Prisma.
- Cache and queues: Redis when required.
- Shared contracts and localization packages.
- AI provider adapter so providers can be changed without rewriting product logic.

## 11. Delivery phases
- Phase 1: product requirements, data model, API contract, repository foundation.
- Phase 2: authentication, profile, onboarding, database migrations.
- Phase 3: exercise library, programs, workout logging, progress.
- Phase 4: AI coach text, safety validation, adaptive plan service.
- Phase 5: voice integration, nutrition basics, admin dashboard.
- Phase 6: automated tests, security review, deployment, device testing.

**Current status:** This document defines the MVP. It does not claim that application features are implemented or tested.
