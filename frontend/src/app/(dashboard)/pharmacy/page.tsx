"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { DispenseModal } from "@/components/clinical/DispenseModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addMedicine } from "@/store/opsSlice";
import { formatINR } from "@/lib/utils";
import { Pill, TriangleAlert, CalendarClock, Plus } from "lucide-react";

const schema = z.object({
  brandName: z.string().min(2),
  genericName: z.string().min(2),
  category: z.string().min(2),
  batchNo: z.string().min(2),
  expiryDate: z.string().min(1),
  unitPrice: z.coerce.number().min(0.1),
  stockCount: z.coerce.number().min(1),
  minThreshold: z.coerce.number().min(1),
});

type Form = z.infer<typeof schema>;

function daysToExpiry(expiry: string): number {
  return Math.ceil((new Date(expiry).getTime() - new Date("2026-09-04").getTime()) / 86400000);
}

export default function PharmacyPage() {
  const dispatch = useAppDispatch();
  const medicines = useAppSelector((s) => s.ops.medicines);
  const [query, setQuery] = useState("");
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const sorted = useMemo(
    () =>
      [...medicines]
        .filter((m) => query === "" || [m.brandName, m.genericName, m.batchNo].join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [medicines, query]
  );

  const low = medicines.filter((m) => m.status === "Low Stock").length;
  const exp = medicines.filter((m) => m.status === "Expired").length;
  const soon = medicines.filter((m) => m.status !== "Expired" && daysToExpiry(m.expiryDate) < 60).length;

  const onSubmit = (v: Form): void => {
    dispatch(
      addMedicine({
        id: `MED-${String(medicines.length + 1).padStart(3, "0")}`,
        ...v,
        status: v.stockCount < v.minThreshold ? "Low Stock" : "Healthy",
      })
    );
    reset();
    setBatchOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Pharmacy — FEFO Inventory"
        subtitle="Sorted earliest-expiry-first • dispensing auto-deducts + bills"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setBatchOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Add batch</Button>
            <Button size="sm" onClick={() => setDispenseOpen(true)}>Smart dispense</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Pill} label="SKUs tracked" value={String(medicines.length)} rawValue={medicines.length} formatValue={(n) => String(Math.round(n))} sub="FEFO batch control" tone="blue" />
        <KpiCard icon={TriangleAlert} label="Low stock / expired" value={`${low} / ${exp}`} rawValue={low + exp} formatValue={(n) => { const total = Math.round(n); const l = Math.round((low / (low + exp || 1)) * total); return `${l} / ${total - l}`; }} sub="Reorder flagged SKUs" tone="red" />
        <KpiCard icon={CalendarClock} label="Expiring < 60 days" value={String(soon)} rawValue={soon} formatValue={(n) => String(Math.round(n))} sub="Dispense first" tone="amber" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drug batches</CardTitle>
          <Input placeholder="Search brand, generic, batch…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-64" aria-label="Search medicines" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand / Generic</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead>
                <TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((m) => {
                const d = daysToExpiry(m.expiryDate);
                return (
                  <TableRow key={m.id}>
                    <TableCell><span className="font-medium">{m.brandName}</span><span className="block text-xs text-muted-foreground">{m.genericName} • {m.category}</span></TableCell>
                    <TableCell className="font-mono text-xs">{m.batchNo}</TableCell>
                    <TableCell>
                      {m.expiryDate}
                      {m.status !== "Expired" && d < 60 && <span className="ml-2 rounded-full bg-[#fef2d6] px-2 py-0.5 text-[11px] font-semibold text-[#965f0e]">{d}d left</span>}
                    </TableCell>
                    <TableCell>{formatINR(m.unitPrice)}</TableCell>
                    <TableCell className={m.stockCount < m.minThreshold ? "font-bold text-red-600" : ""}>{m.stockCount} <span className="text-xs text-muted-foreground">/ min {m.minThreshold}</span></TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DispenseModal open={dispenseOpen} onClose={() => setDispenseOpen(false)} />
      <Dialog open={batchOpen} onOpenChange={(o) => { if (!o) setBatchOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add medicine batch</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">Brand<Input {...register("brandName")} />{errors.brandName && <span className="text-xs text-red-600">Required</span>}</label>
            <label className="grid gap-1 text-sm">Generic<Input {...register("genericName")} />{errors.genericName && <span className="text-xs text-red-600">Required</span>}</label>
            <label className="grid gap-1 text-sm">Category<Input {...register("category")} /></label>
            <label className="grid gap-1 text-sm">Batch no<Input {...register("batchNo")} /></label>
            <label className="grid gap-1 text-sm">Expiry<Input type="date" {...register("expiryDate")} /></label>
            <label className="grid gap-1 text-sm">Unit price<Input type="number" step="0.01" {...register("unitPrice")} /></label>
            <label className="grid gap-1 text-sm">Stock<Input type="number" {...register("stockCount")} /></label>
            <label className="grid gap-1 text-sm">Min threshold<Input type="number" {...register("minThreshold")} /></label>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
              <Button type="submit">Add batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
