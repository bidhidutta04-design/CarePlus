"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDispenseMedicine, useMedicines } from "@/hooks/usePharmacy";
import { usePatients } from "@/hooks/usePatients";
import { formatINR } from "@/lib/utils";

export function DispenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: medicinesData } = useMedicines();
  const medicines = medicinesData?.data ?? [];
  const { data: patientsData } = usePatients();
  const patients = patientsData?.data ?? [];
  const dispense = useDispenseMedicine();
  const [medId, setMedId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [billed, setBilled] = useState<string | null>(null);

  const med = medicines.find((m) => m.id === medId);

  const submit = (): void => {
    setError("");
    setBilled(null);
    if (!med) { setError("Select a medicine."); return; }
    if (!patientId) { setError("Select a patient."); return; }
    if (qty < 1) { setError("Quantity must be at least 1."); return; }
    if (med.stockCount < qty) { setError(`Only ${med.stockCount} units in stock.`); return; }
    dispense.mutate(
      { medicineId: med.id, qty, patientId },
      {
        onSuccess: (data) => {
          setBilled(`Dispensed. Charge posted${"billId" in data && data.billId ? ` to bill ${data.billId}` : ""}.`);
          setMedId("");
          setQty(1);
        },
        onError: (e) => {
          setError(e instanceof Error ? e.message : "Dispense failed.");
        },
      }
    );
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
          <label className="grid gap-1 text-sm">Patient
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="">Select…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.id})</option>
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
          {billed && <p className="text-sm text-green-700">{billed}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={dispense.isPending}>
            {dispense.isPending ? "Dispensing…" : "Dispense & bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
