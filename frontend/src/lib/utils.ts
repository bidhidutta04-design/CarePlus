import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatINR(n: number): string {
  return "₹ " + n.toLocaleString("en-IN");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
