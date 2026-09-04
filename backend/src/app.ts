import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware.js";
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

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl }));
  app.use(express.json({ limit: "100kb" }));
  app.use(morgan(config.isProd ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok", service: "careplus-api", time: new Date().toISOString() } });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/beds", bedRoutes);
  app.use("/api/pharmacy", pharmacyRoutes);
  app.use("/api/lab", labRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
