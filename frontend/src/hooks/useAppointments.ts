"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiAppointment {
  id: string;
  tokenNo: string;
  patientId: string;
  patientName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  priority: "Routine" | "Urgent" | "Emergency";
  reason: string;
  status: "Waiting" | "In Triage" | "With Doctor" | "Completed" | "Cancelled";
  vitals?: { bp: string; pulse: number; spo2: number; temp: number };
}

interface AppointmentsResponse {
  data: ApiAppointment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useAppointments(filters?: { status?: string; department?: string; priority?: string; search?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.department) params.department = filters.department;
      if (filters?.priority) params.priority = filters.priority;
      if (filters?.search) params.search = filters.search;
      const { data } = await apiClient.get<AppointmentsResponse>("/appointments", { params });
      return data;
    },
    retry: false,
    throwOnError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
      return false;
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: {
      patientId: string;
      doctorId: string;
      doctorName: string;
      department: string;
      date: string;
      timeSlot: string;
      priority: "Routine" | "Urgent" | "Emergency";
      reason: string;
    }) => {
      const { data } = await apiClient.post<{ data: ApiAppointment }>("/appointments", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, status, vitals }: { id: string; status: string; vitals?: { bp: string; pulse: number; spo2: number; temp: number } }) => {
      const { data } = await apiClient.patch<{ data: ApiAppointment }>(`/appointments/${id}/status`, { status, vitals });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
