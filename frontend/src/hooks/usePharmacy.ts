"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiMedicine {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  batchNo: string;
  expiryDate: string;
  unitPrice: number;
  stockCount: number;
  minThreshold: number;
  status: "Healthy" | "Low Stock" | "Expired";
}

interface MedicinesResponse {
  data: ApiMedicine[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useMedicines(filters?: { search?: string; lowStock?: boolean }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["medicines", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.lowStock) params.lowStock = "true";
      const { data } = await apiClient.get<MedicinesResponse>("/pharmacy", { params });
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

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: Omit<ApiMedicine, "id" | "status">) => {
      const { data } = await apiClient.post<{ data: ApiMedicine }>("/pharmacy/batches", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}

export function useDispenseMedicine() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { medicineId: string; qty: number; patientId: string }) => {
      const { data } = await apiClient.post<{ data: ApiMedicine }>("/pharmacy/dispense", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
