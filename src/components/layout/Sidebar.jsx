import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import logo from "/SoftClub-logo.svg";
// eslint-disable-next-line
const Item = ({ to, icon: IconComponent, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-300",
        isActive 
          ? "bg-gradient-to-r from-sky-600/10 to-blue-600/10 text-primary shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-gradient-to-b from-sky-600 to-blue-600" />
        )}
        <IconComponent className={cn("h-5 w-5 transition-colors", isActive ? "text-sky-600 dark:text-sky-400" : "group-hover:text-foreground")} />
        <span className="relative z-10">{label}</span>
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col h-screen md:gap-6 md:border-r md:border-white/5 md:bg-background/80 md:backdrop-blur-xl md:p-5 shadow-2xl z-50">
      <div className="flex items-center justify-between px-2">
        <div className="flex w-full flex-col">
          <img src={logo} alt="SoftClub Logo" className="w-full -mt-16 drop-shadow-lg" />
        </div>
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex flex-col gap-2">
        <Item to="/dashboard/home" icon={LayoutDashboard} label={t("dashboard")} />
        <Item to="/dashboard/events" icon={CalendarDays} label={t("events")} />
      </nav>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-4 border border-white/5">
        <p className="text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} SoftClub
        </p>
      </div>
    </aside>
  );
}

