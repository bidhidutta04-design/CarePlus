export type RoleType = "Admin" | "Doctor" | "Nurse" | "Pharmacist" | "LabTech" | "Cashier";

export const ROLES: Array<{
  value: RoleType;
  label: string;
  description: string;
}> = [
  { value: "Admin", label: "Hospital Administrator", description: "Full system oversight" },
  { value: "Doctor", label: "Doctor / Specialist", description: "OPD Queue, EMR, e-Prescriptions" },
  { value: "Nurse", label: "Triage Nurse", description: "Vitals, OPD queue, Bed monitoring" },
  { value: "Pharmacist", label: "Pharmacist", description: "Fulfillment, FEFO inventory" },
  { value: "LabTech", label: "Lab Pathologist", description: "Specimen, results, signoff" },
  { value: "Cashier", label: "Billing Cashier", description: "Invoices, TPA claims, receipts" },
];
