"use client";

import { useCallback, useEffect, useState } from "react";

export type BookingPriority = "Routine" | "Urgent" | "Emergency";

export interface StaffPrefs {
  // Which alert severities appear in the top-bar bell. All on by default.
  showCritical: boolean;
  showWarning: boolean;
  showInfo: boolean;
  // Pre-selected priority in the booking popup (staff can still change it).
  defaultPriority: BookingPriority;
}

const STORAGE_KEY = "careplus_staff_prefs";

const DEFAULTS: StaffPrefs = {
  showCritical: true,
  showWarning: true,
  showInfo: true,
  defaultPriority: "Routine",
};

function load(): StaffPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StaffPrefs>;
    return {
      showCritical: parsed.showCritical ?? DEFAULTS.showCritical,
      showWarning: parsed.showWarning ?? DEFAULTS.showWarning,
      showInfo: parsed.showInfo ?? DEFAULTS.showInfo,
      defaultPriority: ["Routine", "Urgent", "Emergency"].includes(parsed.defaultPriority ?? "")
        ? (parsed.defaultPriority as BookingPriority)
        : DEFAULTS.defaultPriority,
    };
  } catch {
    return DEFAULTS;
  }
}

// Personal working preferences for the signed-in staff member, kept on this
// device. Everything stored here is consumed by real UI: the bell filters by
// the alert toggles, the booking popup pre-selects the default priority.
export function useStaffPrefs(): {
  prefs: StaffPrefs;
  savePrefs: (next: StaffPrefs) => void;
} {
  const [prefs, setPrefs] = useState<StaffPrefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(load());
  }, []);

  const savePrefs = useCallback((next: StaffPrefs): void => {
    setPrefs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — keep in-memory value
    }
  }, []);

  return { prefs, savePrefs };
}
