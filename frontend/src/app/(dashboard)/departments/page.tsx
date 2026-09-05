"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDepartments } from "@/hooks/useDepartments";
import { useBeds } from "@/hooks/useBeds";

export default function DepartmentsPage() {
  const { data: deptData, isLoading: deptLoading } = useDepartments();
  const { data: bedData } = useBeds();
  const departments = deptData?.data ?? [];
  const beds = bedData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Medical Specialties"
        subtitle={deptLoading ? "Loading departments…" : `${departments.length} departments`}
        actions={<Button asChild size="sm"><Link href="/departments/beds">Open live bed board</Link></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((d) => {
          const pct = d.bedCount === 0 ? 0 : Math.round((d.occupiedBeds / d.bedCount) * 100);
          return (
            <Card key={d.id} className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
                <p className="text-sm text-muted-foreground">HOD: {d.hod}</p>
              </CardHeader>
              <CardContent className="grid gap-1 text-sm">
                <p>{d.doctorsCount} doctors • {d.opdRooms} OPD rooms</p>
                <p>
                  Beds: <span className="font-semibold">{d.occupiedBeds}/{d.bedCount}</span>
                  {d.bedCount > 0 && <span className="text-muted-foreground"> ({pct}% occupied)</span>}
                </p>
                {d.bedCount > 0 && (
                  <div className="mt-1 h-2 rounded-full bg-[#e9eef4]">
                    <div className="h-2 rounded-full bg-clinical" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Live vacant now: {beds.filter((b) => b.status === "Vacant").length} across all wards
                </p>
              </CardContent>
            </Card>
          );
        })}
        {!deptLoading && departments.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No departments found.</p>
        )}
      </div>
    </div>
  );
}
