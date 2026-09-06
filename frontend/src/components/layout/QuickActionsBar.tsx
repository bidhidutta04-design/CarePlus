"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus, UserPlus, Receipt, Stethoscope, FlaskConical, Pill, Zap } from "lucide-react";
import { BookAppointmentModal } from "@/components/clinical/BookAppointmentModal";
import { AddPatientModal } from "@/components/clinical/AddPatientModal";
import { CreateInvoiceModal } from "@/components/clinical/CreateInvoiceModal";
import { TriageVitalsModal } from "@/components/clinical/TriageVitalsModal";
import { OrderLabModal } from "@/components/clinical/OrderLabModal";
import { DispenseModal } from "@/components/clinical/DispenseModal";
import { useAppSelector } from "@/store/hooks";
import type { RoleType } from "@/types/common";

// Mirrors the backend write permissions — a button is shown only when this
// role may actually call the endpoint behind it.
export function QuickActionsBar() {
  const [modal, setModal] = useState<string | null>(null);
  const close = (): void => setModal(null);
  const role = useAppSelector((s) => s.auth.role);

  const actions: Array<{ key: string; label: string; icon: typeof CalendarPlus; roles: RoleType[] }> = [
    { key: "appt", label: "New Appointment", icon: CalendarPlus, roles: ["Admin", "Nurse"] },
    { key: "patient", label: "Add Patient", icon: UserPlus, roles: ["Admin", "Nurse"] },
    { key: "invoice", label: "Create Invoice", icon: Receipt, roles: ["Admin", "Cashier"] },
    { key: "vitals", label: "Record Vitals", icon: Stethoscope, roles: ["Admin", "Doctor", "Nurse"] },
    { key: "lab", label: "Order Lab", icon: FlaskConical, roles: ["Admin", "Doctor", "Nurse"] },
    { key: "dispense", label: "Dispense", icon: Pill, roles: ["Admin", "Pharmacist"] },
  ];
  const visible = actions.filter((a) => a.roles.includes(role));

  return (
    <>
      <div className="print-hidden sticky top-16 z-20 border-b border-border bg-[#f2f6fb]/95 backdrop-blur dark:bg-card/95">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 md:px-6">
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#1f3d5a] dark:text-foreground">
            <Zap className="h-4 w-4 text-clinical" /> Quick Actions
          </span>
          {visible.map((a) => (
            <Button
              key={a.key}
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:bg-[#f0f7ff] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 dark:bg-card dark:hover:bg-accent/20"
              onClick={() => setModal(a.key)}
            >
              <a.icon className="mr-1.5 h-3.5 w-3.5 text-clinical" />
              {a.label}
            </Button>
          ))}
        </div>
      </div>
      <BookAppointmentModal open={modal === "appt"} onClose={close} />
      <AddPatientModal open={modal === "patient"} onClose={close} />
      <CreateInvoiceModal open={modal === "invoice"} onClose={close} />
      <TriageVitalsModal open={modal === "vitals"} onClose={close} />
      <OrderLabModal open={modal === "lab"} onClose={close} />
      <DispenseModal open={modal === "dispense"} onClose={close} />
    </>
  );
}
