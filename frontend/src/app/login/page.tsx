"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess } from "@/store/authSlice";
import { apiClient } from "@/lib/apiClient";
import { HeartPulse } from "lucide-react";
import type { RoleType } from "@/types/common";

interface LoginResponse {
  data: {
    token: string;
    refreshToken: string;
    role: string;
    name: string;
    expiresIn: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
      localStorage.setItem("careplus_token", data.data.token);
      localStorage.setItem("careplus_refresh_token", data.data.refreshToken);
      document.cookie = `careplus_token=${data.data.token}; path=/; max-age=900; samesite=strict`;
      dispatch(loginSuccess({ role: data.data.role as RoleType, userName: data.data.name }));
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: RoleType): void => {
    dispatch(loginSuccess({ role, userName: role }));
    localStorage.removeItem("careplus_token");
    localStorage.removeItem("careplus_refresh_token");
    document.cookie = "careplus_token=demo; path=/; max-age=900; samesite=strict";
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b2b4a] p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b2b4a]">
            <HeartPulse className="h-6 w-6 animate-pulse text-[#4fc3f7]" />
          </div>
          <CardTitle className="text-2xl">CarePlus</CardTitle>
          <p className="text-sm text-muted-foreground">Enterprise HMS — sign in with your credentials</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              Email
              <Input
                type="email"
                placeholder="admin@careplus.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Password
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or demo mode</span>
            </div>
          </div>

          <div className="grid gap-2">
            {(["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as RoleType[]).map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(role)}
              >
                Continue as {role}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
