"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { seedStaff } from "@/lib/seed-data";
import type { StaffMember } from "@/types/ops";
import { cn } from "@/lib/utils";

const SHIFTS = ["Morning", "Evening", "Night"] as const;

export default function StaffPage() {
  return (
    <div>
      <PageHeader title="Staff & 3-Shift Ward Roster" subtitle={`${seedStaff.length} nurses, technicians, admin on roster`} />
      <div className="grid gap-4 lg:grid-cols-3">
        {SHIFTS.map((shift) => {
          const list: StaffMember[] = seedStaff.filter((s) => s.shift === shift);
          return (
            <Card key={shift} className="rounded-2xl shadow-card">
              <CardHeader><CardTitle>{shift} shift <span className="text-sm font-normal text-muted-foreground">({list.length})</span></CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                {list.map((s) => (
                  <div key={s.id} className={cn("flex items-center justify-between rounded-xl border p-3 text-sm", s.status === "On Leave" && "opacity-60")}>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.role} • {s.department} • {s.phone}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
