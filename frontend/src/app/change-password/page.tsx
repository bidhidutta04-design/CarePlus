"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { HeartPulse } from "lucide-react";

function ChangePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email] = useState(params.get("email") ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/first-password", { email, currentPassword, newPassword });
      router.push("/login");
    } catch (err: unknown) {
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
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <p className="text-sm text-muted-foreground">
            First sign-in requires replacing the temporary password{email ? ` for ${email}` : ""}.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              Temporary password
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              New password
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save and sign in"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <Link href="/login" className="text-clinical hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
