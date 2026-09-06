"use client";

import { useCallback, useEffect, useState } from "react";

export interface HospitalSettings {
  hospitalName: string;
  slotMinutes: 10 | 15 | 20 | 30 | 60;
  // Optional public contact details shown on the landing page.
  // Empty = hidden, so no placeholder phone/address is ever displayed.
  contactPhone: string;
  contactPhoneHref: string;
  address: string;
  opdHoursNote: string;
}

const STORAGE_KEY = "careplus_hospital_settings";

const DEFAULTS: HospitalSettings = {
  hospitalName: "CarePlus Multi-Speciality Hospital",
  slotMinutes: 30,
  contactPhone: "",
  contactPhoneHref: "",
  address: "",
  opdHoursNote: "OPD Mon–Sat, 9 AM – 5 PM • Emergency wing never closes",
};

function load(): HospitalSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HospitalSettings>;
    return {
      hospitalName:
        typeof parsed.hospitalName === "string" && parsed.hospitalName.trim().length > 0
          ? parsed.hospitalName
          : DEFAULTS.hospitalName,
      slotMinutes: [10, 15, 20, 30, 60].includes(parsed.slotMinutes as number)
        ? (parsed.slotMinutes as HospitalSettings["slotMinutes"])
        : DEFAULTS.slotMinutes,
      contactPhone: typeof parsed.contactPhone === "string" ? parsed.contactPhone : "",
      contactPhoneHref: typeof parsed.contactPhoneHref === "string" ? parsed.contactPhoneHref : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
      opdHoursNote:
        typeof parsed.opdHoursNote === "string" && parsed.opdHoursNote.trim().length > 0
          ? parsed.opdHoursNote
          : DEFAULTS.opdHoursNote,
    };
  } catch {
    return DEFAULTS;
  }
}

// Hospital-level preferences, persisted on this device.
// The OPD slot interval genuinely drives the booking slot picker.
export function useHospitalSettings(): {
  settings: HospitalSettings;
  saveSettings: (next: HospitalSettings) => void;
} {
  const [settings, setSettings] = useState<HospitalSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(load());
  }, []);

  const saveSettings = useCallback((next: HospitalSettings): void => {
    setSettings(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — keep in-memory value
    }
  }, []);

  return { settings, saveSettings };
}

// OPD working hours 09:00–17:00 with a lunch break 13:00–14:00.
export function buildSlots(slotMinutes: number): string[] {
  const slots: string[] = [];
  const fmt = (h: number, m: number): string => {
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  for (let mins = 9 * 60; mins < 17 * 60; mins += slotMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 13) continue; // lunch hour
    slots.push(fmt(h, m));
  }
  return slots;
}
