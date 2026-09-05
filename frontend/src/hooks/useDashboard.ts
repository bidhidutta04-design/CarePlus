"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface DashboardStats {
  patients: { total: number; admitted: number; opd: number };
  appointments: { total: number; waiting: number; inTriage: number; withDoctor: number; completed: number; cancelled: number };
  beds: { total: number; occupied: number; vacant: number; occupancyPct: number };
  medicines: { total: number; lowStock: number };
  labs: { total: number; pending: number; approved: number };
  billing: { totalBilled: number; totalCollected: number; pending: number };
}

interface DashboardResponse {
  data: DashboardStats;
}

export function useDashboardStats() {
  const router = useRouter();
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardResponse>("/dashboard/stats");
      return data.data;
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
