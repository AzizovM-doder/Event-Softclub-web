import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { CalendarDays, LayoutDashboard, Image, Video, Users, User } from "lucide-react";
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
  const user = useSelector((s) => s.auth.user);
  const showUsers = user?.role === "ADMIN" || user?.role === "MENTOR";

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
        
        {/* Content sections */}
        <Separator className="bg-white/10 my-2" />
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
          {t("content") || "Content"}
        </p>
        <Item to="/dashboard/photos" icon={Image} label={t("photos") || "Photos"} />
        <Item to="/dashboard/videos" icon={Video} label={t("videos") || "Videos"} />

        {/* Management section */}
        <Separator className="bg-white/10 my-2" />
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
          {t("management") || "Management"}
        </p>
        {showUsers && (
          <Item to="/dashboard/users" icon={Users} label={t("users") || "Users"} />
        )}
        <Item to="/dashboard/profile" icon={User} label={t("profile") || "Profile"} />
      </nav>

      {/* User info */}
      {user && (
        <div className="mt-auto space-y-3">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-sm font-medium truncate">{user.name} {user.surname || ""}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className={cn(
              "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
              user.role === "ADMIN" 
                ? "bg-sky-500/20 text-sky-400" 
                : "bg-emerald-500/20 text-emerald-400"
            )}>
              {user.role}
            </span>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-4 border border-white/5">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} SoftClub
            </p>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-1">
              Created by Azizov MuhammadUmar
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
