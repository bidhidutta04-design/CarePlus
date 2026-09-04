export type MedicineStatus = "Healthy" | "Low Stock" | "Expired";

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  batchNo: string;
  expiryDate: string;
  unitPrice: number;
  stockCount: number;
  minThreshold: number;
  status: MedicineStatus;
}
