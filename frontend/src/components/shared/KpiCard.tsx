import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    blue: "bg-[#e3f0f9] text-[#11507a]",
    green: "bg-[#e6f5e8] text-[#2e7d32]",
    amber: "bg-[#fef2d6] text-[#965f0e]",
    red: "bg-[#fde8e8] text-[#c62828]",
  };
  return (
    <Card className="rounded-2xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={cn("rounded-xl p-2", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-[#0b2b4a] dark:text-foreground">{value}</p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
