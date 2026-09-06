import { connectDB, disconnectDB } from "./db.js";
import { db } from "./store.js";
import { PatientModel } from "./models/Patient.js";
import { AppointmentModel } from "./models/Appointment.js";
import { BedModel } from "./models/Bed.js";
import { MedicineModel } from "./models/Medicine.js";
import { LabModel } from "./models/LabReport.js";
import { InvoiceModel } from "./models/Invoice.js";
import { DoctorModel } from "./models/Doctor.js";
import { DepartmentModel } from "./models/Department.js";
import { InventoryModel } from "./models/Inventory.js";
import { StaffModel } from "./models/Staff.js";
import { AuditModel } from "./models/Audit.js";
import { UserModel } from "./models/User.js";
import { hashPassword } from "./repos/userRepo.js";
import { ID_SPECS, syncCounter } from "./repos/counterRepo.js";

async function upsertAll<T extends { id: string }>(
  model: {
    bulkWrite: (ops: never, opts?: never) => Promise<unknown>;
    countDocuments: () => Promise<number>;
  },
  docs: T[],
  label: string,
): Promise<void> {
  if (docs.length === 0) {
    console.log(`${label}: 0 docs`);
    return;
  }
  const before = await model.countDocuments();
  const ops = docs.map((doc) => ({
    updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
  }));
  const res = await model.bulkWrite(ops as never, { ordered: false } as never);
  const after = await model.countDocuments();
  const inserted = after - before;
  const matched = docs.length - inserted;
  void res;
  console.log(`${label}: ${inserted} inserted, ${matched} already present`);
}

async function main(): Promise<void> {
  await connectDB();
  console.log("seeding careplus database...");

  await upsertAll(PatientModel, db.patients, "patients");
  await upsertAll(AppointmentModel, db.appointments, "appointments");
  await upsertAll(BedModel, db.beds, "beds");
  await upsertAll(MedicineModel, db.medicines, "medicines");
  await upsertAll(LabModel, db.labs, "lab reports");
  await upsertAll(InvoiceModel, db.invoices, "invoices");
  await upsertAll(DoctorModel, db.doctors, "doctors");
  await upsertAll(DepartmentModel, db.departments, "departments");
  await upsertAll(InventoryModel, db.inventory, "inventory");
  await upsertAll(StaffModel, db.staff, "staff");
  await upsertAll(
    AuditModel,
    db.auditLogs.map((a) => ({ ...a, timestamp: new Date(a.timestamp) })),
    "audit logs",
  );

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
  console.log("counters synced");

  // Demo staff logins (dev only) — created once, skipped when present so real
  // passwords are never overwritten. mustChangePassword forces replacement at
  // first sign-in, which now works via the public /change-password page.
  const demoStaff = [
    {
      email: "doctor@careplus.local",
      name: "Dr. Amit Verma",
      role: "Doctor",
      password: "Doctor@123",
    },
    { email: "nurse@careplus.local", name: "Nurse Asha", role: "Nurse", password: "Nurse@123" },
    {
      email: "pharma@careplus.local",
      name: "Ravi Kumar",
      role: "Pharmacist",
      password: "Pharma@123",
    },
    { email: "lab@careplus.local", name: "Anjali Rao", role: "LabTech", password: "Lab@1234" },
    {
      email: "cashier@careplus.local",
      name: "Meena Iyer",
      role: "Cashier",
      password: "Cashier@123",
    },
  ] as const;
  for (const s of demoStaff) {
    const present = await UserModel.findOne({ email: s.email }).lean();
    if (!present) {
      await UserModel.create({
        email: s.email,
        name: s.name,
        passwordHash: await hashPassword(s.password),
        role: s.role,
        isActive: true,
        mustChangePassword: true,
        securityQuestion: "What city were you born in?",
        securityAnswerHash: await hashPassword(`careplus-${s.role.toLowerCase()}`),
      });
      console.log(`demo staff created: ${s.email} (temporary password, change at first sign-in)`);
    }
  }

  // Default admin (dev only) — change password immediately in real deployments
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@careplus.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";
  const existing = await UserModel.findOne({ email: adminEmail }).lean();
  if (!existing) {
    await UserModel.create({
      email: adminEmail,
      name: "Hospital Administrator",
      passwordHash: await hashPassword(adminPassword),
      role: "Admin",
      isActive: true,
      mustChangePassword: false,
      securityQuestion: "What is the hospital emergency helpline number?",
      securityAnswerHash: await hashPassword("9877654320"),
    });
    console.log(`admin user created: ${adminEmail}`);
  } else {
    // Backfill security Q&A for admins seeded before the recovery feature
    const legacy = existing as unknown as Record<string, unknown>;
    if (!legacy["securityQuestion"]) {
      await UserModel.updateOne(
        { email: adminEmail },
        {
          securityQuestion: "What is the hospital emergency helpline number?",
          securityAnswerHash: await hashPassword("9877654320"),
          mustChangePassword: false,
        },
      );
      console.log(`admin user backfilled with recovery question: ${adminEmail}`);
    } else {
      console.log(`admin user already present: ${adminEmail}`);
    }
  }

  console.log("seed complete");
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err: unknown) => {
  console.error("seed failed:", err);
  try {
    await disconnectDB();
  } catch {
    // ignore disconnect error during failure path
  }
  process.exit(1);
});
