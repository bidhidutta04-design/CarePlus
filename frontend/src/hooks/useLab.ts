"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiLabReport {
  id: string;
  testCode: string;
  testName: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  orderDate: string;
  status: "Ordered" | "Sample Collected" | "Under Analysis" | "Report Approved";
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
  pathologistSign: string;
}

interface LabResponse {
  data: ApiLabReport[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useLabReports(filters?: { status?: string; patientId?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["labs", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.patientId) params.patientId = filters.patientId;
      const { data } = await apiClient.get<LabResponse>("/lab", { params });
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

export function useCreateLabOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { patientId: string; testName: string; doctorName: string }) => {
      const { data } = await apiClient.post<{ data: ApiLabReport }>("/lab/orders", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}

export function useUpdateLabStatus() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, status, results }: { id: string; status: string; results?: ApiLabReport["results"] }) => {
      const { data } = await apiClient.patch<{ data: ApiLabReport }>(`/lab/${id}`, { status, results });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
