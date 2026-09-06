"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { useBeds, useUpdateBed } from "@/hooks/useBeds";
import type { ApiBed } from "@/hooks/useBeds";
import { usePatients } from "@/hooks/usePatients";
import { getApiErrorMessage } from "@/lib/apiClient";
import { announcePresence, mockRoom } from "@/lib/liveblocksMock";
import { cn } from "@/lib/utils";

const WARDS = ["ICU", "Emergency", "General Male", "General Female", "Private Suite"] as const;

const bedStyle: Record<string, string> = {
  Vacant: "border-green-300 bg-[#e6f5e8] text-[#2e7d32]",
  Occupied: "border-red-300 bg-[#fde8e8] text-[#c62828]",
  Sanitizing: "border-amber-300 bg-[#fef2d6] text-[#965f0e]",
  Reserved: "border-blue-300 bg-[#e3f0f9] text-[#11507a]",
};

export default function BedBoardPage() {
  const updateBed = useUpdateBed();
  const userName = useAppSelector((s) => s.auth.userName);
  const { data, isLoading } = useBeds();
  const beds = data?.data ?? [];
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<ApiBed | null>(null);
  const [admitPatientId, setAdmitPatientId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [nextStatus, setNextStatus] = useState<string>("Occupied");
  const { data: patientsData } = usePatients();
  const patients = patientsData?.data ?? [];

  useEffect(() => {
    announcePresence(userName, "Bed Board");
    const unsub = mockRoom.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [userName]);

  const present = Object.entries(mockRoom.getSnapshot());

  const openBed = (b: ApiBed): void => {
    setSelected(b);
    setAdmitPatientId(b.patientId ?? "");
    setSaveError("");
    setNextStatus(b.status === "Vacant" ? "Occupied" : "Vacant");
  };

  const save = (): void => {
    if (!selected) return;
    if (nextStatus === "Occupied" && !admitPatientId) {
      setSaveError("Select the patient being admitted — admissions are always linked to a real chart.");
      return;
    }
    const patient = patients.find((p) => p.id === admitPatientId);
    setSaveError("");
    updateBed.mutate(
      {
        id: selected.id,
        status: nextStatus,
        patientName: nextStatus === "Occupied" ? (patient?.fullName ?? "") : undefined,
        patientId: nextStatus === "Occupied" ? admitPatientId : undefined,
      },
      {
        onSuccess: () => {
          mockRoom.broadcast();
          setSelected(null);
        },
        onError: (e) => setSaveError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Live Interactive Bed Board"
        subtitle={isLoading ? "Loading beds…" : "Real-time sync active — click any bed to admit, transfer, or release"}
      />
      {present.length > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          Live presence: {present.map(([u, loc]) => `${u} @ ${loc}`).join(" • ")}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {WARDS.map((ward) => {
          const list = beds.filter((b) => b.ward === ward);
          const occ = list.filter((b) => b.status === "Occupied").length;
          return (
            <Card key={ward} className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{ward}</CardTitle>
                <span className="text-sm text-muted-foreground">{occ}/{list.length} occupied</span>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => openBed(b)}
                    className={cn("rounded-xl border-2 p-3 text-left transition-transform hover:scale-[1.02]", bedStyle[b.status] ?? "")}
                    aria-label={`Bed ${b.bedNumber}, ${b.status}${b.patientName ? `, ${b.patientName}` : ""}`}
                  >
                    <p className="font-bold">{b.bedNumber}</p>
                    <p className="text-xs font-semibold">{b.status}</p>
                    {b.patientName && <p className="truncate text-xs">{b.patientName}</p>}
                    <p className="text-[11px] opacity-70">₹{b.dailyTariff.toLocaleString("en-IN")}/day</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
        <span className="rounded-full bg-[#e6f5e8] px-3 py-1 text-[#2e7d32]">Vacant</span>
        <span className="rounded-full bg-[#fde8e8] px-3 py-1 text-[#c62828]">Occupied</span>
        <span className="rounded-full bg-[#fef2d6] px-3 py-1 text-[#965f0e]">Sanitizing</span>
        <span className="rounded-full bg-[#e3f0f9] px-3 py-1 text-[#11507a]">Reserved</span>
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bed {selected?.bedNumber} — {selected?.ward}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">New status
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
                {["Vacant", "Occupied", "Sanitizing", "Reserved"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            {nextStatus === "Occupied" && (
              <label className="grid gap-1 text-sm">Admit patient
                <select
                  value={admitPatientId}
                  onChange={(e) => setAdmitPatientId(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.id})</option>
                  ))}
                </select>
              </label>
            )}
            {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={save} disabled={updateBed.isPending}>{updateBed.isPending ? "Saving…" : "Update bed"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
