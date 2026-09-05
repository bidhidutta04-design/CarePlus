"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { useAppointments } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useBeds } from "@/hooks/useBeds";
import { useInvoices } from "@/hooks/useBilling";
import { formatINR } from "@/lib/utils";
import { CalendarCheck, BedDouble, Wallet, Siren } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data: apptData, isLoading: apptLoading } = useAppointments();
  const { data: patData } = usePatients();
  const { data: bedData } = useBeds();
  const { data: invData } = useInvoices();

  const appointments = apptData?.data ?? [];
  const patients = patData?.data ?? [];
  const beds = bedData?.data ?? [];
  const invoices = invData?.data ?? [];

  const todayISO = new Date().toISOString().slice(0, 10);
  const activeQueue = appointments.filter((a) => ["Waiting", "In Triage", "With Doctor"].includes(a.status));
  const inpatients = patients.filter((p) => p.admissionStatus === "Admitted").length;
  const outpatients = patients.filter((p) => p.admissionStatus === "OPD").length;
  const occupied = beds.filter((b) => b.status === "Occupied").length;
  const occupancy = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
  const todayRevenue = invoices.filter((i) => i.date === todayISO).reduce((s, i) => s + i.paidAmount, 0);
  const emergencies = appointments.filter((a) => a.priority === "Emergency" && a.status !== "Completed" && a.status !== "Cancelled");
  const circ = 2 * Math.PI * 44;

  const opdCount = activeQueue.length;

  return (
    <div>
      <PageHeader title={`Welcome, ${userName}`} subtitle={apptLoading ? "Loading dashboard…" : `Hospital operations at a glance — ${new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}`} />

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
