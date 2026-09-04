import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Bed } from "@/types/bed";
import type { Medicine } from "@/types/medicine";
import type { LabReport } from "@/types/lab";
import type { Invoice } from "@/types/billing";
import {
  seedBeds,
  seedMedicines,
  seedLabs,
  seedInvoices,
} from "@/lib/seed-data";

interface BillingCartItem {
  desc: string;
  dept: string;
  amount: number;
}

interface OpsState {
  beds: Bed[];
  medicines: Medicine[];
  labs: LabReport[];
  invoices: Invoice[];
  billingCart: BillingCartItem[];
}

const initialState: OpsState = {
  beds: seedBeds,
  medicines: seedMedicines,
  labs: seedLabs,
  invoices: seedInvoices,
  billingCart: [],
};

const opsSlice = createSlice({
  name: "ops",
  initialState,
  reducers: {
    updateBed(state, action: PayloadAction<Bed>) {
      const idx = state.beds.findIndex((b) => b.id === action.payload.id);
      if (idx >= 0) state.beds[idx] = action.payload;
    },
    dispenseMedicine(state, action: PayloadAction<{ id: string; qty: number }>) {
      const med = state.medicines.find((m) => m.id === action.payload.id);
      if (med) {
        med.stockCount = Math.max(0, med.stockCount - action.payload.qty);
        if (med.stockCount === 0 || med.stockCount < med.minThreshold) {
          med.status = "Low Stock";
        }
      }
    },
    addMedicine(state, action: PayloadAction<Medicine>) {
      state.medicines.unshift(action.payload);
    },
    updateLabStatus(
      state,
      action: PayloadAction<{ id: string; status: LabReport["status"]; results?: LabReport["results"] }>
    ) {
      const lab = state.labs.find((l) => l.id === action.payload.id);
      if (lab) {
        lab.status = action.payload.status;
        if (action.payload.results) lab.results = action.payload.results;
      }
    },
    addLab(state, action: PayloadAction<LabReport>) {
      state.labs.unshift(action.payload);
    },
    addInvoice(state, action: PayloadAction<Invoice>) {
      state.invoices.unshift(action.payload);
    },
    updateInvoicePayment(state, action: PayloadAction<{ id: string; amount: number }>) {
      const inv = state.invoices.find((i) => i.id === action.payload.id);
      if (inv) {
        inv.paidAmount = Math.min(inv.totalAmount, inv.paidAmount + action.payload.amount);
        inv.balanceDue = inv.totalAmount - inv.paidAmount;
        inv.status = inv.balanceDue === 0 ? "Paid" : inv.paidAmount > 0 ? "Partial" : "Unpaid";
      }
    },
    pushToCart(state, action: PayloadAction<BillingCartItem>) {
      state.billingCart.push(action.payload);
    },
    clearCart(state) {
      state.billingCart = [];
    },
  },
});

export const {
  updateBed,
  dispenseMedicine,
  addMedicine,
  updateLabStatus,
  addLab,
  addInvoice,
  updateInvoicePayment,
  pushToCart,
  clearCart,
} = opsSlice.actions;
export default opsSlice.reducer;
