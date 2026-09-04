export type LabStatus = "Ordered" | "Sample Collected" | "Under Analysis" | "Report Approved";

export interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

export interface LabReport {
  id: string;
  testCode: string;
  testName: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  orderDate: string;
  status: LabStatus;
  results: LabResult[];
  pathologistSign: string;
}
