import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function DashboardLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[280px] max-w-[85vw] border-r p-0"
          showCloseButton={true}
        >
          <MobileNav onLinkClick={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative flex">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block md:w-72">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>

        {/* Main */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar onMobileMenuClick={() => setMobileNavOpen(true)} />

          <main className="relative min-w-0 flex-1 p-4 md:p-6">
            {/* background glow - overflow-hidden contains the blurs so they don't extend the scrollable area */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-muted/40 blur-3xl" />
              <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-muted/30 blur-3xl" />
              <div className="absolute left-1/2 -top-30 h-72 w-72 -translate-x-1/2 rounded-full bg-muted/20 blur-3xl" />
            </div>

            <div className="relative mx-auto w-full max-w-full md:max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
