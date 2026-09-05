"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Doctor } from "@/types/doctor";

interface DoctorsResponse {
  data: Doctor[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useDoctors(filters?: { department?: string; availability?: string }) {
  return useQuery({
    queryKey: ["doctors", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.department) params.department = filters.department;
      if (filters?.availability) params.availability = filters.availability;
      const { data } = await apiClient.get<DoctorsResponse>("/doctors", { params });
      return data;
    },
  });
}
