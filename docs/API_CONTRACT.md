# API Contract — CarePlus HMS

> Source of truth is `GET /api/openapi.json` (also served at `/docs/openapi.json` and browsable at `/docs`).  
> This file records the frozen contract for the frontend team. Any breaking change must bump the version below and be reviewed.

## Version: 2.0.0 (2026-09-05) — all routes moved to `/api/v1/v1` prefix

## Previous: Version 1.1.0 (2026-09-05)

### Envelope

- Success: `{ data: T, meta?: { total, page, pages, limit, ... } }`
- Error: `{ error: { code, message, details, requestId } }`
- Auth: `Authorization: Bearer <JWT>` (30m expiry). Refresh via `POST /api/auth/refresh` (httpOnly cookie or body). Audit `timestamp` fields are ISO-8601 dates.

### Endpoints (27)

| Method | Path                              | Auth               | Notes                                                                |
| ------ | --------------------------------- | ------------------ | -------------------------------------------------------------------- |
| GET    | `/health`                         | —                  | liveness (always 200)                                                |
| GET    | `/ready`                          | —                  | readiness: 200 connected, 503 degraded                               |
| POST   | `/api/v1/auth/login`              | —                  | `{email,password}` → `{token, refreshToken, role, name, expiresIn}`  |
| POST   | `/api/v1/auth/refresh`            | —                  | `{refreshToken}` → `{token, refreshToken}` (rotates, sets cookie)    |
| POST   | `/api/v1/auth/logout`             | —                  | `{refreshToken}` (revokes, clears cookie)                            |
| GET    | `/api/v1/auth/roles`              | —                  | 6 roles                                                              |
| GET    | `/api/v1/patients`                | JWT                | `?search=&status=&bloodGroup=&page=&limit=&sort=&order=`             |
| GET    | `/api/v1/patients/:id`            | JWT                | includes visits, labOrders, bills                                    |
| POST   | `/api/v1/patients`                | Admin,Nurse        | Zod-validated                                                        |
| GET    | `/api/v1/appointments`            | JWT                | `?status=&department=&priority=&search=&page=&limit=`                |
| POST   | `/api/v1/appointments`            | Admin,Nurse        |                                                                      |
| PATCH  | `/api/v1/appointments/:id/status` | Admin,Doctor,Nurse | guarded: Waiting→Triage→Doctor→Completed                             |
| GET    | `/api/v1/beds`                    | JWT                | `?ward=&status=&page=&limit=` → `meta.occupancyPct`                  |
| PATCH  | `/api/v1/beds/:id`                | Admin,Nurse,Doctor | admit/transfer/release                                               |
| GET    | `/api/v1/pharmacy`                | JWT                | FEFO, `?lowStock=&page=&limit=`                                      |
| POST   | `/api/v1/pharmacy/batches`        | Admin,Pharmacist   |                                                                      |
| POST   | `/api/v1/pharmacy/dispense`       | Admin,Pharmacist   | atomic deduct + posts charge to open bill (returns `billId`)         |
| GET    | `/api/v1/lab`                     | JWT                | `?status=&patientId=&page=&limit=`                                   |
| POST   | `/api/v1/lab/orders`              | Admin,Doctor,Nurse |                                                                      |
| PATCH  | `/api/v1/lab/:id`                 | Admin,LabTech      | forward-only                                                         |
| GET    | `/api/v1/billing`                 | JWT                | `?status=&patientId=&page=&limit=` → `meta.billed/collected/pending` |
| POST   | `/api/v1/billing/invoices`        | Admin,Cashier      | paise-exact totals; discount ≤ subtotal enforced                     |
| POST   | `/api/v1/billing/:id/collect`     | Admin,Cashier      | rejects over-payment                                                 |
| GET    | `/api/v1/doctors`                 | JWT                | `?department=&availability=&page=&limit=`                            |
| GET    | `/api/v1/departments`             | JWT                | `?page=&limit=`                                                      |
| GET    | `/api/v1/inventory`               | JWT                | `?lowStock=&category=&page=&limit=`                                  |
| POST   | `/api/v1/inventory/:id/restock`   | Admin              | `{qty}`                                                              |
| GET    | `/api/v1/staff`                   | JWT                | `?shift=&department=&page=&limit=`                                   |
| GET    | `/api/v1/audit`                   | JWT                | append-only, `?page=&limit=`                                         |
| GET    | `/api/v1/dashboard/stats`         | JWT                | aggregates for overview                                              |
| GET    | `/docs`                           | —                  | Swagger UI                                                           |
| GET    | `/api/v1/openapi.json`            | —                  | this contract as JSON                                                |
| GET    | `/docs/openapi.json`              | —                  | same                                                                 |

### Pagination

Every list endpoint supports `?page=&limit=&sort=&order=` → `meta: { total, page, pages, limit }`. `limit` capped at 100, default 20.

### Changelog

- **2.0.0** — `/api/v1` version prefix on all API routes (breaking: old unversioned paths removed).
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
