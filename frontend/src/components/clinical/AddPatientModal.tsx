"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addPatient } from "@/store/clinicalSlice";

const schema = z.object({
  fullName: z.string().min(2, "Enter full name"),
  age: z.coerce.number().min(0).max(120),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().min(8, "Enter phone"),
  email: z.string().email("Enter valid email").or(z.literal("")),
  address: z.string().min(3, "Enter address"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  allergies: z.string().optional(),
  emergencyName: z.string().min(2, "Enter contact name"),
  emergencyPhone: z.string().min(8, "Enter contact phone"),
});

type Form = z.infer<typeof schema>;

export function AddPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const patients = useAppSelector((s) => s.clinical.patients);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { gender: "Male", bloodGroup: "O+", email: "" },
  });

  const onSubmit = (v: Form): void => {
    const n = 1001 + patients.length + 1;
    dispatch(
      addPatient({
        id: `CP-${n}`,
        fullName: v.fullName,
        age: v.age,
        dob: "",
        gender: v.gender,
        phone: v.phone,
        email: v.email,
        address: v.address,
        bloodGroup: v.bloodGroup,
        allergies: v.allergies ? v.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        chronicConditions: [],
        emergencyContact: { name: v.emergencyName, phone: v.emergencyPhone, relation: "Family" },
        admissionStatus: "OPD",
        vitalsHistory: [],
        registeredDate: "2026-09-04",
      })
    );
    reset();
    onClose();
  };

  const field = "grid gap-1 text-sm";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Register Patient</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className={field}>Full name<Input {...register("fullName")} />{errors.fullName && <span className="text-xs text-red-600">{errors.fullName.message}</span>}</label>
          <label className={field}>Age<Input type="number" {...register("age")} />{errors.age && <span className="text-xs text-red-600">{errors.age.message}</span>}</label>
          <label className={field}>Gender
            <select {...register("gender")} className="rounded-lg border border-input bg-background px-3 py-2">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </label>
          <label className={field}>Blood group
            <select {...register("bloodGroup")} className="rounded-lg border border-input bg-background px-3 py-2">
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label className={field}>Phone<Input {...register("phone")} />{errors.phone && <span className="text-xs text-red-600">{errors.phone.message}</span>}</label>
          <label className={field}>Email<Input {...register("email")} />{errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}</label>
          <label className={`${field} col-span-2`}>Address<Input {...register("address")} />{errors.address && <span className="text-xs text-red-600">{errors.address.message}</span>}</label>
          <label className={`${field} col-span-2`}>Drug allergies (comma separated)<Input placeholder="Penicillin, Sulfa" {...register("allergies")} /></label>
          <label className={field}>Emergency contact<Input {...register("emergencyName")} />{errors.emergencyName && <span className="text-xs text-red-600">{errors.emergencyName.message}</span>}</label>
          <label className={field}>Emergency phone<Input {...register("emergencyPhone")} />{errors.emergencyPhone && <span className="text-xs text-red-600">{errors.emergencyPhone.message}</span>}</label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Register</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
