import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  MapPin,
  Sparkles,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { truncate } from "../utils/format";
import { FadeIn, SlideIn, Scale } from "@/components/ui/motion";
import { motion } from "framer-motion";

function pickDateStr(e) {
  const d = (e?.date || "").trim();
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function pickTimeStr(e) {
  const t = (e?.time || "").trim();
  if (!t) return "";
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(11, 16);
}

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export default function DashboardHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, loading } = useSelector((s) => s.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = items?.length || 0;
    const active = items?.filter((x) => x.status === true).length || 0;
    const inactive = items?.filter((x) => x.status === false).length || 0;
    return { total, active, inactive };
  }, [items]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcoming = useMemo(() => {
    return (items || [])
      .filter((e) => {
        const d = pickDateStr(e);
        if (!d) return false;
        return d >= today;
      })
      .sort((a, b) => (pickDateStr(a) || "").localeCompare(pickDateStr(b) || ""))
      .slice(0, 4);
  }, [items, today]);

  const recent = useMemo(() => {
    return [...(items || [])]
      .sort((a, b) => {
        const ad = pickDateStr(a) || "0000-00-00";
        const at = pickTimeStr(a) || "00:00";
        const bd = pickDateStr(b) || "0000-00-00";
        const bt = pickTimeStr(b) || "00:00";
        return `${bd}T${bt}`.localeCompare(`${ad}T${at}`);
      })
      .slice(0, 5);
  }, [items]);

  const byMonth = useMemo(() => {
    const counts = Array(12).fill(0);
    (items || []).forEach((e) => {
      const d = pickDateStr(e);
      if (!d) return;
      const m = parseInt(d.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) counts[m]++;
    });
    return counts;
  }, [items]);

  const maxBar = Math.max(1, ...byMonth);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return (items || []).filter((e) => {
      const d = pickDateStr(e);
      if (!d) return false;
      const ev = new Date(d + "T12:00:00");
      return ev >= startOfWeek && ev < endOfWeek;
    }).length;
  }, [items]);

  return (
    <DashboardLayout>
      <div className="min-w-0 space-y-6 md:space-y-8">
        {/* Hero header */}
        <FadeIn className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-600/20 via-background to-blue-600/20 p-6 shadow-2xl backdrop-blur-3xl sm:p-10">
          {/* Animated background blobs */}
          <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-sky-600/20 blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[130px] animate-pulse delay-700" />
          
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 p-2 text-white shadow-lg shadow-sky-500/25">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t("welcomeBack")}
                </h1>
              </div>
              <p className="text-base text-muted-foreground/80 sm:text-lg">{t("overview")}</p>
            </div>
            
            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
              <Badge
                variant="secondary"
                className="rounded-xl border-white/5 bg-white/5 backdrop-blur px-4 py-1.5 text-sm font-medium transition hover:bg-white/10"
              >
                <div className={`mr-2 h-2 w-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                {loading ? t("loading") : t("live")}
              </Badge>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-white/20 sm:flex-none h-10"
                onClick={() => dispatch(fetchEvents())}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
              <Button className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all duration-300 gap-2 sm:flex-none h-10 border-0" asChild>
                <Link to="/dashboard/events">
                  <Plus className="h-5 w-5" />
                  {t("newEvent")}
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Scale delay={0.1} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/10 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("totalEvents")}</p>
                {loading ? <Skeleton className="mt-2 h-8 w-16 bg-white/5" /> : <div className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</div>}
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </Scale>

          <Scale delay={0.15} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:bg-emerald-500/5 hover:border-emerald-500/10 hover:scale-[1.02]">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("active")}</p>
                {loading ? <Skeleton className="mt-2 h-8 w-16 bg-white/5" /> : <div className="mt-2 text-3xl font-bold tracking-tight">{stats.active}</div>}
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </Scale>

          <Scale delay={0.2} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:bg-amber-500/5 hover:border-amber-500/10 hover:scale-[1.02]">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("inactive")}</p>
                {loading ? <Skeleton className="mt-2 h-8 w-16 bg-white/5" /> : <div className="mt-2 text-3xl font-bold tracking-tight">{stats.inactive}</div>}
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500 ring-1 ring-amber-500/20">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </Scale>

          <Scale delay={0.25} className="group sm:col-span-2 relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:bg-blue-500/5 hover:border-blue-500/10 hover:scale-[1.02]">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("eventsThisWeek")}</p>
                {loading ? <Skeleton className="mt-2 h-8 w-16 bg-white/5" /> : <div className="mt-2 text-3xl font-bold tracking-tight">{thisWeekCount}</div>}
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500 ring-1 ring-blue-500/20">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            {/* Tiny chart or visual here if desired */}
          </Scale>
        </div>

        {/* Main content: chart + upcoming + recent */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Events by month chart */}
          <SlideIn delay={0.3} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden lg:col-span-1">
            <div className="border-b border-white/5 p-5">
              <h3 className="font-semibold">{t("eventsByMonth")}</h3>
            </div>
            <div className="flex-1 p-5">
              {loading ? (
                <div className="flex h-48 items-end gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-full flex-1 rounded-t bg-white/5" />
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-end gap-1.5 rounded-2xl bg-black/20 p-4">
                  {byMonth.map((count, i) => (
                    <div
                      key={i}
                      className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div className="relative w-full rounded-t-lg bg-white/5 transition-all group-hover:bg-primary/50 overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            height: `${Math.max(4, (count / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                        {t(MONTH_KEYS[i]).slice(0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SlideIn>

          {/* Upcoming events */}
          <SlideIn delay={0.4} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h3 className="font-semibold">{t("upcomingEvents")}</h3>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
                <Link to="/dashboard/events" className="gap-1">
                  {t("viewAllEvents")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
                  <CalendarDays className="mb-2 h-8 w-8 opacity-20" />
                  <p>{t("noEventsYet")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((e, idx) => (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      key={e.id}
                      type="button"
                      onClick={() => navigate("/dashboard/events")}
                      className="group flex w-full flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-primary/20 hover:shadow-lg"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <p className="font-semibold leading-tight group-hover:text-sky-500 transition-colors line-clamp-1">{truncate(e.title, 50)}</p>
                        <Badge
                          className={`rounded-lg shrink-0 ${e.status ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}`}
                          variant="outline"
                        >
                          {e.status ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          <span>
                            {pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}
                          </span>
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md max-w-[200px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{truncate(e.location, 25)}</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </SlideIn>
        </div>

        {/* Recent events */}
        <SlideIn delay={0.5} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <h3 className="font-semibold">{t("recentEvents")}</h3>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
              <Link to="/dashboard/events" className="gap-1">
                {t("viewAllEvents")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
                <p>{t("noEventsYet")}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.map((e, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    key={e.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/10 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium group-hover:text-primary transition-colors">{truncate(e.title, 50)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}
                        </p>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${e.status ? "bg-emerald-500 shadow-[0_0_5px_currentColor]" : "bg-zinc-500"}`} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground/80">
                      {truncate(e.description, 80)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </SlideIn>
      </div>
    </DashboardLayout>
  );
}
