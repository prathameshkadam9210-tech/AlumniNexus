# Copilot instructions for AI-powered Digital Alumni Portal

## Project snapshot

This repository is a Next.js 16 app using the App Router, TypeScript, Tailwind CSS, and shadcn/ui components. It is an alumni portal with role-based views for students, alumni, recruiters, placement cell users, and admins.

The app structure is intentionally feature-oriented:

- `src/app` hosts the Next.js app shell and API routes.
- `src/app/api/*/route.ts` contains the server-side feature handlers for auth, jobs, mentorships, events, registrations, applications, payments, certificates, fundraising, analytics, AI, and uploads.
- `src/components/portal/*` contains the UI modules for Dashboard, Jobs, Events, Profile, AI Assistant, Notifications, Admin, etc.
- `src/store/app-store.ts` is the main client-side state store for auth, current view, and fetched data.
- `prisma/schema.prisma` is the canonical data model and uses SQLite via `DATABASE_URL` from `.env`.
- `mini-services/notification-service/` is a separate Bun notification service; it is not the main app and should not be treated as the app's primary runtime.

## Build, lint, and local run commands

These are the commands defined in `package.json`:

- Install dependencies: `npm install`
- Start the local app: `npm run dev`
- Production build: `npm run build`
- Run the built app: `npm start`
- Lint: `npm run lint`
- Database push (sync schema): `npm run db:push`
- Generate Prisma client: `npm run db:generate`
- Create a migration during development: `npm run db:migrate`
- Reset DB with migrations: `npm run db:reset`
- Seed the database: `npm run db:seed`
- Full local setup: `npm run setup`

Testing:

- No `test` script is configured in `package.json`.
- No automated test files were found in the repository (`*.test.*` / `*.spec.*` are absent), so there is no single-test command to run in this repo today.
- Prefer `npm run lint` and `npm run build` for validation while working in this project.

## Architecture and how the repo is organized

### App + API split

The repository is not organized as a classic backend/frontend split. The main application is a single Next.js project where:

- the UI is assembled from feature modules in `src/components/portal/`
- the page-level auth/authentication gating lives in `src/app/page.tsx`
- business logic and persistence are handled through route handlers in `src/app/api/*/route.ts`

When adding a feature, follow that same pattern: update the route handler for the data access, then wire the UI view and store data shape to it.

### State management

`src/store/app-store.ts` is the central app state. It manages:

- current user + auth state
- roles and permissions
- jobs, applications, events, notifications, analytics, payments, certificates, and registrations
- the current portal view (`currentView`)

Keep app-wide data in this store instead of creating ad hoc client-side state in individual components unless the state is truly local to one component.

### Prisma + SQLite

The repo uses Prisma with SQLite. The database schema is defined in `prisma/schema.prisma` and is the source of truth for persisted entities such as `User`, `Job`, `Application`, `Event`, `Notification`, `Payment`, and `Certificate`.

When adding or changing persisted data:

- update `prisma/schema.prisma`
- run `npm run db:generate` (and `npm run db:push` / `npm run db:migrate` depending on the workflow)
- keep the route handlers and the Zustand store aligned with the data shape

### Role-based portal navigation

`src/components/portal/nav.tsx` defines a role-aware navigation model and lazy-loads feature modules based on `currentView`. The user-facing app uses `NAV_ITEMS` and `VIEW_LABELS` to gate access by role. Do not add new portal features in a way that bypasses this role-based structure.

### Separate microservice

`mini-services/notification-service` is its own small Bun app. It is used for notifications and is not part of the main Next.js app's request flow. Changes there should be isolated and not assumed to update the main portal automatically unless the integration is explicitly wired.

## Key conventions specific to this repo

- Use existing shadcn/ui primitives from `src/components/ui/*` instead of creating one-off custom UI widgets when the component already exists.
- Keep the app state in `useAppStore` instead of introducing new global stores or context providers unless a feature genuinely needs a different pattern.
- Prefer route handlers in `src/app/api/.../route.ts` for server requests and persistence; the app already uses this pattern consistently.
- Follow the feature/role layout already used in `src/components/portal`: each major portal feature has its own module, not a new top-level app shell.
- Treat `prisma/schema.prisma` and `.env` as project-critical configuration; do not assume another database backend is in use.
- Keep environment-sensitive values in `.env` and avoid hardcoding secrets or credentials in code.
- The project uses `next dev -p 3000` and exposes the app on port 3000 locally.

## Existing repo docs to respect

This repo does not currently include a root-level `README.md`, `AGENTS.md`, `CLAUDE.md`, or similar instruction file, so there are no additional repo-specific AI instructions to merge in. The substantive project guidance here is based on the actual app structure and scripts in the repository.
