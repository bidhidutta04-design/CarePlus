"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess } from "@/store/authSlice";
import { apiClient, getApiErrorMessage, setSession } from "@/lib/apiClient";
import { HeartPulse } from "lucide-react";
import { homeFor, isValidRole } from "@/lib/roles";

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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address (e.g. admin@careplus.local).";
    }
    if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });
      if (!isValidRole(data.data.role)) {
        setError("Server returned an unknown role. Please contact your administrator.");
        return;
      }
      setSession(data.data.token, data.data.refreshToken, data.data.role);
      dispatch(loginSuccess({ role: data.data.role, userName: data.data.name }));
      router.push(homeFor(data.data.role));
    } catch (err: unknown) {
      const code =
        err !== null && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error
              ?.code
          : undefined;
      if (code === "PASSWORD_CHANGE_REQUIRED") {
        router.push(`/change-password?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
              {fieldErrors.email && <span className="text-xs text-red-600">{fieldErrors.email}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Password
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password && (
                <span className="text-xs text-red-600">{fieldErrors.password}</span>
              )}
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="flex items-center justify-between text-sm">
            <a href="/forgot-password" className="text-clinical hover:underline">
              Forgot password?
            </a>
            <a href="/portal" className="text-muted-foreground hover:underline">
              Staff portal
            </a>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
