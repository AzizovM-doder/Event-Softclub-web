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
      <div className="max-w-full space-y-6 md:space-y-8">
        {/* Hero header */}
        <div className="relative rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 sm:rounded-3xl sm:p-6 md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  {t("welcomeBack")}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">{t("overview")}</p>
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
              <Badge
                variant="secondary"
                className="rounded-xl px-3 py-1 text-sm font-medium"
              >
                {loading ? t("loading") : t("live")}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-2xl sm:flex-none"
                onClick={() => dispatch(fetchEvents())}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
              <Button className="flex-1 rounded-2xl gap-2 sm:flex-none" asChild>
                <Link to="/dashboard/events">
                  <Plus className="h-4 w-4" />
                  {t("newEvent")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          <Card className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur transition-colors hover:border-primary/20 sm:rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("totalEvents")}
              </CardTitle>
              <div className="rounded-xl bg-primary/10 p-2">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur transition-colors hover:border-primary/20 sm:rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("active")}
              </CardTitle>
              <div className="rounded-xl bg-emerald-500/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.active}</div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur transition-colors hover:border-primary/20 sm:rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("inactive")}
              </CardTitle>
              <div className="rounded-xl bg-amber-500/10 p-2">
                <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.inactive}</div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur transition-colors hover:border-primary/20 sm:col-span-2 sm:rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("eventsThisWeek")}
              </CardTitle>
              <div className="rounded-xl bg-blue-500/10 p-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold">{thisWeekCount}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content: chart + upcoming + recent */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Events by month chart */}
          <Card className="min-w-0 rounded-2xl border bg-card/50 backdrop-blur sm:rounded-3xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{t("eventsByMonth")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-44 items-end gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-full flex-1 rounded-t" />
                  ))}
                </div>
              ) : (
                <div className="flex h-44 items-end gap-1 rounded-xl bg-muted/30 p-3 sm:p-4">
                  {byMonth.map((count, i) => (
                    <div
                      key={i}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full min-w-2 rounded-t bg-primary/70 transition-all hover:bg-primary"
                        style={{
                          height: `${Math.max(4, (count / maxBar) * 100)}%`,
                        }}
                        title={`${t(MONTH_KEYS[i])}: ${count}`}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {t(MONTH_KEYS[i]).slice(0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card className="min-w-0 rounded-2xl border bg-card/50 backdrop-blur sm:rounded-3xl lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("upcomingEvents")}</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                <Link to="/dashboard/events" className="gap-1 text-xs">
                  {t("viewAllEvents")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {t("noEventsYet")}
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigate("/dashboard/events")}
                      className="flex w-full flex-col gap-2 rounded-xl border bg-background/50 p-3 text-left transition hover:border-primary/30 hover:bg-muted/30 sm:rounded-2xl sm:p-4"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <p className="min-w-0 truncate font-medium">{truncate(e.title, 50)}</p>
                        <Badge
                          className="rounded-lg shrink-0"
                          variant={e.status ? "default" : "secondary"}
                        >
                          {e.status ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}
                        </span>
                        {e.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{truncate(e.location, 25)}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent events */}
        <Card className="min-w-0 rounded-2xl border bg-card/50 backdrop-blur sm:rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("recentEvents")}</CardTitle>
            <Button variant="ghost" size="sm" className="rounded-xl" asChild>
              <Link to="/dashboard/events" className="gap-1 text-xs">
                {t("viewAllEvents")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("noEventsYet")}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {recent.map((e) => (
                  <div
                    key={e.id}
                    className="min-w-0 rounded-xl border bg-background/50 p-3 transition hover:border-muted-foreground/20 sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{truncate(e.title, 50)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}
                        </p>
                      </div>
                      <Badge
                        className="rounded-lg shrink-0"
                        variant={e.status ? "default" : "secondary"}
                      >
                        {e.status ? t("active") : t("inactive")}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {truncate(e.description, 80)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
