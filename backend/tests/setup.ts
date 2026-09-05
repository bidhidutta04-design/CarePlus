import mongoose from "mongoose";
import { afterAll, beforeAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { db } from "../src/store.js";
import { PatientModel } from "../src/models/Patient.js";
import { AppointmentModel } from "../src/models/Appointment.js";
import { BedModel } from "../src/models/Bed.js";
import { MedicineModel } from "../src/models/Medicine.js";
import { LabModel } from "../src/models/LabReport.js";
import { InvoiceModel } from "../src/models/Invoice.js";
import { DoctorModel } from "../src/models/Doctor.js";
import { DepartmentModel } from "../src/models/Department.js";
import { InventoryModel } from "../src/models/Inventory.js";
import { StaffModel } from "../src/models/Staff.js";
import { AuditModel } from "../src/models/Audit.js";
import { UserModel } from "../src/models/User.js";
import { hashPassword } from "../src/repos/userRepo.js";
import { ID_SPECS, syncCounter } from "../src/repos/counterRepo.js";

export const TEST_PASSWORD = "Test@1234";

export const TEST_USERS = [
  { email: "admin@careplus.local", name: "Admin User", role: "Admin" },
  { email: "doctor@careplus.local", name: "Doctor User", role: "Doctor" },
  { email: "nurse@careplus.local", name: "Nurse User", role: "Nurse" },
  { email: "pharmacist@careplus.local", name: "Pharmacist User", role: "Pharmacist" },
  { email: "labtech@careplus.local", name: "Lab User", role: "LabTech" },
  { email: "cashier@careplus.local", name: "Cashier User", role: "Cashier" },
];

let mongo: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  await PatientModel.insertMany(db.patients);
  await AppointmentModel.insertMany(db.appointments);
  await BedModel.insertMany(db.beds);
  await MedicineModel.insertMany(db.medicines);
  await LabModel.insertMany(db.labs);
  await InvoiceModel.insertMany(db.invoices);
  await DoctorModel.insertMany(db.doctors);
  await DepartmentModel.insertMany(db.departments);
  await InventoryModel.insertMany(db.inventory);
  await StaffModel.insertMany(db.staff);
  await AuditModel.insertMany(db.auditLogs);

  const passwordHash = await hashPassword(TEST_PASSWORD);
  await UserModel.insertMany(TEST_USERS.map((u) => ({ ...u, passwordHash, isActive: true })));

  await syncCounter(
    ID_SPECS.patient,
    db.patients.map((p) => p.id),
  );
  await syncCounter(
    ID_SPECS.appointment,
    db.appointments.map((a) => a.id),
  );
  await syncCounter(
    ID_SPECS.invoice,
    db.invoices.map((i) => i.id),
  );
  await syncCounter(
    ID_SPECS.medicine,
    db.medicines.map((m) => m.id),
  );
  await syncCounter(
    ID_SPECS.lab,
    db.labs.map((l) => l.id),
  );
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
