"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiDepartment {
  id: string;
  name: string;
  hod: string;
  opdRooms: number;
  bedCount: number;
  occupiedBeds: number;
  doctorsCount: number;
  icon: string;
}

interface DepartmentsResponse {
  data: ApiDepartment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useDepartments() {
  const router = useRouter();
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await apiClient.get<DepartmentsResponse>("/departments");
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
