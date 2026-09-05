"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiPatient {
  id: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  admissionStatus: "OPD" | "Admitted" | "Discharged";
  registeredDate: string;
}

interface PatientsResponse {
  data: ApiPatient[];
  meta: { total: number; page: number; limit: number; pages: number };
}

interface PatientDetailResponse {
  data: ApiPatient & {
    visits: unknown[];
    labOrders: unknown[];
    bills: unknown[];
  };
}

export function usePatients(filters?: { search?: string; status?: string; bloodGroup?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.status) params.status = filters.status;
      if (filters?.bloodGroup) params.bloodGroup = filters.bloodGroup;
      const { data } = await apiClient.get<PatientsResponse>("/patients", { params });
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

export function usePatientDetail(id: string | null) {
  const router = useRouter();
  return useQuery({
    queryKey: ["patients", id],
    queryFn: async () => {
      const { data } = await apiClient.get<PatientDetailResponse>(`/patients/${id}`);
      return data.data;
    },
    enabled: !!id,
    retry: false,
    throwOnError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
      return false;
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: Omit<ApiPatient, "id" | "registeredDate">) => {
      const { data } = await apiClient.post<{ data: ApiPatient }>("/patients", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
