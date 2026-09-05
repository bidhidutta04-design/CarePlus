"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { OrderLabModal } from "@/components/clinical/OrderLabModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateLabStatus } from "@/store/opsSlice";
import type { LabReport, LabStatus } from "@/types/lab";
import { FlaskConical, Clock, CheckCircle2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES: LabStatus[] = ["Ordered", "Sample Collected", "Under Analysis", "Report Approved"];

export default function LabPage() {
  const dispatch = useAppDispatch();
  const labs = useAppSelector((s) => s.ops.labs);
  const [orderOpen, setOrderOpen] = useState(false);
  const [entry, setEntry] = useState<LabReport | null>(null);
  const [print, setPrint] = useState<LabReport | null>(null);
  const [draft, setDraft] = useState<Array<{ parameter: string; value: string; unit: string; normalRange: string }>>([]);

  const openEntry = (lab: LabReport): void => {
    setEntry(lab);
    setDraft(
      lab.results.length > 0
        ? lab.results.map((r) => ({ parameter: r.parameter, value: r.value, unit: r.unit, normalRange: r.normalRange }))
        : [{ parameter: "", value: "", unit: "", normalRange: "" }]
    );
  };

  const saveResults = (approve: boolean): void => {
    if (!entry) return;
    dispatch(
      updateLabStatus({
        id: entry.id,
        status: approve ? "Report Approved" : "Under Analysis",
        results: draft.filter((d) => d.parameter).map((d) => ({ ...d, isAbnormal: d.value.toUpperCase().includes("HIGH") || d.value.includes("*") })),
      })
    );
    setEntry(null);
  };

  const advance = (lab: LabReport): void => {
    const i = STAGES.indexOf(lab.status);
    if (i < STAGES.length - 1) dispatch(updateLabStatus({ id: lab.id, status: STAGES[i + 1] }));
  };

  return (
    <div>
      <PageHeader
        title="Diagnostics — 4-Stage Pipeline"
        subtitle="Ordered → Sample Collected → Under Analysis → Report Approved"
        actions={<Button size="sm" onClick={() => setOrderOpen(true)}>Order test</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={FlaskConical} label="Total orders" value={String(labs.length)} rawValue={labs.length} formatValue={(n) => String(Math.round(n))} sub="All pipelines" tone="blue" />
        <KpiCard icon={Clock} label="Pending" value={String(labs.filter((l) => l.status !== "Report Approved").length)} rawValue={labs.filter((l) => l.status !== "Report Approved").length} formatValue={(n) => String(Math.round(n))} sub="Needs action" tone="amber" />
        <KpiCard icon={CheckCircle2} label="Approved" value={String(labs.filter((l) => l.status === "Report Approved").length)} rawValue={labs.filter((l) => l.status === "Report Approved").length} formatValue={(n) => String(Math.round(n))} sub="Signed reports" tone="green" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {STAGES.map((stage) => (
          <Card key={stage} className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
            <CardHeader><CardTitle className="text-sm">{stage} ({labs.filter((l) => l.status === stage).length})</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {labs.filter((l) => l.status === stage).map((l) => (
                <div key={l.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{l.testName}</p>
                  <p className="text-xs text-muted-foreground">{l.id} • {l.patientName}</p>
                  <p className="text-xs text-muted-foreground">{l.orderDate} • {l.doctorName}</p>
                  {l.results.length > 0 && (
                    <ul className="mt-1 text-xs">
                      {l.results.map((r, i) => (
                        <li key={i} className={cn(r.isAbnormal && "font-bold text-red-600")}>
                          {r.parameter}: {r.value} {r.unit} ({r.normalRange}){r.isAbnormal ? " ⚑" : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {stage !== "Report Approved" && <Button size="sm" variant="outline" onClick={() => advance(l)}>Advance →</Button>}
                    <Button size="sm" variant="ghost" onClick={() => openEntry(l)}>Enter results</Button>
                    {stage === "Report Approved" && <Button size="sm" variant="ghost" onClick={() => setPrint(l)}><Printer className="mr-1 h-3.5 w-3.5" />Print</Button>}
                  </div>
                </div>
              ))}
              {labs.filter((l) => l.status === stage).length === 0 && <p className="text-xs text-muted-foreground">Empty stage.</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <OrderLabModal open={orderOpen} onClose={() => setOrderOpen(false)} />

      <Dialog open={entry !== null} onOpenChange={(o) => { if (!o) setEntry(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Enter results — {entry?.testName}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {draft.map((d, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Input placeholder="Parameter" value={d.parameter} onChange={(e) => setDraft((p) => p.map((x, j) => j === i ? { ...x, parameter: e.target.value } : x))} aria-label="Parameter" />
                <Input placeholder="Value" value={d.value} onChange={(e) => setDraft((p) => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} aria-label="Value" />
                <Input placeholder="Unit" value={d.unit} onChange={(e) => setDraft((p) => p.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} aria-label="Unit" />
                <Input placeholder="Ref range" value={d.normalRange} onChange={(e) => setDraft((p) => p.map((x, j) => j === i ? { ...x, normalRange: e.target.value } : x))} aria-label="Reference range" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setDraft((p) => [...p, { parameter: "", value: "", unit: "", normalRange: "" }])}>+ Add parameter</Button>
            <p className="text-xs text-muted-foreground">Tip: append HIGH or * to flag abnormal — renders bold red.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntry(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => saveResults(false)}>Save analysis</Button>
            <Button onClick={() => saveResults(true)}>Approve & sign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={print !== null} onOpenChange={(o) => { if (!o) setPrint(null); }}>
        <DialogContent className="print-area max-w-lg">
          <DialogHeader><DialogTitle className="print-hidden">Accredited Lab Report</DialogTitle></DialogHeader>
          {print && (
            <div className="grid gap-2 text-sm">
              <div className="border-b pb-2 text-center">
                <p className="text-lg font-bold text-[#0b2b4a]">CarePlus Hospital — Dept. of Pathology</p>
                <p className="text-xs text-muted-foreground">NABL Accredited • {print.id} • {print.orderDate}</p>
              </div>
              <p><span className="text-muted-foreground">Patient:</span> {print.patientName} ({print.patientId})</p>
              <p><span className="text-muted-foreground">Test:</span> {print.testName} ({print.testCode}) • Ordered by {print.doctorName}</p>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th>Parameter</th><th>Value</th><th>Range</th></tr></thead>
                <tbody>
                  {print.results.map((r, i) => (
                    <tr key={i} className={cn("border-b", r.isAbnormal && "font-bold text-red-600")}>
                      <td>{r.parameter}</td><td>{r.value} {r.unit}</td><td>{r.normalRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-right font-semibold">Sd/- {print.pathologistSign || "Pathologist"}</p>
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
