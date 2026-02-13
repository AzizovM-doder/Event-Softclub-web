import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative flex">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block md:w-72">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />

          <main className="relative flex-1 p-4 md:p-6">
            {/* background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-muted/40 blur-3xl" />
              <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-muted/30 blur-3xl" />
              <div className="absolute left-1/2 top-[-120px] h-72 w-72 -translate-x-1/2 rounded-full bg-muted/20 blur-3xl" />
            </div>

            <div className="relative mx-auto w-full max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
