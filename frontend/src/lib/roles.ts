import type { RoleType } from "@/types/common";

// Central role model — single source of truth for role-based workspaces.
// UI gating only: the backend re-verifies every request with RBAC, so a
// forged role cookie can reveal navigation but never data or actions.

export const ROLE_HOME: Record<RoleType, string> = {
  Admin: "/dashboard",
  Doctor: "/desk/doctor",
  Nurse: "/desk/nurse",
  Pharmacist: "/desk/pharmacy",
  LabTech: "/desk/lab",
  Cashier: "/desk/billing",
};

export const ROLE_LABEL: Record<RoleType, string> = {
  Admin: "Hospital Administrator",
  Doctor: "Doctor / Specialist",
  Nurse: "Triage Nurse",
  Pharmacist: "Pharmacist",
  LabTech: "Lab Pathologist",
  Cashier: "Billing Cashier",
};

// Path prefixes each role may visit. Admin ("*") may visit everything.
// /settings opens for every role — the page itself decides what each role
// may change (hospital profile is admin-only, theme is personal).
// Keep in sync with backend RBAC — backend is the enforcing layer.
export const ROLE_PATHS: Record<RoleType, string[]> = {
  Admin: ["*"],
  Doctor: ["/desk/doctor", "/appointments", "/patients", "/doctors", "/lab-reports", "/departments", "/settings"],
  Nurse: ["/desk/nurse", "/appointments", "/patients", "/departments/beds", "/departments", "/settings"],
  Pharmacist: ["/desk/pharmacy", "/pharmacy", "/inventory", "/settings"],
  LabTech: ["/desk/lab", "/lab-reports", "/patients", "/settings"],
  Cashier: ["/desk/billing", "/billing", "/patients", "/settings"],
};

export function isValidRole(value: string | undefined | null): value is RoleType {
  return (
    value === "Admin" ||
    value === "Doctor" ||
    value === "Nurse" ||
    value === "Pharmacist" ||
    value === "LabTech" ||
    value === "Cashier"
  );
}

export function pathAllowed(role: RoleType, pathname: string): boolean {
  const allowed = ROLE_PATHS[role];
  if (allowed.includes("*")) return true;
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function homeFor(role: RoleType): string {
  return ROLE_HOME[role];
}

// URL slugs for role-specific login pages (/login/doctor, /login/admin, …)
export const ROLE_SLUGS: Record<string, RoleType> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  labtech: "LabTech",
  cashier: "Cashier",
};

export function roleFromSlug(slug: string | undefined): RoleType | null {
  if (!slug) return null;
  return ROLE_SLUGS[slug.toLowerCase()] ?? null;
}

export function slugFor(role: RoleType): string {
  const entry = Object.entries(ROLE_SLUGS).find(([, r]) => r === role);
  return entry ? entry[0] : "admin";
}
