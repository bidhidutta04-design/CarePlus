"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddPatientModal } from "@/components/clinical/AddPatientModal";
import { useAppSelector } from "@/store/hooks";
import type { Patient } from "@/types/patient";
import { UserPlus } from "lucide-react";

const col = createColumnHelper<Patient>();

export default function PatientsPage() {
  const patients = useAppSelector((s) => s.clinical.patients);
  const labs = useAppSelector((s) => s.ops.labs);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [blood, setBlood] = useState("All");
  const [gender, setGender] = useState("All");
  const [admit, setAdmit] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const drawerPatient = patients.find((p) => p.id === drawerId) ?? null;

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          (blood === "All" || p.bloodGroup === blood) &&
          (gender === "All" || p.gender === gender) &&
          (admit === "All" || p.admissionStatus === admit) &&
          (query === "" || [p.id, p.fullName, p.phone].join(" ").toLowerCase().includes(query.toLowerCase()))
      ),
    [patients, blood, gender, admit, query]
  );

  const columns = useMemo(
    () => [
      col.accessor("id", { header: "ID", cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
      col.accessor("fullName", {
        header: "Patient",
        cell: (c) => (
          <span>
            <Link href={`/patients/${c.row.original.id}`} className="font-medium text-clinical hover:underline">
              {c.getValue()}
            </Link>
            <span className="block text-xs text-muted-foreground">{c.row.original.age}yr • {c.row.original.gender}</span>
          </span>
        ),
      }),
      col.accessor("phone", { header: "Phone" }),
      col.accessor("bloodGroup", { header: "Blood" }),
      col.accessor("admissionStatus", { header: "Status", cell: (c) => <StatusBadge status={c.getValue()} /> }),
      col.display({
        id: "actions",
        header: "Chart",
        cell: (c) => (
          <Button size="sm" variant="outline" onClick={() => setDrawerId(c.row.original.id)}>
            360° view
          </Button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({ data: filtered, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  const sel = "rounded-lg border border-input bg-background px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader
        title="Master Patient Index"
        subtitle={`${filtered.length} of ${patients.length} patients`}
        actions={<Button size="sm" onClick={() => setAddOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" />Add patient</Button>}
      />
      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Search & filters</CardTitle>
          <div className="grid gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Name, phone, or ID…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search patients" />
            <select className={sel} value={blood} onChange={(e) => setBlood(e.target.value)} aria-label="Blood group">
              {["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
            </select>
            <select className={sel} value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Gender">
              {["All", "Male", "Female", "Other"].map((g) => <option key={g}>{g}</option>)}
            </select>
            <select className={sel} value={admit} onChange={(e) => setAdmit(e.target.value)} aria-label="Admission status">
              {["All", "OPD", "Admitted", "Discharged"].map((a) => <option key={a}>{a}</option>)}
            </select>
            <Button variant="ghost" onClick={() => { setQuery(""); setBlood("All"); setGender("All"); setAdmit("All"); }}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer select-none whitespace-nowrap">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No patients found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />

      <Sheet open={drawerId !== null} onOpenChange={(o) => { if (!o) setDrawerId(null); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {drawerPatient && (
            <>
              <SheetHeader>
                <SheetTitle>{drawerPatient.fullName} — 360° Chart</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-4 text-sm">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="font-semibold">{drawerPatient.id} • {drawerPatient.age}yr • {drawerPatient.gender} • {drawerPatient.bloodGroup}</p>
                  <p className="text-muted-foreground">{drawerPatient.phone} • {drawerPatient.address}</p>
                  <p className="mt-1"><StatusBadge status={drawerPatient.admissionStatus} /></p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Allergies & conditions</h4>
                  <p className="text-muted-foreground">
                    Allergies: {drawerPatient.allergies.join(", ") || "None recorded"} • Chronic: {drawerPatient.chronicConditions.join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Vitals trend</h4>
                  {drawerPatient.vitalsHistory.length === 0 && <p className="text-muted-foreground">No vitals recorded.</p>}
                  <ul className="grid gap-1">
                    {drawerPatient.vitalsHistory.map((v, i) => (
                      <li key={i} className="flex justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                        <span>{v.date}</span>
                        <span>BP {v.bp} • P {v.pulse} • SpO2 {v.spo2}% • {v.temp}°F</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Lab reports</h4>
                  <ul className="grid gap-1">
                    {labs.filter((l) => l.patientId === drawerPatient.id).map((l) => (
                      <li key={l.id} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                        <span>{l.testName} <span className="text-muted-foreground">({l.id})</span></span>
                        <StatusBadge status={l.status} />
                      </li>
                    ))}
                    {labs.filter((l) => l.patientId === drawerPatient.id).length === 0 && (
                      <li className="text-muted-foreground">No lab orders.</li>
                    )}
                  </ul>
                </div>
                <Button asChild><Link href={`/patients/${drawerPatient.id}`}>Open full EMR</Link></Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
