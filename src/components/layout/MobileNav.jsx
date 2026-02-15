import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import logo from "/SoftClub-logo.svg";

// eslint-disable-next-line
const Item = ({ to, icon: IconComponent, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition",
        "hover:bg-muted/60",
        isActive ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
      )
    }
  >
    <IconComponent className="h-4 w-4" />
    <span>{label}</span>
  </NavLink>
);

export default function MobileNav({ onLinkClick }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex w-full flex-col">
        <img src={logo} alt="SoftClub Logo" className="w-full -mt-16" />
      </div>
      <Separator />
      <nav className="flex flex-col gap-2">
        <Item
          to="/dashboard/home"
          icon={LayoutDashboard}
          label={t("dashboard")}
          onClick={onLinkClick}
        />
        <Item
          to="/dashboard/events"
          icon={CalendarDays}
          label={t("events")}
          onClick={onLinkClick}
        />
      </nav>
    </div>
  );
}
