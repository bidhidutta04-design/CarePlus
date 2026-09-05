"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { useAppSelector } from "@/store/hooks";
import { monthlyRevenue } from "@/lib/seed-data";
import { formatINR } from "@/lib/utils";
import { TrendingUp, BedDouble, Repeat, Download } from "lucide-react";

export default function ReportsPage() {
  const invoices = useAppSelector((s) => s.ops.invoices);
  const beds = useAppSelector((s) => s.ops.beds);
  const appointments = useAppSelector((s) => s.clinical.appointments);

  const maxRev = Math.max(...monthlyRevenue.map((m) => m.revenue));
  const occupancy = Math.round((beds.filter((b) => b.status === "Occupied").length / beds.length) * 100);
  const completed = appointments.filter((a) => a.status === "Completed").length;

  const exportCSV = (): void => {
    const rows = [["id", "patient", "date", "total", "paid", "balance", "status", "method"],
      ...invoices.map((i) => [i.id, i.patientName, i.date, String(i.totalAmount), String(i.paidAmount), String(i.balanceDue), i.status, i.paymentMethod])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "careplus-invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Revenue, occupancy, throughput"
        actions={<Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1.5 h-4 w-4" />Export invoices CSV</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={TrendingUp} label="FY monthly avg" value={formatINR(4700000)} rawValue={4700000} formatValue={(n) => formatINR(Math.round(n))} sub="Apr–Sep trend" tone="green" />
        <KpiCard icon={BedDouble} label="Bed occupancy" value={`${occupancy}%`} rawValue={occupancy} formatValue={(n) => `${Math.round(n)}%`} sub="Turnover 4.1 days avg stay" tone="blue" />
        <KpiCard icon={Repeat} label="Completed consults" value={String(completed)} rawValue={completed} formatValue={(n) => String(Math.round(n))} sub="This week in queue" tone="amber" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader><CardTitle>Monthly revenue (₹L)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-44 items-end gap-3" role="img" aria-label="Monthly revenue chart">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold">{m.revenue}</span>
                <div className="flex h-32 w-full max-w-14 items-end rounded-t-lg bg-[#dbe7f2]">
                  <div className="w-full rounded-t-lg bg-clinical" style={{ height: `${Math.round((m.revenue / maxRev) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Average length of stay (ALOS): 4.1 days • Bed turnover: 5.8/bed/month • OPD footfall +12% MoM.</p>
        </CardContent>
      </Card>
    </div>
  );
}
