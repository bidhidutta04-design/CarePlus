import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RoleType } from "@/types/common";

interface AuthState {
  role: RoleType;
  userName: string;
}

const initialState: AuthState = {
  role: "Admin",
  userName: "Hospital Administrator",
};

const roleNames: Record<RoleType, string> = {
  Admin: "Hospital Administrator",
  Doctor: "Dr. Amit Verma",
  Nurse: "Nurse Asha",
  Pharmacist: "Pharmacist Ravi",
  LabTech: "Dr. Anjali Gupta",
  Cashier: "Cashier Meena",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    switchRole(state, action: PayloadAction<RoleType>) {
      state.role = action.payload;
      state.userName = roleNames[action.payload];
    },
  },
});

export const { switchRole } = authSlice.actions;
export default authSlice.reducer;
