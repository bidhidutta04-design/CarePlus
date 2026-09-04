export type Ward = "ICU" | "Emergency" | "General Male" | "General Female" | "Private Suite";
export type BedStatus = "Vacant" | "Occupied" | "Sanitizing" | "Reserved";

export interface Bed {
  id: string;
  ward: Ward;
  bedNumber: string;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  dailyTariff: number;
}
