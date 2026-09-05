"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { useDoctors } from "@/hooks/useDoctors";
import { formatINR } from "@/lib/utils";
import { UserRound, Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { AddDoctorModal } from "@/components/clinical/AddDoctorModal";
import "swiper/css";
import "swiper/css/pagination";

export default function DoctorsPage() {
  const appointments = useAppSelector((s) => s.clinical.appointments);
  const [dept, setDept] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useDoctors();
  const doctors = data?.data ?? [];

  const depts = ["All", ...Array.from(new Set(doctors.map((d) => d.department)))];
  const list = dept === "All" ? doctors : doctors.filter((d) => d.department === dept);
  const queue = selected ? appointments.filter((a) => a.doctorId === selected && ["Waiting", "In Triage", "With Doctor"].includes(a.status)) : [];
  const selDoc = doctors.find((d) => d.id === selected);

  return (
    <div>
      <PageHeader
        title="Doctors & Clinical Desks"
        subtitle={isLoading ? "Loading doctors…" : `${doctors.length} specialists • swipe or filter`}
        actions={
          <>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" aria-label="Filter department">
              {depts.map((d) => <option key={d}>{d}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Doctor
            </Button>
          </>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading doctors…</p>
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">No doctors found.</p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <Swiper modules={[Pagination]} pagination={{ clickable: true }} spaceBetween={16} slidesPerView={1}
          breakpoints={{ 640: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }} className="!pb-10">
          {list.map((d) => (
            <SwiperSlide key={d.id}>
              <Card className="h-full rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f0f9] text-[#11507a]">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-lg">{d.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{d.specialization || "Specialization not available"}</p>
                      </div>
                    </div>
                    <StatusBadge status={d.availability} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-1 text-sm">
                  <p><span className="text-muted-foreground">Dept:</span> {d.department} • Room {d.roomNo}</p>
                  <p><span className="text-muted-foreground">Qualification:</span> {d.qualification}</p>
                  <p><span className="text-muted-foreground">Hours:</span> {d.schedule.hours} ({d.schedule.days.join(", ")})</p>
                  <p><span className="text-muted-foreground">Fee:</span> <span className="font-semibold">{formatINR(d.fee)}</span></p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setSelected(d.id)}>
                    Daily queue ({appointments.filter((a) => a.doctorId === d.id && ["Waiting", "In Triage", "With Doctor"].includes(a.status)).length})
                  </Button>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {selDoc && (
        <Card className="rounded-2xl shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-px">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selDoc.name} — today&apos;s queue</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {queue.length === 0 && <p className="text-sm text-muted-foreground">No waiting patients.</p>}
            {queue.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <span className="font-semibold">{a.tokenNo} • {a.patientName}</span>
                <span className="text-muted-foreground">
                  {a.vitals ? `BP ${a.vitals.bp} • P ${a.vitals.pulse} • SpO2 ${a.vitals.spo2}% • ${a.vitals.temp}°F` : "Vitals pending"}
                </span>
                <span className="flex gap-2"><StatusBadge status={a.status} /><StatusBadge status={a.priority} /></span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AddDoctorModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
