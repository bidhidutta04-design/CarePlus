"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePatients } from "@/hooks/usePatients";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";

const schema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  date: z.string().min(1, "Pick a date"),
  timeSlot: z.string().min(1, "Pick a slot"),
  priority: z.enum(["Routine", "Urgent", "Emergency"]),
  reason: z.string().min(3, "Enter visit reason"),
});

type Form = z.infer<typeof schema>;

const SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM"];

export function BookAppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: patientsData } = usePatients();
  const patients = patientsData?.data ?? [];
  const { data: doctorsData } = useDoctors();
  const doctors = doctorsData?.data ?? [];
  const createAppointment = useCreateAppointment();
  const today = new Date().toISOString().slice(0, 10);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, priority: "Routine", timeSlot: "10:00 AM" },
  });

  const onSubmit = (v: Form): void => {
    const patient = patients.find((p) => p.id === v.patientId);
    const doctor = doctors.find((d) => d.id === v.doctorId);
    if (!patient || !doctor) return;
    createAppointment.mutate(
      {
        patientId: patient.id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        date: v.date,
        timeSlot: v.timeSlot,
        priority: v.priority,
        reason: v.reason,
      },
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
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">Patient
              <select {...register("patientId")} className="rounded-lg border border-input bg-background px-3 py-2">
                <option value="">Select…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.id})</option>)}
              </select>
              {errors.patientId && <span className="text-xs text-red-600">{errors.patientId.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Doctor
              <select {...register("doctorId")} className="rounded-lg border border-input bg-background px-3 py-2">
                <option value="">Select…</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.department}</option>)}
              </select>
              {errors.doctorId && <span className="text-xs text-red-600">{errors.doctorId.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Date
              <Input type="date" {...register("date")} />
              {errors.date && <span className="text-xs text-red-600">{errors.date.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">Time slot
              <select {...register("timeSlot")} className="rounded-lg border border-input bg-background px-3 py-2">
                {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Priority
              <select {...register("priority")} className="rounded-lg border border-input bg-background px-3 py-2">
                <option>Routine</option><option>Urgent</option><option>Emergency</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Reason
              <Textarea rows={2} placeholder="Chief complaint…" {...register("reason")} />
              {errors.reason && <span className="text-xs text-red-600">{errors.reason.message}</span>}
            </label>
          </div>
          {createAppointment.isError && (
            <p className="text-sm text-red-600">Booking failed. Please try again.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createAppointment.isPending}>Cancel</Button>
            <Button type="submit" disabled={createAppointment.isPending}>
              {createAppointment.isPending ? "Booking…" : "Book token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
