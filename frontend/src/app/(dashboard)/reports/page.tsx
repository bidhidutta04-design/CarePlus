"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { useInvoices } from "@/hooks/useBilling";
import { useBeds } from "@/hooks/useBeds";
import { useAppointments } from "@/hooks/useAppointments";
import { formatINR } from "@/lib/utils";
import { TrendingUp, BedDouble, Repeat, Download } from "lucide-react";

export default function ReportsPage() {
  const { data: invoiceData } = useInvoices();
  const { data: bedData } = useBeds();
  // Count query only — meta.total carries the hospital-wide figure.
  const { data: completedData } = useAppointments({ status: "Completed" });
  const invoices = invoiceData?.data ?? [];

  // Revenue + occupancy come from server aggregates over the full dataset,
  // never from the rows of one page.
  const billed = invoiceData?.meta.billed ?? invoices.reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoiceData?.meta.collected ?? invoices.reduce((s, i) => s + i.paidAmount, 0);
  const occupancy = bedData?.meta.total
    ? Math.round(((bedData.meta.occupied ?? 0) / bedData.meta.total) * 100)
    : 0;
  const completed = completedData?.meta.total ?? 0;

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
        <KpiCard icon={TrendingUp} label="Total billed" value={formatINR(billed)} rawValue={billed} formatValue={(n) => formatINR(Math.round(n))} sub={`${invoiceData?.meta.total ?? invoices.length} invoices`} tone="green" />
        <KpiCard icon={BedDouble} label="Bed occupancy" value={`${occupancy}%`} rawValue={occupancy} formatValue={(n) => `${Math.round(n)}%`} sub={`${bedData?.meta.occupied ?? 0}/${bedData?.meta.total ?? 0} beds occupied`} tone="blue" />
        <KpiCard icon={Repeat} label="Completed consults" value={String(completed)} rawValue={completed} formatValue={(n) => String(Math.round(n))} sub="All time" tone="amber" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader><CardTitle>Revenue summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Total billed</p>
              <p className="text-2xl font-bold">{formatINR(billed)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Total collected</p>
              <p className="text-2xl font-bold text-green-600">{formatINR(collected)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Figures reflect the complete hospital ledger, not just the visible page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
