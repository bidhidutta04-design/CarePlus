"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useStaff } from "@/hooks/useStaff";
import type { ApiStaffMember } from "@/hooks/useStaff";
import { cn } from "@/lib/utils";

const SHIFTS = ["Morning", "Evening", "Night"] as const;

export default function StaffPage() {
  const { data, isLoading } = useStaff();
  const staff = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Staff & 3-Shift Ward Roster" subtitle={isLoading ? "Loading staff…" : `${staff.length} nurses, technicians, admin on roster`} />
      <div className="grid gap-4 lg:grid-cols-3">
        {SHIFTS.map((shift) => {
          const list: ApiStaffMember[] = staff.filter((s) => s.shift === shift);
          return (
            <Card key={shift} className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
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
                {list.length === 0 && <p className="text-sm text-muted-foreground">No staff in this shift.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
