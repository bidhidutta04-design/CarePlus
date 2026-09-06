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
    loginSuccess(state, action: PayloadAction<{ role: RoleType; userName: string }>) {
      state.role = action.payload.role;
      state.userName = action.payload.userName || roleNames[action.payload.role];
    },
    logout(state) {
      state.role = "Admin";
      state.userName = "";
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
