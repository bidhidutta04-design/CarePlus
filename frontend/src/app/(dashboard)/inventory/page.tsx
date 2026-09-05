"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useInventory } from "@/hooks/useInventory";
import { Boxes, TriangleAlert, IndianRupee } from "lucide-react";

export default function InventoryPage() {
  const { data, isLoading } = useInventory();
  const items = data?.data ?? [];
  const low = items.filter((i) => i.stock <= i.minThreshold);
  const value = items.reduce((s, i) => s + i.stock * i.unitCost, 0);

  return (
    <div>
      <PageHeader title="Inventory — Consumables & Equipment" subtitle={isLoading ? "Loading inventory…" : "Safety-threshold ledger with restock log"} />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Boxes} label="SKUs" value={String(items.length)} rawValue={items.length} formatValue={(n) => String(Math.round(n))} sub="Consumables, surgical, linen, radiology" tone="blue" />
        <KpiCard icon={TriangleAlert} label="Below threshold" value={String(low.length)} rawValue={low.length} formatValue={(n) => String(Math.round(n))} sub={low.map((l) => l.name).slice(0, 2).join(", ") || "All healthy"} tone="red" />
        <KpiCard icon={IndianRupee} label="Stock value" value={`₹${(value / 100000).toFixed(2)}L`} rawValue={value / 100000} formatValue={(n) => `₹${n.toFixed(2)}L`} sub="At unit cost" tone="green" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader><CardTitle>Supplies ledger</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading inventory…</p>}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead>Unit cost</TableHead><TableHead>Supplier</TableHead><TableHead>Restocked</TableHead><TableHead>Alert</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => {
                  const isLow = i.stock <= i.minThreshold;
                  return (
                    <TableRow key={i.id}>
                      <TableCell><span className="font-medium">{i.name}</span><span className="block text-xs text-muted-foreground">{i.id} • per {i.unit}</span></TableCell>
                      <TableCell>{i.category}</TableCell>
                      <TableCell className={isLow ? "font-bold text-red-600" : ""}>{i.stock} <span className="text-xs text-muted-foreground">/ min {i.minThreshold}</span></TableCell>
                      <TableCell>₹{i.unitCost.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{i.supplier}</TableCell>
                      <TableCell>{i.lastRestocked}</TableCell>
                      <TableCell><StatusBadge status={isLow ? "Low Stock" : "Healthy"} /></TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No inventory items found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
