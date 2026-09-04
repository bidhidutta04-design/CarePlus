export type AppointmentPriority = "Routine" | "Urgent" | "Emergency";
export type AppointmentStatus =
  | "Waiting"
  | "In Triage"
  | "With Doctor"
  | "Completed"
  | "Cancelled";

export interface TriageVitals {
  bp: string;
  pulse: number;
  spo2: number;
  temp: number;
}

export interface Appointment {
  id: string;
  tokenNo: string;
  patientId: string;
  patientName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  priority: AppointmentPriority;
  reason: string;
  status: AppointmentStatus;
  vitals?: TriageVitals;
}
