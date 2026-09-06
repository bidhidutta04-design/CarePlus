"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePatientDetail } from "@/hooks/usePatients";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Visit {
  id: string;
  date: string;
  timeSlot: string;
  doctorName: string;
  department: string;
  reason: string;
  status: string;
  priority: string;
}

interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

interface LabOrder {
  id: string;
  testName: string;
  status: string;
  results: LabResult[];
}

interface Bill {
  id: string;
  status: string;
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = usePatientDetail(id);
  const p = data;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading patient…" />
        <p className="text-sm text-muted-foreground">Fetching medical record…</p>
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div>
        <PageHeader title="Patient not found" />
        <Button asChild variant="outline"><Link href="/patients"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to index</Link></Button>
      </div>
    );
  }

  const visits = (p.visits ?? []) as Visit[];
  const labOrders = (p.labOrders ?? []) as LabOrder[];
  const bills = (p.bills ?? []) as Bill[];

  return (
    <div>
      <PageHeader
        title={`${p.fullName} — EMR`}
        subtitle={`${p.id} • Registered ${p.registeredDate}`}
        actions={<Button asChild variant="outline" size="sm"><Link href="/patients"><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Link></Button>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-card">
          <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p><span className="text-muted-foreground">Age / Gender:</span> {p.age}yr / {p.gender}</p>
            <p><span className="text-muted-foreground">Blood:</span> {p.bloodGroup}</p>
            <p><span className="text-muted-foreground">Phone:</span> {p.phone}</p>
            <p><span className="text-muted-foreground">Email:</span> {p.email || "—"}</p>
            <p><span className="text-muted-foreground">Address:</span> {p.address}</p>
            <p><span className="text-muted-foreground">Status:</span> <StatusBadge status={p.admissionStatus} /></p>
            <p className="mt-2 font-semibold">Emergency contact</p>
            <p className="text-muted-foreground">{p.emergencyContact.name} ({p.emergencyContact.relation}) — {p.emergencyContact.phone}</p>
            <p className="mt-2 font-semibold">Allergies</p>
            <p className="text-muted-foreground">{p.allergies.join(", ") || "None"}</p>
            <p className="mt-2 font-semibold">Chronic conditions</p>
            <p className="text-muted-foreground">{p.chronicConditions.join(", ") || "None"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardHeader><CardTitle>Visit timeline</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {visits.length === 0 && <p className="text-muted-foreground">No visits.</p>}
            {visits.map((v) => (
              <div key={v.id} className="rounded-xl border p-3">
                <p className="font-semibold">{v.date} • {v.timeSlot}</p>
                <p className="text-muted-foreground">{v.doctorName} — {v.department}</p>
                <p className="mt-1">{v.reason}</p>
                <p className="mt-1 flex gap-2"><StatusBadge status={v.status} /><StatusBadge status={v.priority} /></p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-card">
          <CardHeader><CardTitle>Diagnostics</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {labOrders.map((l) => (
              <div key={l.id} className="rounded-xl border p-3">
                <p className="font-semibold">{l.testName} <span className="text-muted-foreground">({l.id})</span></p>
                <p className="mt-1"><StatusBadge status={l.status} /></p>
                {l.results.map((r, i) => (
                  <p key={i} className={r.isAbnormal ? "font-semibold text-red-600" : ""}>
                    {r.parameter}: {r.value} {r.unit} <span className="text-muted-foreground">({r.normalRange})</span>
                  </p>
                ))}
              </div>
            ))}
            {labOrders.length === 0 && <p className="text-muted-foreground">No lab orders.</p>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-card">
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {bills.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border p-3">
                <span className="font-semibold">{i.id}</span>
                <StatusBadge status={i.status} />
              </div>
            ))}
            {bills.length === 0 && <p className="text-muted-foreground">No invoices.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
