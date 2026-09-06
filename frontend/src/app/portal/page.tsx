"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HeartPulse,
  LayoutDashboard,
  UserRoundCog,
  Users,
  Pill,
  FlaskConical,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const DESKS = [
  {
    role: "Doctor / Specialist",
    slug: "doctor",
    icon: UserRoundCog,
    access: "OPD token queue, patient 360° charts, e-prescriptions, lab lookups.",
  },
  {
    role: "Triage Nurse",
    slug: "nurse",
    icon: Users,
    access: "Vitals recording, OPD queue management, bed monitoring.",
  },
  {
    role: "Pharmacist",
    slug: "pharmacist",
    icon: Pill,
    access: "Fulfillment queue, FEFO drug inventory, smart dispenser.",
  },
  {
    role: "Lab Pathologist",
    slug: "labtech",
    icon: FlaskConical,
    access: "Specimen intake, result entry, report approval and sign-off.",
  },
  {
    role: "Billing Cashier",
    slug: "cashier",
    icon: FileText,
    access: "Invoice desk, TPA insurance claims, receipts and collections.",
  },
  {
    role: "Hospital Administrator",
    slug: "admin",
    icon: LayoutDashboard,
    access: "Full system oversight, staff accounts, audit trail, analytics.",
  },
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/"><ArrowLeft className="mr-1.5 h-4 w-4" />Hospital site</Link>
          </Button>
          <div className="flex-1" />
          <span className="flex items-center gap-2 font-bold text-navy">
            <HeartPulse className="h-5 w-5 text-clinical" /> Staff Portal
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-navy">Hospital staff sign-in</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          CarePlus is a closed hospital system — accounts are created by your administrator
          during onboarding. There is no public registration. Find your desk below, then sign
          in with your hospital email and password.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESKS.map((d) => (
            <Link key={d.role} href={`/login/${d.slug}`} className="block">
              <Card className="rounded-2xl shadow-card transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <span className="rounded-xl bg-clinical/10 p-2 text-clinical">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base">{d.role}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {d.access}
                  <span className="mt-2 flex items-center gap-1 font-medium text-clinical">
                    Sign in as {d.role.split(" / ")[0].split(" ").pop()} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-5 shadow-card">
          <div className="flex-1">
            <p className="font-semibold text-navy">Have your hospital credentials?</p>
            <p className="text-sm text-muted-foreground">
              New staff must change the temporary password on first login. Forgot yours?
              Use the recovery option on the sign-in screen.
            </p>
          </div>
          <Button asChild>
            <Link href="/login">Go to sign in <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
