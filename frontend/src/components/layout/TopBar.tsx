"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LayoutDashboard,
  Users,
  UserRoundCog,
  FileText,
  Pill,
  FlaskConical,
  Settings,
  LogOut,
  AlertTriangle,
  Zap,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import type { RoleType } from "@/types/common";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAppointments } from "@/hooks/useAppointments";
import { useLabReports } from "@/hooks/useLab";
import { useMedicines } from "@/hooks/usePharmacy";
import { useStaffPrefs } from "@/hooks/useStaffPrefs";
import { clearSession } from "@/lib/apiClient";

const ROLES: Array<{ value: RoleType; label: string; icon: typeof Users }> = [
  { value: "Admin", label: "Hospital Administrator", icon: LayoutDashboard },
  { value: "Doctor", label: "Doctor / Specialist", icon: UserRoundCog },
  { value: "Nurse", label: "Triage Nurse", icon: Users },
  { value: "Pharmacist", label: "Pharmacist", icon: Pill },
  { value: "LabTech", label: "Lab Pathologist", icon: FlaskConical },
  { value: "Cashier", label: "Billing Cashier", icon: FileText },
];

interface LiveNotification {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  desc: string;
  time: string;
  icon: typeof AlertTriangle;
  color: string;
}

function useLiveNotifications(): LiveNotification[] {
  const { data: labsData } = useLabReports();
  const { data: medicinesData } = useMedicines();
  const { data: appointmentsData } = useAppointments();
  const { prefs } = useStaffPrefs();

  const notes: LiveNotification[] = [];

  for (const lab of labsData?.data ?? []) {
    const abnormal = lab.results.filter((r) => r.isAbnormal);
    for (const r of abnormal) {
      notes.push({
        id: `${lab.id}-${r.parameter}`,
        type: "critical",
        title: "Critical Lab Value",
        desc: `${lab.id}: ${r.parameter} ${r.value} ${r.unit} (ref ${r.normalRange})`,
        time: lab.orderDate,
        icon: AlertTriangle,
        color: "text-red-600 bg-red-500/10",
      });
    }
    if (lab.status === "Report Approved") {
      notes.push({
        id: `${lab.id}-ready`,
        type: "info",
        title: "Lab Report Ready",
        desc: `${lab.testName} approved for ${lab.patientName}`,
        time: lab.orderDate,
        icon: FlaskConical,
        color: "text-green-700 bg-green-500/10",
      });
    }
  }

  for (const med of medicinesData?.data ?? []) {
    if (med.status === "Low Stock" || med.status === "Expired") {
      notes.push({
        id: med.id,
        type: med.status === "Expired" ? "critical" : "warning",
        title: med.status === "Expired" ? "Batch Expired" : "Low Stock Alert",
        desc: `${med.brandName}: ${med.stockCount} units (Min: ${med.minThreshold})`,
        time: med.expiryDate,
        icon: Package,
        color:
          med.status === "Expired"
            ? "text-red-600 bg-red-500/10"
            : "text-amber-700 bg-amber-500/10",
      });
    }
  }

  for (const appt of appointmentsData?.data ?? []) {
    if (appt.priority === "Emergency" && appt.status !== "Completed" && appt.status !== "Cancelled") {
      notes.push({
        id: appt.id,
        type: "info",
        title: "Emergency Token",
        desc: `${appt.patientName} • ${appt.department} • ${appt.timeSlot}`,
        time: appt.date,
        icon: Zap,
        color: "text-blue-700 bg-blue-500/10",
      });
    }
  }

  return notes
    .filter(
      (n) =>
        (n.type === "critical" && prefs.showCritical) ||
        (n.type === "warning" && prefs.showWarning) ||
        (n.type === "info" && prefs.showInfo),
    )
    .slice(0, 20);
}

function LiveClock() {
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const tick = (): void => {
      setClock(
        new Date().toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden font-mono text-sm tabular-nums text-muted-foreground md:block" aria-live="off">
      {clock}
    </span>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const [query, setQuery] = useState("");
  const { data: patientsData } = usePatients(query ? { search: query } : undefined);
  const { data: doctorsData } = useDoctors();
  const { data: appointmentsData } = useAppointments(query ? { search: query } : undefined);
  const foundPatients = (patientsData?.data ?? []).slice(0, 4);
  const q = query.toLowerCase();
  const foundDoctors = (doctorsData?.data ?? [])
    .filter((d) => !q || `${d.name} ${d.id} ${d.department}`.toLowerCase().includes(q))
    .slice(0, 4);
  const foundAppointments = (appointmentsData?.data ?? []).slice(0, 4);
  const notifications = useLiveNotifications();
  const unreadCount = notifRead ? 0 : notifications.length;
  const criticalCount = notifications.filter((n) => n.type === "critical").length;
  const role = useAppSelector((s) => s.auth.role);
  const userName = useAppSelector((s) => s.auth.userName);
  const dispatch = useAppDispatch();
  const searchRef = useRef<HTMLInputElement>(null);

  const currentRole = ROLES.find((r) => r.value === role) ?? ROLES[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (id: string): void => {
    if (id.startsWith("CP-")) router.push(`/patients/${id}`);
    else if (id.startsWith("DOC-")) router.push("/doctors");
    else if (id.startsWith("APT-")) router.push("/appointments");
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur-md dark:bg-card/85">
      <div className="flex h-16 items-center gap-2 px-4 md:gap-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={onMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-10 justify-start gap-2 px-3 sm:w-64 lg:w-80"
              aria-label="Universal search (Ctrl+K)"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="hidden truncate text-sm font-normal text-muted-foreground sm:block">
                Search patients, doctors, appointments…
              </span>
              <kbd className="ml-auto hidden rounded bg-muted px-1.5 font-mono text-[11px] lg:inline-flex">Ctrl K</kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0" sideOffset={8} align="start">
            <Command shouldFilter={false}>
              <CommandInput
                ref={searchRef}
                placeholder="Type name, ID, department…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Patients">
                  {foundPatients.map((p) => (
                    <CommandItem key={p.id} value={`${p.fullName} ${p.id}`} onSelect={() => go(p.id)}>
                      <span className="font-medium">{p.fullName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.id} • {p.age}yr • {p.bloodGroup}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Doctors">
                  {foundDoctors.map((d) => (
                    <CommandItem key={d.id} value={`${d.name} ${d.id}`} onSelect={() => go(d.id)}>
                      <span className="font-medium">{d.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {d.department} • {d.roomNo}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Appointments">
                  {foundAppointments.map((a) => (
                    <CommandItem key={a.id} value={`${a.id} ${a.patientName}`} onSelect={() => go(a.id)}>
                      <span className="font-medium">{a.id}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {a.patientName} • {a.timeSlot}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {criticalCount > 0 && (
          <div className="hidden items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 xl:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            {criticalCount} critical alert{criticalCount === 1 ? "" : "s"} • {notifications.length} total
          </div>
        )}

        <div className="flex-1" />

        <LiveClock />

        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Notifications">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />}
              </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-96 p-0">
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="font-semibold">Notifications</h4>
              <Button variant="ghost" size="sm" onClick={() => setNotifRead(true)}>
                Mark all read
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No alerts right now.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b p-4 transition-colors hover:bg-muted/50",
                    n.type === "critical" && "border-l-4 border-l-red-500"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("flex-shrink-0 rounded-lg p-2", n.color)}>
                      <n.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 rounded-full pr-2" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-clinical text-xs font-semibold text-white">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-left text-xs font-medium lg:block">
                {currentRole.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{currentRole.label}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onSelect={() => {
              clearSession();
              dispatch(logout());
              router.push("/login");
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
