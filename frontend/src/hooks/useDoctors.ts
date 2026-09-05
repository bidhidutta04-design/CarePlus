"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Doctor } from "@/types/doctor";

interface DoctorsResponse {
  data: Doctor[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useDoctors(filters?: { department?: string; availability?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["doctors", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.department) params.department = filters.department;
      if (filters?.availability) params.availability = filters.availability;
      const { data } = await apiClient.get<DoctorsResponse>("/doctors", { params });
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

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: Omit<Doctor, "id">) => {
      const { data } = await apiClient.post<{ data: Doctor }>("/doctors", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
