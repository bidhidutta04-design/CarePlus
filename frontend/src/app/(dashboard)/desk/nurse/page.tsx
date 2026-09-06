"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useBeds } from "@/hooks/useBeds";
import { useAppSelector } from "@/store/hooks";
import { ClipboardList, BedDouble, Siren } from "lucide-react";

export default function NurseDeskPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data: apptData, isLoading } = useAppointments();
  const { data: bedData } = useBeds();
  const updateStatus = useUpdateAppointmentStatus();

  const queue = (apptData?.data ?? []).filter((a) => ["Waiting", "In Triage"].includes(a.status));
  const beds = bedData?.data ?? [];
  const occupied = beds.filter((b) => b.status === "Occupied").length;
  const occupancy = bedData?.meta.occupancyPct ?? 0;
  const emergencies = queue.filter((a) => a.priority === "Emergency");

  return (
    <div>
      <PageHeader
        title={`Triage desk — ${userName}`}
        subtitle="Vitals, queue flow, and bed watch"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/departments/beds">Bed board</Link>
          </Button>
        }
      />
      {emergencies.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-[#fde8e8] px-4 py-2.5 text-sm font-medium text-[#c62828]">
          <Siren className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="truncate">
            {emergencies.length} emergency token(s):{" "}
            {emergencies.map((e) => `${e.tokenNo} ${e.patientName}`).join(" • ")}
          </span>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={ClipboardList} label="Awaiting triage" value={String(queue.length)} sub="waiting + in triage" tone="amber" />
        <KpiCard icon={BedDouble} label="Beds occupied" value={`${occupied}/${beds.length}`} sub={`${occupancy}% occupancy`} tone="blue" />
        <KpiCard icon={Siren} label="Emergencies" value={String(emergencies.length)} sub="in queue" tone="red" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>{isLoading ? "Loading…" : `Triage queue (${queue.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Vitals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.tokenNo}</TableCell>
                  <TableCell>{a.patientName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.vitals
                      ? `BP ${a.vitals.bp} • P ${a.vitals.pulse} • SpO2 ${a.vitals.spo2}%`
                      : "Not recorded"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    {a.status === "Waiting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: a.id, status: "In Triage" })}
                      >
                        Start triage
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No patients awaiting triage.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
