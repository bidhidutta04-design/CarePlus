"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface ApiStaffUser {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "Doctor" | "Nurse" | "Pharmacist" | "LabTech" | "Cashier";
  isActive: boolean;
  mustChangePassword: boolean;
  securityQuestion: string;
}

interface UsersResponse {
  data: ApiStaffUser[];
  meta: { total: number; page: number; limit: number; pages: number };
}

function handle401(router: ReturnType<typeof useRouter>, error: unknown): boolean {
  if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
    router.push("/login");
    return true;
  }
  return false;
}

export function useStaffUsers() {
  const router = useRouter();
  return useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data } = await apiClient.get<UsersResponse>("/users");
      return data;
    },
    retry: false,
    throwOnError: (error) => {
      handle401(router, error);
      return false;
    },
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      name: string;
      role: ApiStaffUser["role"];
      securityQuestion: string;
      securityAnswer: string;
    }) => {
      const { data } = await apiClient.post<{ data: ApiStaffUser & { tempPassword: string } }>(
        "/users",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: (error) => {
      handle401(router, error);
    },
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ email, isActive }: { email: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<{ data: { ok: boolean } }>(
        `/users/${encodeURIComponent(email)}`,
        { isActive },
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: (error) => {
      handle401(router, error);
    },
  });
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<{ data: { tempPassword: string } }>(
        `/users/${encodeURIComponent(email)}/reset-password`,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: (error) => {
      handle401(router, error);
    },
  });
}
