"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const patients = useAppSelector((s) => s.clinical.patients);
  const appointments = useAppSelector((s) => s.clinical.appointments);
  const labs = useAppSelector((s) => s.ops.labs);
  const invoices = useAppSelector((s) => s.ops.invoices);
  const p = patients.find((x) => x.id === id);

  if (!p) {
    return (
      <div>
        <PageHeader title="Patient not found" />
        <Button asChild variant="outline"><Link href="/patients"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to index</Link></Button>
      </div>
    );
  }

  const visits = appointments.filter((a) => a.patientId === p.id);
  const maxPulse = Math.max(100, ...p.vitalsHistory.map((v) => v.pulse));

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
          <CardHeader><CardTitle>Vitals trend (pulse)</CardTitle></CardHeader>
          <CardContent>
            {p.vitalsHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
            ) : (
              <div className="flex h-36 items-end gap-3" role="img" aria-label="Pulse trend chart">
                {p.vitalsHistory.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{v.pulse}</span>
                    <div className="flex h-24 w-full max-w-12 items-end rounded-t-lg bg-[#dbe7f2]">
                      <div className="w-full rounded-t-lg bg-clinical" style={{ height: `${Math.round((v.pulse / maxPulse) * 100)}%` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{v.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-3 grid gap-1 text-sm">
              {p.vitalsHistory.map((v, i) => (
                <li key={i} className="flex justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                  <span>{v.date}</span>
                  <span>BP {v.bp} • SpO2 {v.spo2}% • {v.temp}°F • BMI {v.bmi}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-card">
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
        <Card className="rounded-2xl shadow-card">
          <CardHeader><CardTitle>Diagnostics</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {labs.filter((l) => l.patientId === p.id).map((l) => (
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
            {labs.filter((l) => l.patientId === p.id).length === 0 && <p className="text-muted-foreground">No lab orders.</p>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-card">
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {invoices.filter((i) => i.patientId === p.id).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border p-3">
                <span className="font-semibold">{i.id}</span>
                <StatusBadge status={i.status} />
              </div>
            ))}
            {invoices.filter((i) => i.patientId === p.id).length === 0 && <p className="text-muted-foreground">No invoices.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
