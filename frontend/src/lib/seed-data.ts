import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import type { Bed } from "@/types/bed";
import type { Medicine } from "@/types/medicine";
import type { LabReport } from "@/types/lab";
import type { Invoice } from "@/types/billing";
import type { AuditLog, StaffMember, InventoryItem, Department } from "@/types/ops";

export const seedPatients: Patient[] = [];

export const seedDoctors: Doctor[] = [];

export const seedAppointments: Appointment[] = [];

export const seedBeds: Bed[] = [];

export const seedMedicines: Medicine[] = [];

export const seedLabs: LabReport[] = [];

export const seedInvoices: Invoice[] = [];

export const seedAudit: AuditLog[] = [];

export const seedStaff: StaffMember[] = [];

export const seedInventory: InventoryItem[] = [];

export const seedDepartments: Department[] = [];

export const hourlyOPD: { hour: string; count: number }[] = [];

export const deptShare: { dept: string; pct: number }[] = [];

export const monthlyRevenue: { month: string; revenue: number }[] = [];
