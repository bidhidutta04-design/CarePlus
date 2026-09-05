# API Contract — CarePlus HMS

> Source of truth is `GET /api/openapi.json` (also served at `/docs/openapi.json` and browsable at `/docs`).  
> This file records the frozen contract for the frontend team. Any breaking change must bump the version below and be reviewed.

## Version: 1.1.0 (2026-09-05)

### Envelope

- Success: `{ data: T, meta?: { total, page, pages, limit, ... } }`
- Error: `{ error: { code, message, details, requestId } }`
- Auth: `Authorization: Bearer <JWT>` (30m expiry). Refresh via `POST /api/auth/refresh` (httpOnly cookie or body). Audit `timestamp` fields are ISO-8601 dates.

### Endpoints (27)

| Method | Path                           | Auth               | Notes                                                                |
| ------ | ------------------------------ | ------------------ | -------------------------------------------------------------------- |
| GET    | `/health`                      | —                  | liveness (always 200)                                                |
| GET    | `/ready`                       | —                  | readiness: 200 connected, 503 degraded                               |
| POST   | `/api/auth/login`              | —                  | `{email,password}` → `{token, refreshToken, role, name, expiresIn}`  |
| POST   | `/api/auth/refresh`            | —                  | `{refreshToken}` → `{token, refreshToken}` (rotates, sets cookie)    |
| POST   | `/api/auth/logout`             | —                  | `{refreshToken}` (revokes, clears cookie)                            |
| GET    | `/api/auth/roles`              | —                  | 6 roles                                                              |
| GET    | `/api/patients`                | JWT                | `?search=&status=&bloodGroup=&page=&limit=&sort=&order=`             |
| GET    | `/api/patients/:id`            | JWT                | includes visits, labOrders, bills                                    |
| POST   | `/api/patients`                | Admin,Nurse        | Zod-validated                                                        |
| GET    | `/api/appointments`            | JWT                | `?status=&department=&priority=&search=&page=&limit=`                |
| POST   | `/api/appointments`            | Admin,Nurse        |                                                                      |
| PATCH  | `/api/appointments/:id/status` | Admin,Doctor,Nurse | guarded: Waiting→Triage→Doctor→Completed                             |
| GET    | `/api/beds`                    | JWT                | `?ward=&status=&page=&limit=` → `meta.occupancyPct`                  |
| PATCH  | `/api/beds/:id`                | Admin,Nurse,Doctor | admit/transfer/release                                               |
| GET    | `/api/pharmacy`                | JWT                | FEFO, `?lowStock=&page=&limit=`                                      |
| POST   | `/api/pharmacy/batches`        | Admin,Pharmacist   |                                                                      |
| POST   | `/api/pharmacy/dispense`       | Admin,Pharmacist   | atomic deduct + posts charge to open bill (returns `billId`)         |
| GET    | `/api/lab`                     | JWT                | `?status=&patientId=&page=&limit=`                                   |
| POST   | `/api/lab/orders`              | Admin,Doctor,Nurse |                                                                      |
| PATCH  | `/api/lab/:id`                 | Admin,LabTech      | forward-only                                                         |
| GET    | `/api/billing`                 | JWT                | `?status=&patientId=&page=&limit=` → `meta.billed/collected/pending` |
| POST   | `/api/billing/invoices`        | Admin,Cashier      | paise-exact totals; discount ≤ subtotal enforced                     |
| POST   | `/api/billing/:id/collect`     | Admin,Cashier      | rejects over-payment                                                 |
| GET    | `/api/doctors`                 | JWT                | `?department=&availability=&page=&limit=`                            |
| GET    | `/api/departments`             | JWT                | `?page=&limit=`                                                      |
| GET    | `/api/inventory`               | JWT                | `?lowStock=&category=&page=&limit=`                                  |
| POST   | `/api/inventory/:id/restock`   | Admin              | `{qty}`                                                              |
| GET    | `/api/staff`                   | JWT                | `?shift=&department=&page=&limit=`                                   |
| GET    | `/api/audit`                   | JWT                | append-only, `?page=&limit=`                                         |
| GET    | `/api/dashboard/stats`         | JWT                | aggregates for overview                                              |
| GET    | `/docs`                        | —                  | Swagger UI                                                           |
| GET    | `/api/openapi.json`            | —                  | this contract as JSON                                                |
| GET    | `/docs/openapi.json`           | —                  | same                                                                 |

### Pagination

Every list endpoint supports `?page=&limit=&sort=&order=` → `meta: { total, page, pages, limit }`. `limit` capped at 100, default 20.

### Changelog

- **1.1.0** — credential login (`{email,password}`, bcrypt users), `/ready` probe, ISO audit timestamps, dispense posts to billing, paise-exact invoice math with discount guard, atomic collect/dispense.
- **1.0.0** — initial freeze. Snapshot saved at `docs/openapi.snapshot.json`.

### One-command setup

```bash
docker compose up --build
# seed on first boot:
docker compose run --rm api npm run seed -w @careplus/backend
# or without docker:
# backend/.env → MONGODB_URI, then npm run dev (see README)
```

### CI gate

`.github/workflows/ci.yml` compares the live `openapi.json` snapshot to the committed `docs/openapi.snapshot.json` on every push — a breaking change without a version bump fails the build.
