"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { CreateInvoiceModal } from "@/components/clinical/CreateInvoiceModal";
import { useInvoices, useCollectPayment } from "@/hooks/useBilling";
import type { ApiInvoice } from "@/hooks/useBilling";
import { formatINR } from "@/lib/utils";
import { Wallet, HandCoins, Hourglass, ShieldCheck, Printer, Plus } from "lucide-react";

export default function BillingPage() {
  const collectPayment = useCollectPayment();
  const { data, isLoading } = useInvoices();
  const invoices = data?.data ?? [];
  const [filter, setFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [pay, setPay] = useState<ApiInvoice | null>(null);
  const [print, setPrint] = useState<ApiInvoice | null>(null);
  const [amount, setAmount] = useState(0);

  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const pending = invoices.reduce((s, i) => s + i.balanceDue, 0);
  const tpa = invoices.filter((i) => i.paymentMethod === "TPA Insurance" && i.balanceDue > 0).length;
  const list = invoices.filter((i) => filter === "All" || i.status === filter);

  return (
    <div>
      <PageHeader
        title="Billing & Financial Management"
        subtitle={isLoading ? "Loading invoices…" : "Consolidated invoicing • TPA claims • GST receipts"}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Create invoice</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Total billed" value={formatINR(billed)} rawValue={billed} formatValue={(n) => formatINR(Math.round(n))} sub={`${invoices.length} invoices`} tone="blue" />
        <KpiCard icon={HandCoins} label="Collected" value={formatINR(collected)} rawValue={collected} formatValue={(n) => formatINR(Math.round(n))} sub="Cash + Card + UPI + TPA" tone="green" />
        <KpiCard icon={Hourglass} label="Pending balances" value={formatINR(pending)} rawValue={pending} formatValue={(n) => formatINR(Math.round(n))} sub="Follow-up queue" tone="amber" />
        <KpiCard icon={ShieldCheck} label="TPA claims in progress" value={String(tpa)} rawValue={tpa} formatValue={(n) => String(Math.round(n))} sub="Star Health, HDFC Ergo" tone="red" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" aria-label="Filter invoices">
            {["All", "Paid", "Partial", "Unpaid"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading invoices…</p>}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Patient</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {list.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-semibold">{i.id}</TableCell>
                    <TableCell>{i.patientName}<span className="block text-xs text-muted-foreground">{i.patientId}</span></TableCell>
                    <TableCell>{i.date}</TableCell>
                    <TableCell className="font-semibold">{formatINR(i.totalAmount)}</TableCell>
                    <TableCell>{formatINR(i.paidAmount)}</TableCell>
                    <TableCell className={i.balanceDue > 0 ? "font-bold text-red-600" : ""}>{formatINR(i.balanceDue)}</TableCell>
                    <TableCell className="text-xs">{i.paymentMethod}{i.tpaProvider ? ` • ${i.tpaProvider}` : ""}</TableCell>
                    <TableCell><StatusBadge status={i.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {i.balanceDue > 0 && (
                          <Button size="sm" variant="outline" onClick={() => { setPay(i); setAmount(i.balanceDue); }}>Collect</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setPrint(i)}><Printer className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <Dialog open={pay !== null} onOpenChange={(o) => { if (!o) setPay(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Collect — {pay?.id}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">Balance due: <span className="font-bold text-foreground">{pay && formatINR(pay.balanceDue)}</span></p>
            <label className="grid gap-1 text-sm">Amount<Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPay(null)} disabled={collectPayment.isPending}>Cancel</Button>
            <Button
              disabled={collectPayment.isPending}
              onClick={() => {
                if (pay && amount > 0) collectPayment.mutate({ id: pay.id, amount: Math.min(amount, pay.balanceDue) });
                setPay(null);
              }}
            >
              {collectPayment.isPending ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={print !== null} onOpenChange={(o) => { if (!o) setPrint(null); }}>
        <DialogContent className="print-area max-w-md">
          <DialogHeader><DialogTitle className="print-hidden">Hospital receipt</DialogTitle></DialogHeader>
          {print && (
            <div className="grid gap-2 text-sm">
              <div className="border-b pb-2 text-center">
                <p className="text-lg font-bold text-[#0b2b4a]">CarePlus Hospital</p>
                <p className="text-xs text-muted-foreground">GSTIN 27AABCC1234F1Z5 • Receipt {print.id} • {print.date}</p>
              </div>
              <p><span className="text-muted-foreground">Patient:</span> {print.patientName} ({print.patientId})</p>
              {print.items.map((it, i) => (
                <p key={i} className="flex justify-between border-b py-1"><span>{it.desc} <span className="text-muted-foreground">• {it.dept}</span></span><span>{formatINR(it.amount)}</span></p>
              ))}
              <p className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(print.subtotal)}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatINR(print.tax)}</span></p>
              <p className="flex justify-between font-bold"><span>Total</span><span>{formatINR(print.totalAmount)}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Paid ({print.paymentMethod})</span><span>{formatINR(print.paidAmount)}</span></p>
              <p className="flex justify-between font-bold text-red-600"><span>Balance</span><span>{formatINR(print.balanceDue)}</span></p>
              <div className="print-hidden flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPrint(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print / PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
