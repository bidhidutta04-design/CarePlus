"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/store/hooks";
import { seedAudit } from "@/lib/seed-data";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const role = useAppSelector((s) => s.auth.role);
  const [name, setName] = useState("CarePlus Multi-Speciality Hospital");
  const [slot, setSlot] = useState(30);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader title="Settings & Audit" subtitle="Hospital profile, scheduling, theme, immutable trail" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Hospital profile</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1 text-sm">Hospital name
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">OPD slot interval (min)
                <Input type="number" min={10} max={60} step={5} value={slot} onChange={(e) => setSlot(Number(e.target.value))} />
              </label>
              <div className="grid gap-1 text-sm">Theme
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} aria-label="Dark mode" />
                  <span>{theme === "dark" ? "Dark" : "Light"}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Signed in as {role}. Slot interval applies to new bookings.</p>
            <div>
              <Button size="sm" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Save profile</Button>
              {saved && <span className="ml-2 text-sm text-green-700">Saved.</span>}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Role-based access (read-only matrix)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Admin</TableHead><TableHead>Doctor</TableHead><TableHead>Nurse</TableHead><TableHead>Pharma</TableHead><TableHead>Lab</TableHead><TableHead>Cashier</TableHead></TableRow></TableHeader>
              <TableBody>
                {[
                  ["Appointments", "✓", "✓", "✓", "—", "—", "—"],
                  ["EMR / Vitals", "✓", "✓", "✓", "—", "—", "—"],
                  ["Beds", "✓", "view", "✓", "—", "—", "—"],
                  ["Pharmacy", "✓", "order", "—", "✓", "—", "—"],
                  ["Lab", "✓", "order", "—", "—", "✓", "—"],
                  ["Billing", "✓", "—", "—", "—", "—", "✓"],
                ].map((r) => (
                  <TableRow key={r[0]}><TableCell className="font-medium">{r[0]}</TableCell>{r.slice(1).map((c, i) => <TableCell key={i}>{c}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader className="flex flex-row items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Immutable system audit log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Action</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {seedAudit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.timestamp}</TableCell>
                  <TableCell>{a.user}</TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell className="font-mono text-xs">{a.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">Append-only trail — entries cannot be edited or deleted from this console.</p>
        </CardContent>
      </Card>
    </div>
  );
}
