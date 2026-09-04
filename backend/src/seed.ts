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

async function upsertAll<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { updateOne: (filter: any, doc: any, opts: any) => Promise<any> },
  docs: T[],
  label: string,
): Promise<void> {
  let inserted = 0;
  let kept = 0;
  for (const doc of docs) {
    const res = await model.updateOne({ id: doc.id }, doc, { upsert: true });
    if (res.upsertedCount) inserted += 1;
    else kept += 1;
  }
  console.log(`${label}: ${inserted} inserted, ${kept} already present`);
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
