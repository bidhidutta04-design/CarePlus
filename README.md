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

Backend needs env: copy `backend/.env.example` → `backend/.env` and set `JWT_SECRET`
(min 32 chars) and `MONGODB_URI` (default `mongodb://127.0.0.1:27017/careplus`).
Frontend API base: `frontend/.env.example` → `NEXT_PUBLIC_API_URL`.
Live docs: `http://localhost:4000/docs` (Swagger) and `http://localhost:4000/api/openapi.json`.

## API contract

Base `http://localhost:4000`, envelope `{ data, meta? }`, errors
`{ error: { code, message, details } }`.

| Method    | Route                          | Auth                           | Notes                                     |
| --------- | ------------------------------ | ------------------------------ | ----------------------------------------- |
| GET       | `/health`                      | —                              | liveness                                  |
| POST      | `/api/auth/login`              | —                              | `{role,name}` → JWT                       |
| GET       | `/api/auth/roles`              | —                              | 6 workstation roles                       |
| GET/POST  | `/api/patients`                | JWT / Admin,Nurse for POST     | `?search=&status=&bloodGroup=`            |
| GET       | `/api/patients/:id`            | JWT                            | includes visits, labs, bills              |
| GET/POST  | `/api/appointments`            | JWT / Admin,Nurse for POST     | filters + guarded status machine          |
| PATCH     | `/api/appointments/:id/status` | Admin,Doctor,Nurse             | Waiting→Triage→Doctor→Completed           |
| GET/PATCH | `/api/beds`                    | JWT / Admin,Nurse,Doctor       | admit/transfer/release + occupancy        |
| GET       | `/api/pharmacy`                | JWT                            | FEFO sorted, `?lowStock=true`             |
| POST      | `/api/pharmacy/batches`        | Admin,Pharmacist               | Zod-validated intake                      |
| POST      | `/api/pharmacy/dispense`       | Admin,Pharmacist               | stock check → deduct → charge             |
| GET/POST  | `/api/lab`                     | JWT / Admin,Doctor,Nurse order | 4-stage pipeline                          |
| PATCH     | `/api/lab/:id`                 | Admin,LabTech                  | forward-only stage advance                |
| GET/POST  | `/api/billing`                 | JWT / Admin,Cashier invoice    | totals + tax computed server-side         |
| POST      | `/api/billing/:id/collect`     | Admin,Cashier                  | rejects over-payment                      |
| GET       | `/api/doctors`                 | JWT                            | `?department=&availability=&page=&limit=` |
| GET       | `/api/departments`             | JWT                            | `?page=&limit=`                           |
| GET       | `/api/inventory`               | JWT                            | `?lowStock=&category=&page=&limit=`       |
| POST      | `/api/inventory/:id/restock`   | Admin                          | `{qty}`                                   |
| GET       | `/api/staff`                   | JWT                            | `?shift=&department=&page=&limit=`        |
| GET       | `/api/audit`                   | JWT                            | append-only, `?page=&limit=`              |
| GET       | `/api/dashboard/stats`         | JWT                            | aggregates for overview                   |
| GET       | `/docs`                        | —                              | Swagger UI                                |
| GET       | `/api/openapi.json`            | —                              | frozen contract                           |

Test token: `POST /api/auth/login {"role":"Admin","name":"Tester"}` →
`Authorization: Bearer <token>` (also returns `refreshToken`; see `docs/API_CONTRACT.md`).

## Conventions

- Strict TypeScript, zero `any`; Zod schemas at every API boundary.
- `npm run typecheck` (also pre-commit hook) must pass in both workspaces.
- Frontend currently runs on seeded Redux state; integration path is
  `frontend/src/lib/apiClient.ts` → `NEXT_PUBLIC_API_URL` (already wired).
- Repo hygiene: `node_modules`, `.next`, `dist`, `.env` are git-ignored and
  were never meant to be committed.
