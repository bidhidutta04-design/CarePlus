"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useAppSelector } from "@/store/hooks";
import { CalendarCheck, Stethoscope, CheckCircle2 } from "lucide-react";

export default function DoctorDeskPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data, isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const queue = (data?.data ?? []).filter((a) =>
    ["Waiting", "In Triage", "With Doctor"].includes(a.status),
  );
  const waiting = queue.filter((a) => a.status === "Waiting").length;
  const withDoctor = queue.filter((a) => a.status === "With Doctor").length;
  const urgent = queue.filter((a) => a.priority !== "Routine").length;

  return (
    <div>
      <PageHeader
        title={`Good day, ${userName}`}
        subtitle="Your OPD desk — queue, consults, and handoffs"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/appointments">Full token queue</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={CalendarCheck} label="Waiting" value={String(waiting)} sub="in queue now" tone="blue" />
        <KpiCard icon={Stethoscope} label="With doctor" value={String(withDoctor)} sub="in consult" tone="amber" />
        <KpiCard icon={CheckCircle2} label="Urgent / Emergency" value={String(urgent)} sub="needs priority" tone="red" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>{isLoading ? "Loading queue…" : `Live queue (${queue.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.tokenNo}</TableCell>
                  <TableCell>{a.patientName}</TableCell>
                  <TableCell className="max-w-48 truncate">{a.reason}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    {a.status === "In Triage" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: a.id, status: "With Doctor" })}
                      >
                        Call in
                      </Button>
                    )}
                    {a.status === "With Doctor" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: a.id, status: "Completed" })}
                      >
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Queue clear — no waiting patients.
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
