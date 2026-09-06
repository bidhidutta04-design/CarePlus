"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiInvoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: Array<{ desc: string; dept: string; amount: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "TPA Insurance";
  tpaProvider?: string;
  status: "Paid" | "Partial" | "Unpaid";
}

interface InvoicesResponse {
  data: ApiInvoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    billed: number;
    collected: number;
    pending: number;
  };
}

export function useInvoices(filters?: { status?: string; patientId?: string }) {
  const router = useRouter();
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.patientId) params.patientId = filters.patientId;
      const { data } = await apiClient.get<InvoicesResponse>("/billing", { params });
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

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { patientId: string; patientName: string; items: Array<{ desc: string; dept: string; amount: number }>; discount?: number; paymentMethod: string }) => {
      const { data } = await apiClient.post<{ data: ApiInvoice }>("/billing/invoices", payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}

export function useCollectPayment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data } = await apiClient.post<{ data: ApiInvoice }>(`/billing/${id}/collect`, { amount });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
        router.push("/login");
      }
    },
  });
}
