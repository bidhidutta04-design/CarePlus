import { isDbReady } from "../db.js";
import { listPatients } from "./patientRepo.js";
import { listAppointments } from "./appointmentRepo.js";
import { listBeds } from "./bedRepo.js";
import { listMedicines } from "./medicineRepo.js";
import { listLabs } from "./labRepo.js";
import { listInvoices } from "./invoiceRepo.js";
import { PatientModel } from "../models/Patient.js";
import { AppointmentModel } from "../models/Appointment.js";
import { BedModel } from "../models/Bed.js";
import { MedicineModel } from "../models/Medicine.js";
import { LabModel } from "../models/LabReport.js";
import { InvoiceModel } from "../models/Invoice.js";

export interface DashboardStats {
  patients: { total: number; admitted: number; opd: number };
  appointments: { total: number; waiting: number; inTriage: number; withDoctor: number };
  beds: { total: number; occupied: number; occupancyPct: number };
  medicines: { total: number; lowStock: number };
  labs: { total: number; pending: number };
  billing: { billed: number; collected: number; pending: number };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isDbReady()) {
    const [
      patientAgg,
      appointmentAgg,
      bedAgg,
      medicineAgg,
      labPending,
      billingAgg,
      totalMedicines,
      totalLabs,
    ] = await Promise.all([
      PatientModel.aggregate([{ $group: { _id: "$admissionStatus", count: { $sum: 1 } } }]),
      AppointmentModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      BedModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      MedicineModel.aggregate([
        {
          $match: {
            $expr: {
              $or: [{ $lt: ["$stockCount", "$minThreshold"] }, { $eq: ["$status", "Expired"] }],
            },
          },
        },
        { $count: "lowStock" },
      ]),
      LabModel.countDocuments({ status: { $ne: "Report Approved" } }),
      InvoiceModel.aggregate([
        {
          $group: {
            _id: null,
            billed: { $sum: "$totalAmount" },
            collected: { $sum: "$paidAmount" },
          },
        },
      ]),
      MedicineModel.countDocuments(),
      LabModel.countDocuments(),
    ]);

    const patientMap = Object.fromEntries(
      patientAgg.map((r: { _id: string; count: number }) => [r._id, r.count]),
    ) as Record<string, number>;
    const appointmentMap = Object.fromEntries(
      appointmentAgg.map((r: { _id: string; count: number }) => [r._id, r.count]),
    ) as Record<string, number>;
    const bedMap = Object.fromEntries(
      bedAgg.map((r: { _id: string; count: number }) => [r._id, r.count]),
    ) as Record<string, number>;
    const totalPatients = Object.values(patientMap).reduce((s: number, v: number) => s + v, 0);
    const totalBeds = Object.values(bedMap).reduce((s: number, v: number) => s + v, 0);
    const occupied = bedMap["Occupied"] ?? 0;
    const billed = (billingAgg[0] as { billed: number } | undefined)?.billed ?? 0;
    const collected = (billingAgg[0] as { collected: number } | undefined)?.collected ?? 0;

    return {
      patients: {
        total: totalPatients,
        admitted: patientMap["Admitted"] ?? 0,
        opd: patientMap["OPD"] ?? 0,
      },
      appointments: {
        total: Object.values(appointmentMap).reduce((s: number, v: number) => s + v, 0),
        waiting: appointmentMap["Waiting"] ?? 0,
        inTriage: appointmentMap["In Triage"] ?? 0,
        withDoctor: appointmentMap["With Doctor"] ?? 0,
      },
      beds: {
        total: totalBeds,
        occupied,
        occupancyPct: totalBeds ? Math.round((occupied / totalBeds) * 100) : 0,
      },
      medicines: {
        total: totalMedicines,
        lowStock: (medicineAgg[0] as { lowStock: number } | undefined)?.lowStock ?? 0,
      },
      labs: { total: totalLabs, pending: labPending },
      billing: { billed, collected, pending: billed - collected },
    };
  }

  const [patientsRes, appointmentsRes, bedsRes, medicinesRes, labsRes, invoicesRes] =
    await Promise.all([
      listPatients({}),
      listAppointments({}),
      listBeds({}),
      listMedicines({}),
      listLabs({}),
      listInvoices({}),
    ]);
  const patients = patientsRes.data;
  const appointments = appointmentsRes.data;
  const beds = bedsRes.data;
  const medicines = medicinesRes.data;
  const labs = labsRes.data;
  const invoices = invoicesRes.data;

  const admitted = patients.filter((p) => p.admissionStatus === "Admitted").length;
  const opd = patients.filter((p) => p.admissionStatus === "OPD").length;
  const waiting = appointments.filter((a) => a.status === "Waiting").length;
  const inTriage = appointments.filter((a) => a.status === "In Triage").length;
  const withDoctor = appointments.filter((a) => a.status === "With Doctor").length;
  const occupied = beds.filter((b) => b.status === "Occupied").length;
  const occupancyPct = beds.length ? Math.round((occupied / beds.length) * 100) : 0;
  const lowStock = medicines.filter(
    (m) => m.stockCount < m.minThreshold || m.status === "Expired",
  ).length;
  const pendingLabs = labs.filter((l) => l.status !== "Report Approved").length;
  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);

  return {
    patients: { total: patients.length, admitted, opd },
    appointments: { total: appointments.length, waiting, inTriage, withDoctor },
    beds: { total: beds.length, occupied, occupancyPct },
    medicines: { total: medicines.length, lowStock },
    labs: { total: labs.length, pending: pendingLabs },
    billing: { billed, collected, pending: billed - collected },
  };
}
