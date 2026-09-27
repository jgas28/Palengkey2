# Palengkey 2.0

Customer-facing Palengkey app: one React + TypeScript SPA shared across Web, Android, and
iOS via Capacitor. Talks to the existing Laravel API.

## Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS · React Router · TanStack Query ·
Zustand · Axios · Capacitor

## Getting started

```bash
npm install
cp .env.example .env   # or edit .env.development for local dev
npm run dev             # http://localhost:5173
```

`VITE_API_URL` must point at a running instance of the Laravel API (`Palengkey-Admin`).
`.env.development` ships with a `http://localhost:8000/api` placeholder — update it to
match your local backend.

## Scripts

| Script                            | What it does                                            |
| --------------------------------- | ------------------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server                               |
| `npm run build`                   | Typecheck, then build for production into `dist/`       |
| `npm run preview`                 | Preview the production build locally                    |
| `npm run lint`                    | ESLint over the whole project                           |
| `npm run format` / `format:check` | Prettier write / check                                  |
| `npm test` / `test:watch`         | Run the Vitest suite once / in watch mode               |
| `npm run cap:sync`                | Sync the web build into the native Android/iOS projects |

## Project structure

Feature-oriented layout under `src/` — see `.claude/skills/palengkey-frontend/SKILL.md`
for the full rationale. Each domain (auth, cart, checkout, orders, tracking, …) owns its
folder under `src/features/`; cross-cutting API calls live in `src/services/api/`; shared
UI lives in `src/components/`.

## Mobile (Capacitor)

Android and iOS platforms are already added (`android/`, `ios/` — gitignored, regenerate
with `npx cap add android` / `npx cap add ios` if missing). After changing web code:

```bash
npm run build
npx cap sync
```

iOS builds require Xcode + CocoaPods on macOS; `pod install` is skipped automatically on
other platforms.

## Testing

Vitest + React Testing Library, jsdom environment. Tests live next to the code they cover
(`Component.test.tsx`). RTL cleanup runs automatically after each test via
`src/setupTests.ts`.
