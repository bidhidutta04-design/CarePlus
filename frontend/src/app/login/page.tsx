"use client";

import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export default function LoginPage() {
  return (
    <StaffLoginForm
      expectedRole={null}
      title="CarePlus"
      subtitle="Enterprise HMS — sign in with your credentials"
    />
  );
}
