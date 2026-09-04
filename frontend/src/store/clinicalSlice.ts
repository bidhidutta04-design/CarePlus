import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Appointment } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import { seedAppointments, seedPatients } from "@/lib/seed-data";

interface ClinicalState {
  appointments: Appointment[];
  patients: Patient[];
  activePatientId: string | null;
}

const initialState: ClinicalState = {
  appointments: seedAppointments,
  patients: seedPatients,
  activePatientId: null,
};

const clinicalSlice = createSlice({
  name: "clinical",
  initialState,
  reducers: {
    setActivePatient(state, action: PayloadAction<string | null>) {
      state.activePatientId = action.payload;
    },
    updateAppointmentStatus(
      state,
      action: PayloadAction<{ id: string; status: Appointment["status"]; vitals?: Appointment["vitals"] }>
    ) {
      const appt = state.appointments.find((a) => a.id === action.payload.id);
      if (appt) {
        appt.status = action.payload.status;
        if (action.payload.vitals) appt.vitals = action.payload.vitals;
      }
    },
    addAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.unshift(action.payload);
    },
    addPatient(state, action: PayloadAction<Patient>) {
      state.patients.unshift(action.payload);
    },
  },
});

export const { setActivePatient, updateAppointmentStatus, addAppointment, addPatient } =
  clinicalSlice.actions;
export default clinicalSlice.reducer;
