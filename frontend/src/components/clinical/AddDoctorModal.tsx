"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDoctor } from "@/hooks/useDoctors";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  qualification: z.string().min(2, "Qualification is required"),
  specialization: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  roomNo: z.string().min(1, "Room number is required"),
  fee: z.coerce.number().int().min(0, "Fee is required"),
  availability: z.enum(["Available", "In OPD", "In Surgery", "On Leave"]),
  days: z.string().min(1, "Select at least one day"),
  hours: z.string().min(3, "Hours are required"),
  maxSlots: z.coerce.number().int().min(1, "Slots are required"),
});

type Form = z.infer<typeof schema>;

const DEPARTMENTS = ["Cardiology", "Orthopedics", "Pediatrics", "Gynecology", "General Medicine", "Neurology", "Oncology", "ENT", "Dermatology", "Psychiatry"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AVAILABILITIES = ["Available", "In OPD", "In Surgery", "On Leave"] as const;

export function AddDoctorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createDoctor = useCreateDoctor();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: "Available",
      days: "Mon,Tue,Wed,Thu,Fri",
      hours: "09:00 AM - 05:00 PM",
      maxSlots: 20,
    },
  });

  const selectedDays = watch("days");
  const selectedAvailability = watch("availability");

  const toggleDay = (day: string) => {
    const current = selectedDays ? selectedDays.split(",") : [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setValue("days", next.join(","), { shouldValidate: true });
  };

  const onSubmit = (v: Form) => {
    createDoctor.mutate(
      {
        name: v.name,
        qualification: v.qualification,
        specialization: v.specialization || undefined,
        department: v.department,
        roomNo: v.roomNo,
        fee: v.fee,
        availability: v.availability,
        schedule: {
          days: v.days.split(","),
          hours: v.hours,
          maxSlots: v.maxSlots,
        },
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Full Name
              <Input placeholder="Dr. John Doe" {...register("name")} />
              {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Qualification
              <Input placeholder="MD Cardiology" {...register("qualification")} />
              {errors.qualification && <span className="text-xs text-red-600">{errors.qualification.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Specialization
              <Input placeholder="Cardiologist" {...register("specialization")} />
            </label>
            <label className="grid gap-1 text-sm">
              Department
              <Select value={watch("department")} onValueChange={(v) => setValue("department", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <span className="text-xs text-red-600">{errors.department.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Room No.
              <Input placeholder="C-101" {...register("roomNo")} />
              {errors.roomNo && <span className="text-xs text-red-600">{errors.roomNo.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Consultation Fee (₹)
              <Input type="number" placeholder="1200" {...register("fee")} />
              {errors.fee && <span className="text-xs text-red-600">{errors.fee.message}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              Availability
              <Select value={selectedAvailability} onValueChange={(v) => setValue("availability", v as typeof AVAILABILITIES[number], { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITIES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              Max Slots / Day
              <Input type="number" placeholder="20" {...register("maxSlots")} />
              {errors.maxSlots && <span className="text-xs text-red-600">{errors.maxSlots.message}</span>}
            </label>
          </div>

          <div className="grid gap-1 text-sm">
            <span className="font-medium">Working Days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = selectedDays?.split(",").includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#11507a] bg-[#e3f0f9] text-[#11507a]"
                        : "border-input bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.days && <span className="text-xs text-red-600">{errors.days.message}</span>}
          </div>

          <label className="grid gap-1 text-sm">
            Working Hours
            <Input placeholder="09:00 AM - 05:00 PM" {...register("hours")} />
            {errors.hours && <span className="text-xs text-red-600">{errors.hours.message}</span>}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createDoctor.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDoctor.isPending}>
              {createDoctor.isPending ? "Adding…" : "Add Doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
