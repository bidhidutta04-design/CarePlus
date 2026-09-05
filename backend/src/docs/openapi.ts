export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CarePlus HMS API",
    version: "1.0.0",
    description:
      "Hospital Management REST API — patients, appointments, beds, pharmacy, lab, billing, doctors, departments, inventory, staff, audit and dashboard. All responses use { data, meta? } and errors use { error: { code, message, details } }.",
  },
  servers: [{ url: "http://localhost:4000/api/v1", description: "local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http" as const, scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object", nullable: true },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: { summary: "Liveness", responses: { "200": { description: "ok" } }, security: [] },
    },
    "/ready": {
      get: {
        summary: "Readiness (200 connected, 503 degraded)",
        responses: { "200": { description: "ready" } },
        security: [],
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Credential login (email + password)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "tokens" } },
        security: [],
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Refresh access token",
        responses: { "200": { description: "new token" } },
        security: [],
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Revoke refresh token",
        responses: { "200": { description: "revoked" } },
        security: [],
      },
    },
    "/api/v1/auth/roles": {
      get: { summary: "List roles", responses: { "200": { description: "roles" } }, security: [] },
    },
    "/api/v1/patients": {
      get: {
        summary: "List patients",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "list" } },
      },
      post: { summary: "Create patient", responses: { "201": { description: "created" } } },
    },
    "/api/v1/patients/{id}": {
      get: { summary: "Get patient with visits", responses: { "200": { description: "patient" } } },
    },
    "/api/v1/appointments": {
      get: { summary: "List appointments", responses: { "200": { description: "list" } } },
      post: { summary: "Create appointment", responses: { "201": { description: "created" } } },
    },
    "/api/v1/appointments/{id}/status": {
      patch: {
        summary: "Advance status (guarded)",
        responses: { "200": { description: "updated" } },
      },
    },
    "/api/v1/beds": {
      get: { summary: "List beds with occupancy", responses: { "200": { description: "list" } } },
    },
    "/api/v1/beds/{id}": {
      patch: { summary: "Admit / release bed", responses: { "200": { description: "updated" } } },
    },
    "/api/v1/pharmacy": {
      get: { summary: "List medicines FEFO", responses: { "200": { description: "list" } } },
    },
    "/api/v1/pharmacy/batches": {
      post: { summary: "Add batch", responses: { "201": { description: "created" } } },
    },
    "/api/v1/pharmacy/dispense": {
      post: { summary: "Dispense and charge", responses: { "200": { description: "dispensed" } } },
    },
    "/api/v1/lab": {
      get: { summary: "List lab reports", responses: { "200": { description: "list" } } },
    },
    "/api/v1/lab/orders": {
      post: { summary: "Order test", responses: { "201": { description: "ordered" } } },
    },
    "/api/v1/lab/{id}": {
      patch: { summary: "Advance stage", responses: { "200": { description: "updated" } } },
    },
    "/api/v1/billing": {
      get: { summary: "List invoices", responses: { "200": { description: "list" } } },
    },
    "/api/v1/billing/invoices": {
      post: { summary: "Create invoice", responses: { "201": { description: "created" } } },
    },
    "/api/v1/billing/{id}/collect": {
      post: { summary: "Collect payment", responses: { "200": { description: "collected" } } },
    },
    "/api/v1/doctors": {
      get: { summary: "List doctors", responses: { "200": { description: "list" } } },
    },
    "/api/v1/departments": {
      get: { summary: "List departments", responses: { "200": { description: "list" } } },
    },
    "/api/v1/inventory": {
      get: { summary: "List inventory", responses: { "200": { description: "list" } } },
    },
    "/api/v1/inventory/{id}/restock": {
      post: { summary: "Restock item", responses: { "200": { description: "restocked" } } },
    },
    "/api/v1/staff": {
      get: { summary: "List staff", responses: { "200": { description: "list" } } },
    },
    "/api/v1/audit": {
      get: {
        summary: "List audit log (append-only)",
        responses: { "200": { description: "list" } },
      },
    },
    "/api/v1/dashboard/stats": {
      get: { summary: "Dashboard aggregates", responses: { "200": { description: "stats" } } },
    },
  },
} as const;
