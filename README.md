
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

Status: Initial Development

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
The repository now contains the product specification and the first monorepo/database foundations. This is **not yet a runnable end-user application**: authentication, API modules, mobile screens, web screens, database migrations, AI integration, and automated tests remain to be implemented and verified.

### Phone-only workflow
Open the repository in GitHub on your phone to review files and commits. For running builds and tests without a computer, use a browser-based development environment that supports Node.js and pnpm; do not paste secrets into public files or chat.
