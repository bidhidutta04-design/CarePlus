"use client";

import { useAppSelector } from "@/store/hooks";
import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { RootState } from "@/store/store";

export function usePatients(): Patient[] {
  return useAppSelector((s: RootState) => s.clinical.patients);
}

export function useAppointments(): Appointment[] {
  return useAppSelector((s: RootState) => s.clinical.appointments);
}