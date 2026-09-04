export type PaymentMethod = "Cash" | "Card" | "UPI" | "TPA Insurance";
export type InvoiceStatus = "Paid" | "Partial" | "Unpaid";

export interface InvoiceItem {
  desc: string;
  dept: string;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  tpaProvider?: string;
  status: InvoiceStatus;
}
