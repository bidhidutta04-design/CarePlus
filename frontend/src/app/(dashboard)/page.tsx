"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { formatINR } from "@/lib/utils";
import { hourlyOPD, deptShare } from "@/lib/seed-data";
import { CalendarCheck, BedDouble, Wallet, Siren } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const appointments = useAppSelector((s) => s.clinical.appointments);
  const patients = useAppSelector((s) => s.clinical.patients);
  const beds = useAppSelector((s) => s.ops.beds);
  const invoices = useAppSelector((s) => s.ops.invoices);

  const activeQueue = appointments.filter((a) => ["Waiting", "In Triage", "With Doctor"].includes(a.status));
  const inpatients = patients.filter((p) => p.admissionStatus === "Admitted").length;
  const outpatients = patients.filter((p) => p.admissionStatus === "OPD").length;
  const occupied = beds.filter((b) => b.status === "Occupied").length;
  const occupancy = Math.round((occupied / beds.length) * 100);
  const todayRevenue = invoices.filter((i) => i.date === "2026-09-03").reduce((s, i) => s + i.paidAmount, 0);
  const emergencies = appointments.filter((a) => a.priority === "Emergency" && a.status !== "Completed" && a.status !== "Cancelled");
  const maxOPD = Math.max(...hourlyOPD.map((h) => h.count));
  const circ = 2 * Math.PI * 44;

  const opdCount = activeQueue.length + 3;

  return (
    <div>
      <PageHeader title="Executive Dashboard" subtitle="Hospital operations at a glance — Thursday, 04 Sep 2026" />

      {emergencies.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-hidden rounded-2xl border border-red-200 bg-[#fde8e8] px-4 py-2.5 text-sm font-medium text-[#c62828]">
          <Siren className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="truncate">
            {emergencies.length} emergency token(s) live: {emergencies.map((e) => `${e.tokenNo} ${e.patientName} (${e.department})`).join(" • ")}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CalendarCheck}
          label="Today's OPD Consultations"
          value={String(opdCount)}
          rawValue={opdCount}
          formatValue={(n) => String(Math.round(n))}
          sub={`${activeQueue.length} in live queue`}
          tone="blue"
        />
        <KpiCard
          icon={BedDouble}
          label="Inpatients / Outpatients"
          value={`${inpatients} / ${outpatients}`}
          rawValue={inpatients + outpatients}
          formatValue={(n) => {
            const total = Math.round(n);
            const inP = Math.round((inpatients / (inpatients + outpatients || 1)) * total);
            const outP = total - inP;
            return `${inP} / ${outP}`;
          }}
          sub={`${patients.length} registered patients`}
          tone="amber"
        />
        <KpiCard
          icon={Wallet}
          label="Today's Revenue"
          value={formatINR(todayRevenue)}
          rawValue={todayRevenue}
          formatValue={(n) => formatINR(Math.round(n))}
          sub="Cash 38% • UPI 34% • Card 28%"
          tone="green"
        />
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bed Occupancy</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <svg width="96" height="96" viewBox="0 0 100 100" role="img" aria-label={`Bed occupancy ${occupancy} percent`}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e9eef4" strokeWidth="10" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1d6f9c" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ - (circ * occupancy) / 100} transform="rotate(-90 50 50)" />
              <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0b2b4a">
                <AnimatedNumber value={occupancy} format={(n) => `${Math.round(n)}%`} />
              </text>
            </svg>
            <div className="text-sm">
              <p className="font-bold text-[#0b2b4a] dark:text-foreground">
                <AnimatedNumber value={occupied} format={(n) => String(Math.round(n))} />/<AnimatedNumber value={beds.length} format={(n) => String(Math.round(n))} /> beds
              </p>
              <p className="text-muted-foreground">ICU, Emergency, Wards & Suites</p>
              <Link href="/departments/beds" className="text-clinical hover:underline">Open bed board →</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Hourly OPD Load</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-36 items-end justify-between gap-1.5" role="img" aria-label="Hourly OPD traffic bar chart">
              {hourlyOPD.map((h) => (
                <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full max-w-9 items-end rounded-t-lg bg-[#dbe7f2]">
                    <div className="w-full rounded-t-lg bg-clinical" style={{ height: `${Math.round((h.count / maxOPD) * 100)}%` }} title={`${h.hour}: ${h.count}`} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{h.hour.replace(" ", "")}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Peak intake 11 AM (41 patients). Plan triage cover 10 AM – 1 PM.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Department Patient Share</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {deptShare.map((d) => (
              <div key={d.dept} className="flex items-center gap-3">
                <span className="w-36 truncate text-sm font-medium">{d.dept}</span>
                <div className="h-2 flex-1 rounded-full bg-[#e9eef4]">
                  <div className="h-2 rounded-full bg-clinical" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-11 text-right text-sm font-semibold text-[#0b2b4a] dark:text-foreground">
                  <AnimatedNumber value={d.pct} format={(n) => `${Math.round(n)}%`} duration={600} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Token Queue — Next 5</CardTitle>
          <Button variant="outline" size="sm" asChild><Link href="/appointments">Open queue</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Token</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Slot</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {activeQueue.slice(0, 5).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.tokenNo}</TableCell>
                  <TableCell>{a.patientName}</TableCell>
                  <TableCell>{a.doctorName}</TableCell>
                  <TableCell>{a.timeSlot}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
              {activeQueue.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Queue clear.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
