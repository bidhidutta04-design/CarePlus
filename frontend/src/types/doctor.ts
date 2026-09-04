export type DoctorAvailability = "Available" | "In OPD" | "In Surgery" | "On Leave";

export interface DoctorSchedule {
  days: string[];
  hours: string;
  maxSlots: number;
}

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  department: string;
  roomNo: string;
  fee: number;
  availability: DoctorAvailability;
  schedule: DoctorSchedule;
}
