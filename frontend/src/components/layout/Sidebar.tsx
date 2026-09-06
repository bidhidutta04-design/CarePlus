"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  HeartPulse, Users, UserRound, Building2, Bed, FileText, Pill,
  FlaskConical, Boxes, IdCard, ChartLine, Settings, Phone,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { switchRole } from "@/store/authSlice";
import type { RoleType } from "@/types/common";
import { useAppointments } from "@/hooks/useAppointments";
import { useMedicines } from "@/hooks/usePharmacy";
import { useLabReports } from "@/hooks/useLab";

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof HeartPulse; badge: BadgeType; live?: boolean }> = [
  { href: "/", label: "Dashboard", icon: HeartPulse, badge: null },
  { href: "/appointments", label: "Appointments", icon: Users, badge: "appointments" },
  { href: "/patients", label: "Patients", icon: Users, badge: null },
  { href: "/doctors", label: "Doctors", icon: UserRound, badge: null },
  { href: "/departments", label: "Departments", icon: Building2, badge: null },
  { href: "/departments/beds", label: "Inpatient Beds", icon: Bed, badge: "live", live: true },
  { href: "/billing", label: "Billing", icon: FileText, badge: null },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill, badge: "lowstock" },
  { href: "/lab-reports", label: "Lab Reports", icon: FlaskConical, badge: "pending" },
  { href: "/inventory", label: "Inventory", icon: Boxes, badge: null },
  { href: "/staff", label: "Staff", icon: IdCard, badge: null },
  { href: "/reports", label: "Reports", icon: ChartLine, badge: null },
  { href: "/settings", label: "Settings", icon: Settings, badge: null },
];

type BadgeType = "appointments" | "lowstock" | "pending" | "live" | null;

function SidebarInner({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const role = useAppSelector((s) => s.auth.role);
  const userName = useAppSelector((s) => s.auth.userName);
  const dispatch = useAppDispatch();
  const { data: appointmentsData } = useAppointments();
  const { data: medicinesData } = useMedicines();
  const { data: labsData } = useLabReports();

  const counts = useMemo(() => {
    const appointments = appointmentsData?.data ?? [];
    const medicines = medicinesData?.data ?? [];
    const labs = labsData?.data ?? [];
    let active = 0;
    for (const a of appointments) if (a.status === "Waiting" || a.status === "In Triage") active += 1;
    let low = 0;
    for (const m of medicines) if (m.status === "Low Stock" || m.status === "Expired") low += 1;
    let pending = 0;
    for (const l of labs) if (l.status !== "Report Approved") pending += 1;
    return { appointments: active, lowstock: low, pending, live: null as number | null };
  }, [appointmentsData, medicinesData, labsData]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-navy text-white transition-[width,transform] duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!mobileOpen ? undefined : false}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex items-center gap-3 border-b border-white/10 p-4", collapsed && "justify-center")}>
            <HeartPulse className="text-2xl text-accent" aria-hidden="true" />
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-lg font-bold tracking-tight">CarePlus</span>
                <span className="text-xs text-white/60">Enterprise HMS</span>
              </div>
            )}
            <button
              onClick={onCloseMobile}
              className="ml-auto rounded-lg p-1.5 hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Sidebar navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const count = item.badge === null ? null : counts[item.badge];
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
                    "text-white/80 hover:bg-white/10 hover:text-white",
                    isActive && "bg-clinical/30 text-white shadow-lg shadow-clinical/20",
                    collapsed && "justify-center"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                  {count !== null && count > 0 && !collapsed && (
                    <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-navy">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                  {item.live && !collapsed && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
                      Live
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className={cn("border-t border-white/10 p-4", collapsed && "flex justify-center")}>
            {!collapsed ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Current Role</span>
                  <select
                    className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    value={role}
                    onChange={(e) => dispatch(switchRole(e.target.value as RoleType))}
                    aria-label="Switch role"
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="LabTech">Lab Tech</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/60">24/7 Support</p>
                    <a href="tel:+19877654320" className="block truncate text-sm font-semibold text-white transition-colors hover:text-accent">
                      +1 (987) 765 4320
                    </a>
                  </div>
                </div>
                <p className="text-center text-xs text-white/40">{userName}</p>
              </div>
            ) : (
              <button
                onClick={onToggleCollapse}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20 lg:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarInner);
