import express from "express";
import mongoose from "mongoose";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { authLimiter, errorHandler, notFound, requestId } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import appointmentRoutes from "./routes/appointments.js";
import bedRoutes from "./routes/beds.js";
import pharmacyRoutes from "./routes/pharmacy.js";
import labRoutes from "./routes/lab.js";
import billingRoutes from "./routes/billing.js";
import doctorRoutes from "./routes/doctors.js";
import departmentRoutes from "./routes/departments.js";
import inventoryRoutes from "./routes/inventory.js";
import staffRoutes from "./routes/staff.js";
import auditRoutes from "./routes/audit.js";
import dashboardRoutes from "./routes/dashboard.js";
import docsRoutes from "./docs/router.js";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(compression() as unknown as import("express").RequestHandler);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser() as unknown as import("express").RequestHandler);
  app.use(requestId);
  app.use(morgan(config.isProd ? "combined" : "dev"));

  // Liveness — process is alive (orchestrator restart probe)
  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok", service: "careplus-api", time: new Date().toISOString() } });
  });

  // Readiness — ready to serve traffic (orchestrator routing probe)
  app.get("/ready", (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      data: {
        status: dbUp ? "ok" : "degraded",
        db: dbUp ? "connected" : "disconnected",
        time: new Date().toISOString(),
      },
    });
  });

  app.use("/docs", docsRoutes);
  app.get("/api/v1/openapi.json", (_req, res) => {
    // also serve at the API prefix for contract freeze checks
    void import("./docs/openapi.js").then(({ openApiSpec }) => res.json(openApiSpec));
  });

  app.use("/api/v1/auth", authLimiter as unknown as import("express").RequestHandler, authRoutes);
  app.use("/api/v1/patients", patientRoutes);
  app.use("/api/v1/appointments", appointmentRoutes);
  app.use("/api/v1/beds", bedRoutes);
  app.use("/api/v1/pharmacy", pharmacyRoutes);
  app.use("/api/v1/lab", labRoutes);
  app.use("/api/v1/billing", billingRoutes);
  app.use("/api/v1/doctors", doctorRoutes);
  app.use("/api/v1/departments", departmentRoutes);
  app.use("/api/v1/inventory", inventoryRoutes);
  app.use("/api/v1/staff", staffRoutes);
  app.use("/api/v1/audit", auditRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
