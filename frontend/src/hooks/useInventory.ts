"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minThreshold: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
}

interface InventoryResponse {
  data: ApiInventoryItem[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export function useInventory(filters?: { category?: string; lowStock?: boolean }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.lowStock) params.lowStock = "true";
      const { data } = await apiClient.get<InventoryResponse>("/inventory", { params });
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

export function useRestockInventory() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { data } = await apiClient.post<{ data: ApiInventoryItem }>(`/inventory/${id}/restock`, { qty });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
