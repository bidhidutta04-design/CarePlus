"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { switchRole } from "@/store/authSlice";
import type { RoleType } from "@/types/common";
import { ROLES } from "@/types/common";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [role, setRole] = useState<RoleType>("Admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b2b4a] p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b2b4a]">
            <HeartPulse className="h-6 w-6 animate-pulse text-[#4fc3f7]" />
          </div>
          <CardTitle className="text-2xl">CarePlus</CardTitle>
          <p className="text-sm text-muted-foreground">Enterprise HMS — choose a workstation role to sign in</p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                role === r.value ? "border-clinical bg-clinical/10" : "hover:bg-muted/60"
              )}
              aria-pressed={role === r.value}
            >
              <p className="font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </button>
          ))}
          <Button
            className="mt-2"
            onClick={() => {
              dispatch(switchRole(role));
              router.push("/");
            }}
          >
            Sign in to {ROLES.find((r) => r.value === role)?.label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
