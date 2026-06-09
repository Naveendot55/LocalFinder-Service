# Local Service Finder

A full-stack SaaS platform that connects users with local service providers (electricians, plumbers, tutors, cleaners, etc.) — similar to UrbanClap / Thumbtack.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/local-service-finder run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`), stored in localStorage as `lsf_token`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema: `users.ts`, `services.ts`, `bookings.ts`, `reviews.ts`
- `artifacts/api-server/src/routes/` — `auth.ts`, `services.ts`, `bookings.ts`, `reviews.ts`, `admin.ts`
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware + `requireRole()` helper
- `artifacts/local-service-finder/src/` — React frontend
- `artifacts/local-service-finder/src/contexts/AuthContext.tsx` — auth state management
- `lib/api-client-react/src/generated/` — generated React Query hooks

## Architecture decisions

- JWT tokens stored in localStorage under key `lsf_token`; custom fetch attaches `Authorization: Bearer <token>` header automatically
- Services are created in `pending` status; admin must approve them to make them `active` (visible to users)
- Reviews can only be submitted after a booking reaches `completed` status
- OpenAPI-first: all endpoints defined in `openapi.yaml`, then codegen produces both Zod server validators and React Query client hooks
- Role-based access: `user`, `provider`, `admin` — enforced via `requireRole()` middleware on protected routes

## Product

- **Landing page** — Hero with search, category grid, featured services, and how-it-works section
- **Service browse** — Search + filter by category, location, and price
- **Service detail** — Full description, provider info, booking form, reviews
- **User dashboard** — My bookings, booking status tracking, leave reviews on completed bookings
- **Provider dashboard** — Stats (bookings, ratings), manage listings, accept/reject bookings
- **Admin dashboard** — Platform stats, approve/reject service listings, view all users

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@localservice.com | admin123 |
| Provider | raj@provider.com | pass123 |
| Provider | priya@provider.com | pass123 |
| User | john@user.com | pass123 |
| User | sarah@user.com | pass123 |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before typechecking api-server — stale lib declarations cause false "no exported member" errors
- After any `openapi.yaml` change, run codegen before touching server routes
- The `services/categories` and `services/featured` routes must be defined BEFORE `services/:id` in Express to avoid path conflicts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
