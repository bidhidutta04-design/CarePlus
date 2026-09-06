"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLabReports, useUpdateLabStatus } from "@/hooks/useLab";
import { useAppSelector } from "@/store/hooks";
import { FlaskConical, Clock, CheckCircle2 } from "lucide-react";

const STAGES = ["Ordered", "Sample Collected", "Under Analysis", "Report Approved"] as const;

export default function LabDeskPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data, isLoading } = useLabReports();
  const updateLab = useUpdateLabStatus();
  const labs = data?.data ?? [];
  const pending = labs.filter((l) => l.status !== "Report Approved");
  const byStage = (s: string): number => labs.filter((l) => l.status === s).length;

  const advance = (id: string, status: string): void => {
    const idx = STAGES.indexOf(status as (typeof STAGES)[number]);
    if (idx >= 0 && idx < STAGES.length - 1) {
      updateLab.mutate({ id, status: STAGES[idx + 1] });
    }
  };

  return (
    <div>
      <PageHeader
        title={`Pathology desk — ${userName}`}
        subtitle="Specimen intake to signed reports"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/lab-reports">Full pipeline</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Clock} label="Awaiting action" value={String(pending.length)} sub="not yet approved" tone="amber" />
        <KpiCard icon={FlaskConical} label="Under analysis" value={String(byStage("Under Analysis"))} sub="on bench now" tone="blue" />
        <KpiCard icon={CheckCircle2} label="Approved" value={String(byStage("Report Approved"))} sub="signed reports" tone="green" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>{isLoading ? "Loading…" : `Worklist (${pending.length} pending)`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.testName}</TableCell>
                  <TableCell>{l.patientName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.orderDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell>
                    {l.status !== "Report Approved" && (
                      <Button size="sm" variant="outline" disabled={updateLab.isPending} onClick={() => advance(l.id, l.status)}>
                        Advance →
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Worklist clear.
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
