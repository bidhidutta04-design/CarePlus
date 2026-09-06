# CarePlus — Enterprise Hospital Management System

Monorepo with a **separated frontend and backend**, production-grade layout:

```
CarePlus/
├── frontend/          # Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/       # Routes: (dashboard) 13 workstations, login
│   │   ├── components/# ui/ layout/ clinical/ shared/ print/
│   │   ├── store/     # Redux Toolkit (auth, clinical, ops)
│   │   ├── hooks/ lib/ types/
│   └── package.json   # @careplus/frontend
├── backend/           # Express 4 + TypeScript REST API (port 4000)
│   ├── src/
│   │   ├── routes/    # auth, patients, appointments, beds, pharmacy, lab, billing
│   │   ├── middleware.ts  # JWT auth, RBAC, Zod validation, error envelope
│   │   ├── store.ts   # Repository-style in-memory DB (swap for Prisma later)
│   │   └── app.ts / index.ts / config.ts / errors.ts
│   └── package.json   # @careplus/backend
├── docs/              # ROADMAP + specs
└── package.json       # npm workspaces root (scripts only)
```

## Quickstart

```bash
# from repo root
npm install

# one-command with Docker (api + mongo)
docker compose up --build
# seed on first boot in another shell:
docker compose run --rm api npm run seed -w @careplus/backend

# or without Docker (api :4000 + web :3000)
npm run dev

# or separately
npm run dev:backend
npm run dev:frontend
```

### Accessing in the Browser

Once the servers are running, you can open your browser and navigate to:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:4000/docs](http://localhost:4000/docs)


Backend needs env: copy `backend/.env.example` → `backend/.env` and set `JWT_SECRET`
(min 32 chars) and `MONGODB_URI` (default `mongodb://127.0.0.1:27017/careplus`).
Frontend API base: `frontend/.env.example` → `NEXT_PUBLIC_API_URL`.
Live docs: `http://localhost:4000/docs` (Swagger) and `http://localhost:4000/api/v1/openapi.json`.

## API contract (v2 — full table in `docs/API_CONTRACT.md`)

Base `http://localhost:4000/api/v1`, envelope `{ data, meta? }`, errors
`{ error: { code, message, details, requestId } }`.

| Method         | Route                                                                                   | Auth                | Notes                                                    |
| -------------- | --------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------- |
| GET            | `/health` / `/ready`                                                                    | —                   | liveness / readiness (503 when DB down)                  |
| POST           | `/api/v1/auth/login`                                                                    | —                   | `{email,password}` → `{token, refreshToken, role, name}` |
| POST           | `/api/v1/auth/refresh`                                                                  | —                   | rotates pair, sets httpOnly cookie                       |
| POST           | `/api/v1/auth/logout`                                                                   | —                   | revokes refresh token                                    |
| GET/POST       | `/api/v1/patients`                                                                      | JWT / Admin,Nurse   | paginated, filters                                       |
| GET            | `/api/v1/patients/:id`                                                                  | JWT                 | includes live visits, labOrders, bills                   |
| GET/POST/PATCH | `/api/v1/appointments`                                                                  | JWT / roles         | guarded status machine                                   |
| GET/PATCH      | `/api/v1/beds`                                                                          | JWT / roles         | admit/transfer/release + occupancy                       |
| GET/POST       | `/api/v1/pharmacy`                                                                      | JWT / roles         | atomic dispense, posts charge to billing                 |
| GET/POST/PATCH | `/api/v1/lab`                                                                           | JWT / roles         | forward-only 4-stage pipeline                            |
| GET/POST       | `/api/v1/billing`                                                                       | JWT / Admin,Cashier | paise-exact totals, atomic collect                       |
| GET            | `/api/v1/doctors`, `/departments`, `/inventory`, `/staff`, `/audit`, `/dashboard/stats` | JWT (audit: Admin)  | all paginated                                            |
| GET            | `/docs`, `/api/v1/openapi.json`                                                         | —                   | Swagger UI, frozen contract JSON                         |

Test login: `POST /api/v1/auth/login {"email":"admin@careplus.local","password":"Admin@123"}` (seeded dev user) → `Authorization: Bearer <token>`.

## Conventions

- Strict TypeScript, zero `any`; Zod schemas at every API boundary.
- `npm run typecheck` (also pre-commit hook) must pass in both workspaces.
- Frontend currently runs on seeded Redux state; integration path is
  `frontend/src/lib/apiClient.ts` → `NEXT_PUBLIC_API_URL` (already wired).
- Repo hygiene: `node_modules`, `.next`, `dist`, `.env` are git-ignored and
  were never meant to be committed.
