"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateAppointmentStatus } from "@/hooks/useAppointments";

const schema = z.object({
  appointmentId: z.string().min(1, "Enter appointment ID"),
  bp: z.string().min(3, "e.g. 120/80"),
  pulse: z.coerce.number().min(30).max(220),
  spo2: z.coerce.number().min(50).max(100),
  temp: z.coerce.number().min(90).max(110),
});

type Form = z.infer<typeof schema>;

export function TriageVitalsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const updateStatus = useUpdateAppointmentStatus();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { bp: "120/80", pulse: 80, spo2: 98, temp: 98.6 },
  });

  const onSubmit = (v: Form): void => {
    updateStatus.mutate(
      { id: v.appointmentId, status: "In Triage", vitals: { bp: v.bp, pulse: v.pulse, spo2: v.spo2, temp: v.temp } },
      { onSuccess: () => { reset(); onClose(); } }
    );
  };

  const field = "grid gap-1 text-sm";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Vitals</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className={`${field} col-span-2`}>Appointment ID<Input placeholder="APT-1255" {...register("appointmentId")} />{errors.appointmentId && <span className="text-xs text-red-600">{errors.appointmentId.message}</span>}</label>
          <label className={field}>BP<Input {...register("bp")} />{errors.bp && <span className="text-xs text-red-600">{errors.bp.message}</span>}</label>
          <label className={field}>Pulse<Input type="number" {...register("pulse")} /></label>
          <label className={field}>SpO2 %<Input type="number" {...register("spo2")} /></label>
          <label className={field}>Temp °F<Input type="number" step="0.1" {...register("temp")} /></label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save & move to triage"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
