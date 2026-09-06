"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DispenseModal } from "@/components/clinical/DispenseModal";
import { useMedicines } from "@/hooks/usePharmacy";
import { useAppSelector } from "@/store/hooks";
import { Pill, TriangleAlert, PackagePlus } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function PharmacyDeskPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data, isLoading } = useMedicines();
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const medicines = data?.data ?? [];
  const lowStock = medicines.filter((m) => m.status === "Low Stock" || m.status === "Expired");
  const stockValue = medicines.reduce((s, m) => s + m.unitPrice * m.stockCount, 0);

  return (
    <div>
      <PageHeader
        title={`Dispensary — ${userName}`}
        subtitle="Fulfillment queue and stock alerts"
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/pharmacy">Full inventory</Link>
            </Button>
            <Button size="sm" onClick={() => setDispenseOpen(true)}>
              <PackagePlus className="mr-1.5 h-4 w-4" /> Dispense
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Pill} label="SKUs in stock" value={String(medicines.length)} sub="tracked batches" tone="blue" />
        <KpiCard icon={TriangleAlert} label="Low / expired" value={String(lowStock.length)} sub="needs reorder" tone="red" />
        <KpiCard icon={PackagePlus} label="Stock value" value={formatINR(Math.round(stockValue))} sub="at unit price" tone="green" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>{isLoading ? "Loading…" : `Restock alerts (${lowStock.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStock.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.brandName}</TableCell>
                  <TableCell className="font-mono text-xs">{m.batchNo}</TableCell>
                  <TableCell>
                    {m.stockCount} <span className="text-xs text-muted-foreground">/ min {m.minThreshold}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
              {lowStock.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    All stocks healthy.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DispenseModal open={dispenseOpen} onClose={() => setDispenseOpen(false)} />
    </div>
  );
}
