"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiAuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  ipAddress: string;
}

interface AuditResponse {
  data: ApiAuditLog[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useAuditLogs() {
  const router = useRouter();
  return useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data } = await apiClient.get<AuditResponse>("/audit");
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
