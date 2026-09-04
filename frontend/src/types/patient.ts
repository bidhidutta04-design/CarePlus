export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type AdmissionStatus = "OPD" | "Admitted" | "Discharged";
export type Gender = "Male" | "Female" | "Other";

export interface VitalsEntry {
  date: string;
  bp: string;
  pulse: number;
  spo2: number;
  temp: number;
  bmi: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  dob: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  bloodGroup: BloodGroup;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: EmergencyContact;
  admissionStatus: AdmissionStatus;
  vitalsHistory: VitalsEntry[];
  registeredDate: string;
}
