"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiBed {
  id: string;
  ward: string;
  bedNumber: string;
  status: "Vacant" | "Occupied" | "Sanitizing" | "Reserved";
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  dailyTariff: number;
}

interface BedsResponse {
  data: ApiBed[];
  meta: { total: number; page: number; limit: number; pages: number; occupied: number; occupancyPct: number };
}

export function useBeds(filters?: { ward?: string; status?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["beds", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.ward) params.ward = filters.ward;
      if (filters?.status) params.status = filters.status;
      const { data } = await apiClient.get<BedsResponse>("/beds", { params });
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

export function useUpdateBed() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { id: string; status: string; patientId?: string; patientName?: string }) => {
      const { data } = await apiClient.patch<{ data: ApiBed }>(`/beds/${payload.id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["beds"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
