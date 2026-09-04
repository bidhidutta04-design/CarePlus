"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateBed } from "@/store/opsSlice";
import type { Bed, BedStatus, Ward } from "@/types/bed";
import { announcePresence, mockRoom } from "@/lib/liveblocksMock";
import { cn } from "@/lib/utils";

const WARDS: Ward[] = ["ICU", "Emergency", "General Male", "General Female", "Private Suite"];

const bedStyle: Record<BedStatus, string> = {
  Vacant: "border-green-300 bg-[#e6f5e8] text-[#2e7d32]",
  Occupied: "border-red-300 bg-[#fde8e8] text-[#c62828]",
  Sanitizing: "border-amber-300 bg-[#fef2d6] text-[#965f0e]",
  Reserved: "border-blue-300 bg-[#e3f0f9] text-[#11507a]",
};

export default function BedBoardPage() {
  const dispatch = useAppDispatch();
  const beds = useAppSelector((s) => s.ops.beds);
  const userName = useAppSelector((s) => s.auth.userName);
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<Bed | null>(null);
  const [patientName, setPatientName] = useState("");
  const [nextStatus, setNextStatus] = useState<BedStatus>("Occupied");

  useEffect(() => {
    announcePresence(userName, "Bed Board");
    const unsub = mockRoom.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [userName]);

  const present = Object.entries(mockRoom.getSnapshot());

  const openBed = (b: Bed): void => {
    setSelected(b);
    setPatientName(b.patientName ?? "");
    setNextStatus(b.status === "Vacant" ? "Occupied" : "Vacant");
  };

  const save = (): void => {
    if (!selected) return;
    dispatch(
      updateBed({
        ...selected,
        status: nextStatus,
        patientName: nextStatus === "Occupied" ? patientName || "New Admission" : undefined,
        patientId: nextStatus === "Occupied" ? selected.patientId ?? "CP-1001" : undefined,
        admittedDate: nextStatus === "Occupied" ? "2026-09-04" : undefined,
      })
    );
    mockRoom.broadcast();
    setSelected(null);
  };

  return (
    <div>
      <PageHeader
        title="Live Interactive Bed Board"
        subtitle="Real-time sync active (mock Liveblocks room) — click any bed to admit, transfer, or release"
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
            <Card key={ward} className="rounded-2xl shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{ward}</CardTitle>
                <span className="text-sm text-muted-foreground">{occ}/{list.length} occupied</span>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => openBed(b)}
                    className={cn("rounded-xl border-2 p-3 text-left transition-transform hover:scale-[1.02]", bedStyle[b.status])}
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
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as BedStatus)} className="rounded-lg border border-input bg-background px-3 py-2">
                {(["Vacant", "Occupied", "Sanitizing", "Reserved"] as BedStatus[]).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            {nextStatus === "Occupied" && (
              <label className="grid gap-1 text-sm">Patient name
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Full name" />
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={save}>Update bed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
