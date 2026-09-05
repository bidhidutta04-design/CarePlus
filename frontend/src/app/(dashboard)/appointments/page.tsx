"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { BookAppointmentModal } from "@/components/clinical/BookAppointmentModal";
import { TriageVitalsModal } from "@/components/clinical/TriageVitalsModal";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import type { ApiAppointment } from "@/hooks/useAppointments";
import { CalendarPlus, Stethoscope } from "lucide-react";

const col = createColumnHelper<ApiAppointment>();

export default function AppointmentsPage() {
  const updateStatus = useUpdateAppointmentStatus();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [bookOpen, setBookOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const { data, isLoading } = useAppointments({
    status: status !== "All" ? status : undefined,
    department: dept !== "All" ? dept : undefined,
    priority: priority !== "All" ? priority : undefined,
    search: query || undefined,
  });
  const appointments = data?.data ?? [];

  const depts = useMemo(() => ["All", ...Array.from(new Set(appointments.map((a) => a.department)))], [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter(
      (a) =>
        (dept === "All" || a.department === dept) &&
        (priority === "All" || a.priority === priority) &&
        (status === "All" || a.status === status) &&
        (query === "" ||
          [a.id, a.patientName, a.doctorName, a.tokenNo].join(" ").toLowerCase().includes(query.toLowerCase()))
    );
  }, [appointments, dept, priority, status, query]);

  const columns = useMemo(
    () => [
      col.accessor("tokenNo", { header: "Token", cell: (c) => <span className="font-bold">{c.getValue()}</span> }),
      col.accessor("patientName", {
        header: "Patient",
        cell: (c) => (
          <span>
            {c.getValue()}
            <span className="block text-xs text-muted-foreground">{c.row.original.id} • {c.row.original.patientId}</span>
          </span>
        ),
      }),
      col.accessor("department", { header: "Dept" }),
      col.accessor("doctorName", { header: "Doctor" }),
      col.accessor("timeSlot", { header: "Slot" }),
      col.accessor("priority", { header: "Priority", cell: (c) => <StatusBadge status={c.getValue()} /> }),
      col.accessor("status", { header: "Status", cell: (c) => <StatusBadge status={c.getValue()} /> }),
      col.display({
        id: "actions",
        header: "Actions",
        cell: (c) => {
          const a = c.row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {a.status === "Waiting" && (
                <Button size="sm" variant="outline" onClick={() => setVitalsOpen(true)}>Record vitals</Button>
              )}
              {a.status === "In Triage" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: "With Doctor" })}>Call to doctor</Button>
              )}
              {a.status === "With Doctor" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: "Completed" })}>Complete</Button>
              )}
              {!["Completed", "Cancelled"].includes(a.status) && (
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateStatus.mutate({ id: a.id, status: "Cancelled" })}>Cancel</Button>
              )}
            </div>
          );
        },
      }),
    ],
    [updateStatus]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const sel = "rounded-lg border border-input bg-background px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader
        title="Appointments — Live Token Queue"
        subtitle={isLoading ? "Loading appointments…" : `${filtered.length} tokens • click a column header to sort`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setVitalsOpen(true)}><Stethoscope className="mr-1.5 h-4 w-4" />Record vitals</Button>
            <Button size="sm" onClick={() => setBookOpen(true)}><CalendarPlus className="mr-1.5 h-4 w-4" />New appointment</Button>
          </>
        }
      />
      <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="grid gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Search name, ID, token…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search queue" />
            <select className={sel} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter department">
              {depts.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select className={sel} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter priority">
              {["All", "Routine", "Urgent", "Emergency"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
              {["All", "Waiting", "In Triage", "With Doctor", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <Button variant="ghost" onClick={() => { setQuery(""); setDept("All"); setPriority("All"); setStatus("All"); }}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading appointments…</p>}
          {!isLoading && (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer select-none whitespace-nowrap">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
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
                {table.getRowModel().rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No tokens match filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <BookAppointmentModal open={bookOpen} onClose={() => setBookOpen(false)} />
      <TriageVitalsModal open={vitalsOpen} onClose={() => setVitalsOpen(false)} />
    </div>
  );
}
