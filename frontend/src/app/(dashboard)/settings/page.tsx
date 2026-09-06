"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/store/hooks";
import { useAuditLogs } from "@/hooks/useAudit";
import { useHospitalSettings, type HospitalSettings } from "@/hooks/useHospitalSettings";
import { useStaffPrefs, type BookingPriority } from "@/hooks/useStaffPrefs";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const role = useAppSelector((s) => s.auth.role);
  const isAdmin = role === "Admin";
  const canBook = role === "Admin" || role === "Doctor" || role === "Nurse";
  // Non-admin staff get their own preferences panel; only an administrator
  // can change hospital details or view the audit trail.
  const { data: auditData, isLoading: auditLoading } = useAuditLogs(isAdmin);
  const { prefs, savePrefs } = useStaffPrefs();
  const auditLogs = auditData?.data ?? [];
  const { settings, saveSettings } = useHospitalSettings();
  const [name, setName] = useState(settings.hospitalName);
  const [slot, setSlot] = useState<number>(settings.slotMinutes);
  const [phone, setPhone] = useState(settings.contactPhone);
  const [phoneHref, setPhoneHref] = useState(settings.contactPhoneHref);
  const [address, setAddress] = useState(settings.address);
  const [opdNote, setOpdNote] = useState(settings.opdHoursNote);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setName(settings.hospitalName);
    setSlot(settings.slotMinutes);
    setPhone(settings.contactPhone);
    setPhoneHref(settings.contactPhoneHref);
    setAddress(settings.address);
    setOpdNote(settings.opdHoursNote);
  }, [settings]);

  const markDirty = (): void => setDirty(true);

  const onSave = (): void => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || slot < 10 || slot > 60) return;
    saveSettings({
      hospitalName: trimmed,
      slotMinutes: (Math.round(slot / 5) * 5) as HospitalSettings["slotMinutes"],
      contactPhone: phone.trim(),
      contactPhoneHref: phoneHref.trim(),
      address: address.trim(),
      opdHoursNote: opdNote.trim() || settings.opdHoursNote,
    });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle={isAdmin ? "Hospital profile, scheduling, theme, immutable trail" : "Your preferences and hospital information"} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>My preferences</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1 text-sm">Theme
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} aria-label="Dark mode" />
                <span>{theme === "dark" ? "Dark" : "Light"}</span>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <p className="font-medium">Notification alerts in the top bar</p>
              {([
                ["showCritical", "Critical (abnormal labs, expired stock)"],
                ["showWarning", "Warnings (low stock)"],
                ["showInfo", "Info (emergency tokens, ready reports)"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{label}</span>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(v) => savePrefs({ ...prefs, [key]: v })}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            {canBook && (
              <label className="grid gap-1 text-sm">Default priority for new bookings
                <select
                  className="rounded-lg border border-input bg-background px-3 py-2"
                  value={prefs.defaultPriority}
                  onChange={(e) => savePrefs({ ...prefs, defaultPriority: e.target.value as BookingPriority })}
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </label>
            )}
            <p className="text-xs text-muted-foreground">Signed in as {role}. Preferences apply instantly on this device.</p>
          </CardContent>
        </Card>
        {isAdmin ? (
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Hospital profile</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1 text-sm">Hospital name
              <Input value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">Public contact number
                <Input value={phone} placeholder="e.g. +1 (987) 765 4320" onChange={(e) => { setPhone(e.target.value); markDirty(); }} />
              </label>
              <label className="grid gap-1 text-sm">Dial code (digits)
                <Input value={phoneHref} placeholder="e.g. 19877654320" onChange={(e) => { setPhoneHref(e.target.value.replace(/[^\d+]/g, "")); markDirty(); }} />
              </label>
            </div>
            <label className="grid gap-1 text-sm">Public address
              <Input value={address} placeholder="Shown in the landing footer when set" onChange={(e) => { setAddress(e.target.value); markDirty(); }} />
            </label>
            <label className="grid gap-1 text-sm">OPD hours note
              <Input value={opdNote} onChange={(e) => { setOpdNote(e.target.value); markDirty(); }} />
            </label>
            <label className="grid gap-1 text-sm">OPD slot interval (min)
              <Input type="number" min={10} max={60} step={5} value={slot} onChange={(e) => { setSlot(Number(e.target.value)); setDirty(true); }} />
            </label>
            <p className="text-xs text-muted-foreground">Saved on this device; the slot interval drives the booking slot picker.</p>
            <div>
              <Button size="sm" onClick={onSave} disabled={!dirty}>Save profile</Button>
              {saved && <span className="ml-2 text-sm text-green-700">Saved.</span>}
            </div>
          </CardContent>
        </Card>
        ) : (
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader><CardTitle>Hospital information</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">Hospital</span><span className="text-right font-medium">{settings.hospitalName}</span></div>
            <div className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">OPD hours</span><span className="text-right font-medium">{settings.opdHoursNote}</span></div>
            <div className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">Slot interval</span><span className="text-right font-medium">{settings.slotMinutes} min</span></div>
            {settings.contactPhone && (
              <div className="flex justify-between gap-4 border-b py-2"><span className="text-muted-foreground">Contact</span><span className="text-right font-medium">{settings.contactPhone}</span></div>
            )}
            {settings.address && (
              <div className="flex justify-between gap-4 py-2"><span className="text-muted-foreground">Address</span><span className="text-right font-medium">{settings.address}</span></div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Only an administrator can change hospital details.</p>
          </CardContent>
        </Card>
        )}
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
      {isAdmin && (
      <Card className="mt-4 rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <CardHeader className="flex flex-row items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Immutable system audit log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {auditLoading && <p className="py-4 text-center text-sm text-muted-foreground">Loading audit log…</p>}
          {!auditLoading && (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Action</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditLogs.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.timestamp}</TableCell>
                    <TableCell>{a.user}</TableCell>
                    <TableCell>{a.role}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell className="font-mono text-xs">{a.ipAddress}</TableCell>
                  </TableRow>
                ))}
                {auditLogs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No audit entries.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Append-only trail — entries cannot be edited or deleted from this console.</p>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
