"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/usePatients";
import { useCreateLabOrder } from "@/hooks/useLab";

const schema = z.object({
  patientId: z.string().min(1, "Select patient"),
  testName: z.string().min(2, "Enter test name"),
  doctorName: z.string().min(2, "Enter ordering doctor"),
});

type Form = z.infer<typeof schema>;

const TESTS = ["Complete Blood Count", "Lipid Profile", "HbA1c (Glycated Hb)", "Thyroid Stimulating Hormone", "Kidney Function Test", "Liver Function Test", "Dengue NS1 Antigen", "ECG 12-Lead", "Chest X-Ray"];

export function OrderLabModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: patientsData } = usePatients();
  const patients = patientsData?.data ?? [];
  const createOrder = useCreateLabOrder();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Form): void => {
    createOrder.mutate(
      { patientId: v.patientId, testName: v.testName, doctorName: v.doctorName },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Order Lab Test</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <label className="grid gap-1 text-sm">Patient
            <select {...register("patientId")} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="">Select…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.id})</option>)}
            </select>
            {errors.patientId && <span className="text-xs text-red-600">{errors.patientId.message}</span>}
          </label>
          <label className="grid gap-1 text-sm">Test
            <select {...register("testName")} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="">Select…</option>
              {TESTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.testName && <span className="text-xs text-red-600">{errors.testName.message}</span>}
          </label>
          <label className="grid gap-1 text-sm">Ordering doctor
            <Input placeholder="Dr. Amit Verma" {...register("doctorName")} />
            {errors.doctorName && <span className="text-xs text-red-600">{errors.doctorName.message}</span>}
          </label>
          {createOrder.isError && (
            <p className="text-sm text-red-600">Order failed. Please try again.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createOrder.isPending}>Cancel</Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Ordering…" : "Place order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
