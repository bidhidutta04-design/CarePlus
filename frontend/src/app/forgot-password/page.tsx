"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { HeartPulse } from "lucide-react";

type Step = "email" | "question" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<{ data: { securityQuestion: string } }>(
        "/auth/forgot-password",
        { email: email.trim() },
      );
      setQuestion(data.data.securityQuestion);
      setStep("question");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email: email.trim(),
        answer,
        newPassword,
      });
      setStep("done");
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
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Answer the security question you set during hospital onboarding
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {step === "email" && (
            <form onSubmit={askQuestion} className="grid gap-3">
              <label className="grid gap-1 text-sm">
                Hospital email
                <Input
                  type="email"
                  placeholder="you@careplus.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Checking…" : "Continue"}
              </Button>
            </form>
          )}

          {step === "question" && (
            <form onSubmit={resetPassword} className="grid gap-3">
              <div className="rounded-xl bg-muted/60 p-3 text-sm">
                <p className="text-muted-foreground">Security question</p>
                <p className="font-medium">{question}</p>
              </div>
              <label className="grid gap-1 text-sm">
                Your answer
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} required />
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
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="grid gap-3 text-center">
              <p className="text-sm text-green-700">Password reset. Sign in with your new password.</p>
              <Button onClick={() => router.push("/login")}>Go to sign in</Button>
            </div>
          )}

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
