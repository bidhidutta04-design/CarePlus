"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HeartPulse,
  Stethoscope,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Microscope,
  Ambulance,
  ArrowRight,
  UserRound,
} from "lucide-react";

interface PublicDepartment {
  id: string;
  name: string;
  hod: string;
  opdRooms: number;
  icon: string;
}

interface PublicDoctor {
  id: string;
  name: string;
  qualification: string;
  department: string;
  roomNo: string;
}

interface PublicStats {
  departments: number;
  doctors: number;
  support24x7: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const FALLBACK_DEPARTMENTS: PublicDepartment[] = [
  { id: "DEP-05", name: "General Medicine", hod: "Dr. Sandeep Jain", opdRooms: 4, icon: "Stethoscope" },
  { id: "DEP-01", name: "Cardiology", hod: "Dr. Amit Verma", opdRooms: 3, icon: "HeartPulse" },
  { id: "DEP-03", name: "Pediatrics", hod: "Dr. Pooja Sharma", opdRooms: 3, icon: "Baby" },
  { id: "DEP-02", name: "Orthopedics", hod: "Dr. Rajesh Kumar", opdRooms: 2, icon: "Bone" },
  { id: "DEP-04", name: "Gynecology", hod: "Dr. Neha Kapoor", opdRooms: 2, icon: "HeartHandshake" },
  { id: "DEP-06", name: "Neurology", hod: "Dr. Vikram Rao", opdRooms: 1, icon: "Brain" },
];

const FALLBACK_DOCTORS: PublicDoctor[] = [
  { id: "DOC-101", name: "Dr. Amit Verma", qualification: "MD Cardiology", department: "Cardiology", roomNo: "C-101" },
  { id: "DOC-104", name: "Dr. Pooja Sharma", qualification: "MD Pediatrics", department: "Pediatrics", roomNo: "P-301" },
  { id: "DOC-105", name: "Dr. Sandeep Jain", qualification: "MD General Medicine", department: "General Medicine", roomNo: "M-105" },
];

const WHY_US = [
  { icon: ShieldCheck, title: "NABL-Accredited Care", desc: "Audited clinical pathways, infection control, and medication safety on every ward." },
  { icon: Microscope, title: "In-House Diagnostics", desc: "Pathology, radiology, and pharmacy under one roof — reports in hours, not days." },
  { icon: Ambulance, title: "24×7 Emergency", desc: "Round-the-clock trauma response with a dedicated emergency wing and ICU." },
  { icon: Clock, title: "On-Time OPD", desc: "Token-based queues with live status — no crowded waiting halls." },
];

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: T };
    return body.data;
  } catch {
    return null;
  }
}

export default function LandingPage() {
  const [departments, setDepartments] = useState<PublicDepartment[]>(FALLBACK_DEPARTMENTS);
  const [doctors, setDoctors] = useState<PublicDoctor[]>(FALLBACK_DOCTORS);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    void (async () => {
      const [deps, docs, st] = await Promise.all([
        getJSON<PublicDepartment[]>("/public/departments"),
        getJSON<PublicDoctor[]>("/public/doctors"),
        getJSON<PublicStats>("/public/stats"),
      ]);
      if (deps && deps.length > 0) setDepartments(deps.slice(0, 6));
      if (docs && docs.length > 0) setDoctors(docs.slice(0, 3));
      if (st) setStats(st);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy">
            <HeartPulse className="h-5 w-5 animate-pulse text-accent" />
          </span>
          <div className="leading-tight">
            <p className="font-bold text-navy">CarePlus Hospital</p>
            <p className="text-xs text-muted-foreground">Multi-Speciality Care</p>
          </div>
          <div className="flex-1" />
          <a href="#departments" className="hidden text-sm font-medium text-muted-foreground hover:text-navy sm:block">Departments</a>
          <a href="#doctors" className="hidden text-sm font-medium text-muted-foreground hover:text-navy sm:block">Doctors</a>
          <a href="#contact" className="hidden text-sm font-medium text-muted-foreground hover:text-navy sm:block">Contact</a>
          <Button asChild size="sm">
            <Link href="/portal"><UserRound className="mr-1.5 h-4 w-4" />Staff Portal</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              24×7 Emergency & ICU
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Advanced care,<br />human touch.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Six specialities, NABL-accredited diagnostics, and token-based OPD queues —
              so you spend minutes waiting, not hours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-clinical hover:bg-clinical/90">
                <a href="#departments">Explore departments <ArrowRight className="ml-1.5 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href="tel:+19877654320"><Phone className="mr-1.5 h-4 w-4" />+1 (987) 765 4320</a>
              </Button>
            </div>
          </div>
          <div className="grid content-center gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-white/10 bg-white/5 text-center text-white">
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-accent">{stats?.departments ?? 6}+</p>
                  <p className="text-xs text-white/60">Specialities</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5 text-center text-white">
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-accent">{stats?.doctors ?? 10}+</p>
                  <p className="text-xs text-white/60">Specialists</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5 text-center text-white">
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-accent">24×7</p>
                  <p className="text-xs text-white/60">Emergency</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="flex items-center gap-3 p-4 text-sm">
                <Clock className="h-5 w-5 shrink-0 text-accent" />
                OPD Mon–Sat, 9 AM – 5 PM • Emergency wing never closes
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14">
        <h2 className="text-2xl font-bold text-navy">Centres of excellence</h2>
        <p className="mt-1 text-sm text-muted-foreground">Led by senior consultants, backed by in-house diagnostics.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.id} className="rounded-2xl shadow-card">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="rounded-xl bg-clinical/10 p-2 text-clinical">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <CardTitle className="text-lg">{d.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                HOD: <span className="font-medium text-foreground">{d.hod}</span> • {d.opdRooms} OPD rooms
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="border-y border-border bg-white">
        <div className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14">
          <h2 className="text-2xl font-bold text-navy">Meet our specialists</h2>
          <p className="mt-1 text-sm text-muted-foreground">A few of the consultants leading our OPDs.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {doctors.map((d) => (
              <Card key={d.id} className="rounded-2xl shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{d.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{d.qualification}</p>
                </CardHeader>
                <CardContent className="text-sm">
                  {d.department} • Room {d.roomNo}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-navy">Why choose CarePlus</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((w) => (
            <Card key={w.title} className="rounded-2xl shadow-card">
              <CardHeader className="pb-2">
                <span className="w-fit rounded-xl bg-clinical/10 p-2 text-clinical">
                  <w.icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-base">{w.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{w.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact + footer */}
      <footer id="contact" className="scroll-mt-20 bg-navy text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-bold">
              <HeartPulse className="h-5 w-5 text-accent" /> CarePlus Hospital
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm text-white/60">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 12 MG Road, Medical District
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+19877654320" className="hover:text-accent">+1 (987) 765 4320</a>
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">For hospital staff</p>
            <p className="mt-2 text-white/60">Doctors, nurses, pharmacists, lab and billing desks sign in through the secure staff portal.</p>
            <Button asChild size="sm" variant="outline" className="mt-3 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/portal">Open Staff Portal</Link>
            </Button>
          </div>
          <div className="text-sm text-white/60 md:text-right">
            <p>© 2026 CarePlus Hospital. All rights reserved.</p>
            <p className="mt-1">Emergency: +1 (987) 765 4320</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
