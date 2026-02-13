import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import logo from "/SoftClub-logo.png";
const Item = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition",
        "hover:bg-muted/60",
        isActive ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
      )
    }
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col h-screen md:gap-6 md:border-r md:bg-background md:p-5">
      <div className="flex items-center justify-between">
        <div className="flex w-full flex-col">
          <img src={logo} alt="SoftClub Logo" className="w-full" />
        </div>
      </div>

      <Separator />

      <nav className="flex flex-col gap-2">
        <Item to="/dashboard/home" icon={LayoutDashboard} label="Dashboard" />
        <Item to="/dashboard/events" icon={CalendarDays} label="Events" />
      </nav>
    </aside>
  );
}
