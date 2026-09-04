"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addInvoice, clearCart } from "@/store/opsSlice";
import { formatINR } from "@/lib/utils";

export function CreateInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const patients = useAppSelector((s) => s.clinical.patients);
  const cart = useAppSelector((s) => s.ops.billingCart);
  const invoices = useAppSelector((s) => s.ops.invoices);
  const [patientId, setPatientId] = useState("");
  const [desc, setDesc] = useState("");
  const [dept, setDept] = useState("OPD");
  const [amount, setAmount] = useState(0);
  const [lines, setLines] = useState<Array<{ desc: string; dept: string; amount: number }>>([]);
  const [method, setMethod] = useState<"Cash" | "Card" | "UPI" | "TPA Insurance">("UPI");

  const allLines = [...cart.map((c) => ({ desc: c.desc, dept: c.dept, amount: c.amount })), ...lines];
  const subtotal = allLines.reduce((s, l) => s + l.amount, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const addLine = (): void => {
    if (!desc || amount <= 0) return;
    setLines((p) => [...p, { desc, dept, amount }]);
    setDesc("");
    setAmount(0);
  };

  const submit = (): void => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || allLines.length === 0) return;
    const n = invoices.length + 1;
    dispatch(
      addInvoice({
        id: `INV-2025-${String(n).padStart(3, "0")}`,
        patientId: patient.id,
        patientName: patient.fullName,
        date: "2026-09-04",
        items: allLines,
        subtotal,
        discount: 0,
        tax,
        totalAmount: total,
        paidAmount: 0,
        balanceDue: total,
        paymentMethod: method,
        status: "Unpaid",
      })
    );
    dispatch(clearCart());
    setLines([]);
    setPatientId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">Patient
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="">Select…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.id})</option>)}
            </select>
          </label>
          {cart.length > 0 && (
            <p className="text-xs text-muted-foreground">{cart.length} line(s) carried from pharmacy cart — included automatically.</p>
          )}
          <div className="grid grid-cols-[1fr_110px_110px_auto] items-end gap-2">
            <label className="grid gap-1 text-sm">Item<Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Consultation" /></label>
            <label className="grid gap-1 text-sm">Dept
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-2">
                {["OPD", "IPD", "Lab", "Pharmacy", "Radiology"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Amount<Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
            <Button type="button" variant="outline" onClick={addLine}>Add</Button>
          </div>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-sm">
            {allLines.map((l, i) => (
              <li key={i} className="flex justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                <span>{l.desc} <span className="text-muted-foreground">• {l.dept}</span></span>
                <span className="font-medium">{formatINR(l.amount)}</span>
              </li>
            ))}
            {allLines.length === 0 && <li className="text-sm text-muted-foreground">No line items yet.</li>}
          </ul>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal + 5% tax</span>
            <span className="font-bold">{formatINR(total)}</span>
          </div>
          <label className="grid gap-1 text-sm">Payment method
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="rounded-lg border border-input bg-background px-3 py-2">
              <option>Cash</option><option>Card</option><option>UPI</option><option>TPA Insurance</option>
            </select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!patientId || allLines.length === 0}>Create {formatINR(total)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
