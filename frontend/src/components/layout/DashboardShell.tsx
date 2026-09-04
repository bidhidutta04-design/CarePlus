"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { QuickActionsBar } from "@/components/layout/QuickActionsBar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Always close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Hamburger: drawer on mobile, rail collapse on desktop.
  const handleMenu = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }, []);

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-canvas dark:bg-background">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={closeMobile}
      />
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <TopBar onMenu={handleMenu} />
        <QuickActionsBar />
        <main className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</main>
        <footer className="print-hidden mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 pb-6 text-xs text-muted-foreground md:flex-row md:justify-between md:px-6">
          <span>© 2026 CarePlus Hospital Management System. All rights reserved.</span>
          <span className="flex gap-4">
            <a href="/settings" className="text-clinical hover:underline">Privacy Policy</a>
            <a href="/settings" className="text-clinical hover:underline">Terms &amp; Conditions</a>
          </span>
        </footer>
      </div>
    </div>
  );
}
