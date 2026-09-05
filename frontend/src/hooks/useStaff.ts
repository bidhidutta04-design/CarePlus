"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiStaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: "Morning" | "Evening" | "Night";
  phone: string;
  status: "On Duty" | "Off Duty" | "On Leave";
}

interface StaffResponse {
  data: ApiStaffMember[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useStaff(filters?: { shift?: string; department?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["staff", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.shift) params.shift = filters.shift;
      if (filters?.department) params.department = filters.department;
      const { data } = await apiClient.get<StaffResponse>("/staff", { params });
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
