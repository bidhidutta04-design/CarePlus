"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAdminResetPassword, useCreateStaffUser, useSetUserActive, useStaffUsers } from "@/hooks/useUsers";
import { getApiErrorMessage } from "@/lib/apiClient";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  name: z.string().min(2, "Enter full name"),
  role: z.enum(["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"]),
  securityQuestion: z.string().min(4, "Enter the question asked at onboarding"),
  securityAnswer: z.string().min(2, "Enter the staff member's answer"),
});

type Form = z.infer<typeof schema>;

export default function TeamPage() {
  const { data, isLoading } = useStaffUsers();
  const createUser = useCreateStaffUser();
  const setActive = useSetUserActive();
  const adminReset = useAdminResetPassword();
  const [modalOpen, setModalOpen] = useState(false);
  const [tempPass, setTempPass] = useState<string | null>(null);
  // Standalone receipt for row-level resets — previously the password was
  // written to tempPass while only the create-dialog could display it.
  const [resetReceipt, setResetReceipt] = useState<{ email: string; temp: string } | null>(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "Nurse" },
  });

  const users = data?.data ?? [];

  const onSubmit = (v: Form): void => {
    setError("");
    setTempPass(null);
    createUser.mutate(v, {
      onSuccess: (created) => {
        setTempPass(created.tempPassword);
        reset();
      },
      onError: (e) => setError(getApiErrorMessage(e)),
    });
  };

  const toggleActive = (email: string, isActive: boolean): void => {
    setActive.mutate({ email, isActive: !isActive });
  };

  const issueTemp = (email: string): void => {
    setResetReceipt(null);
    setError("");
    adminReset.mutate(email, {
      onSuccess: (r) => setResetReceipt({ email, temp: r.tempPassword }),
      onError: (e) => setError(getApiErrorMessage(e)),
    });
  };

  return (
    <div>
      <PageHeader
        title="Staff accounts"
        subtitle="Only administrators can create, deactivate, or reset staff logins"
        actions={
          <Button size="sm" onClick={() => { setModalOpen(true); setTempPass(null); setError(""); }}>
            + New staff account
          </Button>
        }
      />

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? "Loading…" : `${data?.meta.total ?? 0} accounts`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-sm font-medium">{u.role}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive ? "bg-[#e6f5e8] text-[#2e7d32]" : "bg-[#fde8e8] text-[#c62828]"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                    {u.mustChangePassword && (
                      <span className="ml-2 text-xs text-muted-foreground">must change password</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(u.email, u.isActive)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => issueTemp(u.email)}>
                        Temp password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No staff accounts.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) setModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New staff account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <label className="grid gap-1 text-sm">Full name
              <Input {...register("name")} />
              {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Hospital email
              <Input type="email" {...register("email")} />
              {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Role
              <select {...register("role")} className="rounded-lg border border-input bg-background px-3 py-2">
                <option>Admin</option><option>Doctor</option><option>Nurse</option>
                <option>Pharmacist</option><option>LabTech</option><option>Cashier</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Security question (asked at onboarding)
              <Input placeholder="What city were you born in?" {...register("securityQuestion")} />
              {errors.securityQuestion && <span className="text-xs text-red-600">{errors.securityQuestion.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Staff member&apos;s answer
              <Input {...register("securityAnswer")} />
              {errors.securityAnswer && <span className="text-xs text-red-600">{errors.securityAnswer.message}</span>}
            </label>
            {tempPass && (
              <p className="rounded-xl bg-[#e6f5e8] p-3 text-sm text-[#2e7d32]">
                One-time temporary password: <span className="font-mono font-bold">{tempPass}</span>
                <br />Share it securely — it is never shown again.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetReceipt !== null} onOpenChange={(o) => { if (!o) setResetReceipt(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Temporary password issued</DialogTitle></DialogHeader>
          <p className="rounded-xl bg-[#e6f5e8] p-3 text-sm text-[#2e7d32]">
            One-time temporary password for <span className="font-semibold">{resetReceipt?.email}</span>:{" "}
            <span className="font-mono font-bold">{resetReceipt?.temp}</span>
            <br />Share it securely — it is never shown again, and the staff member must replace it at first sign-in.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setResetReceipt(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
