import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

export function KpiCard({
  icon: Icon,
  label,
  value,
  rawValue,
  formatValue,
  sub,
  tone = "blue",
  animateDuration,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  rawValue?: number;
  formatValue?: (n: number) => string;
  sub?: string;
  tone?: "blue" | "green" | "amber" | "red";
  animateDuration?: number;
}) {
  const tones: Record<string, string> = {
    blue: "bg-[#e3f0f9] text-[#11507a]",
    green: "bg-[#e6f5e8] text-[#2e7d32]",
    amber: "bg-[#fef2d6] text-[#965f0e]",
    red: "bg-[#fde8e8] text-[#c62828]",
  };
  return (
    <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={cn("rounded-xl p-2", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-[#0b2b4a] dark:text-foreground">
          {rawValue !== undefined && formatValue ? (
            <AnimatedNumber
              value={rawValue}
              format={formatValue}
              duration={animateDuration}
            />
          ) : (
            value
          )}
        </p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
