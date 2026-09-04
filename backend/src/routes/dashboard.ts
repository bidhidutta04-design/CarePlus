import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listPatients } from "../repos/patientRepo.js";
import { listAppointments } from "../repos/appointmentRepo.js";
import { listBeds } from "../repos/bedRepo.js";
import { listMedicines } from "../repos/medicineRepo.js";
import { listLabs } from "../repos/labRepo.js";
import { listInvoices } from "../repos/invoiceRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/stats — one call for the overview screen
router.get("/stats", async (_req, res, next) => {
  try {
    const [patients, appointments, beds, medicines, labs, invoices] = await Promise.all([
      listPatients({}),
      listAppointments({}),
      listBeds({}),
      listMedicines({}),
      listLabs({}),
      listInvoices({}),
    ]);

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

    res.json({
      data: {
        patients: { total: patients.length, admitted, opd },
        appointments: { total: appointments.length, waiting, inTriage, withDoctor },
        beds: { total: beds.length, occupied, occupancyPct },
        medicines: { total: medicines.length, lowStock },
        labs: { total: labs.length, pending: pendingLabs },
        billing: { billed, collected, pending: billed - collected },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
