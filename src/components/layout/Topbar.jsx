import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Trash2, MapPin, LogOut, Languages, Moon, Sun, Menu, Volume2 } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import useEventNotifications from "../../hooks/useEventNotifications";
import { playNotificationSound } from "../../utils/sound";
import {
  clearAll,
  markAllRead,
  markRead,
} from "../../features/notifications/notificationsSlice";
import { logout } from "../../features/auth/authSlice";
import { fetchEvents } from "../../features/events/eventsSlice";

function openGoogleMaps(location) {
  const loc = (location || "").trim();
  if (!loc) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    loc
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const LANG_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
  { value: "tj", label: "TJ" },
];

export default function Topbar({ onMobileMenuClick }) {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const user = useSelector((s) => s.auth?.user);
  const eventsState = useSelector((s) => s.events || {});
  const notifState = useSelector((s) => s.notifications || {});

  const events = eventsState.items || [];
  const eventsLoading = !!eventsState.loading;

  const notifs = notifState.items || [];

  // ✅ GLOBAL fetch so notifications work on every page
  useEffect(() => {
    // only fetch if empty and not already loading
    if (!eventsLoading && (!events || events.length === 0)) {
      dispatch(fetchEvents());
    }
  }, [dispatch, eventsLoading, events?.length]);

  // ✅ GLOBAL notifier
  useEventNotifications(events, { pollMs: 10_000 }); // test. later 30_000

  const unread = useMemo(
    () => notifs.reduce((acc, n) => acc + (n?.read ? 0 : 1), 0),
    [notifs]
  );

  const latest = useMemo(() => notifs.slice(0, 8), [notifs]);

  const initials = useMemo(() => {
    const name = (user?.username || user?.userName || user?.name || "A").trim();
    const parts = name.split(" ").filter(Boolean);
    const a = (parts[0] || "A")[0] || "A";
    const b = (parts[1] || parts[0] || "A")[0] || "A";
    return (a + b).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:max-w-6xl md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl md:hidden"
            onClick={() => onMobileMenuClick?.()}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 truncate">
            <p className="truncate text-sm font-semibold tracking-tight">{t("appName")}</p>
            <span className="hidden text-xs text-muted-foreground sm:inline">{t("dashboard")}</span>
          </div>
          {eventsLoading ? (
            <span className="ml-2 hidden text-[11px] text-muted-foreground sm:inline">{t("sync")}</span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-2xl"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Select
            value={(() => {
              const l = i18n.language?.split("-")[0];
              return ["en", "ru", "tj"].includes(l) ? l : "en";
            })()}
            onValueChange={(v) => {
              i18n.changeLanguage(v);
              if (typeof localStorage !== "undefined") localStorage.setItem("lang", v);
            }}
          >
            <SelectTrigger className="h-9 w-[70px] rounded-2xl gap-1 sm:w-[90px]">
              <Languages className="h-4 w-4 shrink-0 opacity-70" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-2xl sm:hidden"
            onClick={playNotificationSound}
            aria-label={t("enableSound")}
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={playNotificationSound}
            variant="outline"
            className="hidden h-9 rounded-2xl sm:flex"
          >
            {t("enableSound")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-10 w-10 rounded-2xl"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-[min(400px,95vw)] rounded-3xl p-0"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{t("notifications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {unread ? t("unreadCount", { count: unread }) : t("allCaughtUp")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-2xl"
                    onClick={() => dispatch(markAllRead())}
                    disabled={notifs.length === 0 || unread === 0}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    {t("read")}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 rounded-2xl"
                    onClick={() => dispatch(clearAll())}
                    disabled={notifs.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("clear")}
                  </Button>
                </div>
              </div>

              <DropdownMenuSeparator />

              <div className="px-2 py-2">
                {latest.length === 0 ? (
                  <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                    {t("noNotifications")}
                    <div className="mt-2 text-xs text-muted-foreground">
                      ({t("eventsLoaded", { count: events.length })})
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latest.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          dispatch(markRead(n.id));
                          if (n.location) openGoogleMaps(n.location);
                        }}
                        className={[
                          "w-full rounded-2xl border px-3 py-3 text-left transition",
                          "hover:bg-muted/40",
                          n.read ? "opacity-75" : "bg-background",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                              {n.title || t("notification")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {n.body || ""}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              {n.location ? (
                                <Badge variant="secondary" className="rounded-xl">
                                  <MapPin className="mr-1 h-3.5 w-3.5" />
                                  {t("openMap")}
                                </Badge>
                              ) : null}

                              {!n.read ? (
                                <Badge className="rounded-xl">{t("new")}</Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-xl">
                                  {t("read")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {notifs.length > 8 && (
                <div className="border-t px-4 py-3 text-xs text-muted-foreground">
                  {t("showingLatest", { count: notifs.length })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-3 rounded-2xl">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">
                  {user?.username || user?.userName || user?.name || t("account")}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52 rounded-2xl">
              <DropdownMenuItem
                onClick={() => dispatch(logout())}
                className="cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
