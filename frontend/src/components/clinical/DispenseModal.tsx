"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dispenseMedicine, pushToCart } from "@/store/opsSlice";
import { formatINR } from "@/lib/utils";

export function DispenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const medicines = useAppSelector((s) => s.ops.medicines);
  const [medId, setMedId] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  const med = medicines.find((m) => m.id === medId);

  const submit = (): void => {
    setError("");
    if (!med) { setError("Select a medicine."); return; }
    if (qty < 1) { setError("Quantity must be at least 1."); return; }
    if (med.stockCount < qty) { setError(`Only ${med.stockCount} units in stock.`); return; }
    dispatch(dispenseMedicine({ id: med.id, qty }));
    dispatch(pushToCart({ desc: `${med.brandName} x${qty}`, dept: "Pharmacy", amount: med.unitPrice * qty }));
    setMedId("");
    setQty(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Dispense Medicine</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">Medicine (FEFO)
            <select value={medId} onChange={(e) => setMedId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="">Select…</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.brandName} — {m.batchNo} — stock {m.stockCount}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Quantity
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </label>
          {med && (
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatINR(med.unitPrice * qty)}</span>
              {" "}• Batch {med.batchNo} • Exp {med.expiryDate}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Dispense & bill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
