import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import { fetchPhotos } from "../features/photos/photosSlice";
import { fetchVideos } from "../features/videos/videosSlice";
import { Card, CardContent } from "@/components/ui/card";
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
  Image as ImageIcon,
  Video,
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Settings,
  Shield,
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
  const { items: photos, total: photosTotal, loading: photosLoading } = useSelector((s) => s.photos);
  const { items: videos, total: videosTotal, loading: videosLoading } = useSelector((s) => s.videos);
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchPhotos({ page: 1, limit: 4 }));
    dispatch(fetchVideos({ page: 1, limit: 4 }));
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
      .filter((e) => { const d = pickDateStr(e); return d && d >= today; })
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
      .slice(0, 4);
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

  const refreshAll = () => {
    dispatch(fetchEvents());
    dispatch(fetchPhotos({ page: 1, limit: 4 }));
    dispatch(fetchVideos({ page: 1, limit: 4 }));
  };

  return (
    <DashboardLayout>
      <div className="min-w-0 space-y-6 md:space-y-8">
        {/* ── Hero header ── */}
        <FadeIn className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-600/20 via-background to-blue-600/20 p-6 shadow-2xl backdrop-blur-3xl sm:p-10">
          <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-sky-600/20 blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[130px] animate-pulse delay-700" />
          
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 p-2 text-white shadow-lg shadow-sky-500/25">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {t("welcomeBack")}{user?.name ? `, ${user.name}` : ""}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`rounded-md text-[10px] font-bold uppercase tracking-widest ${isAdmin ? "bg-sky-500/10 text-sky-400 border-sky-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                      <Shield className="h-3 w-3 mr-1" /> {user?.role || "USER"}
                    </Badge>
                    <p className="text-sm text-muted-foreground/80">{t("overview")}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
              <Badge variant="secondary" className="rounded-xl border-white/5 bg-white/5 backdrop-blur px-4 py-1.5 text-sm font-medium transition hover:bg-white/10">
                <div className={`mr-2 h-2 w-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                {loading ? t("loading") : t("live")}
              </Badge>
              <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 h-10" onClick={refreshAll} disabled={loading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> {t("refresh")}
              </Button>
              <Button className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all gap-2 h-10 border-0" asChild>
                <Link to="/dashboard/events"><Plus className="h-5 w-5" /> {t("newEvent")}</Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* ── Stats grid ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: t("totalEvents"), value: stats.total, icon: CalendarDays, color: "primary", hoverBg: "hover:bg-primary/5 hover:border-primary/10" },
            { label: t("active"), value: stats.active, icon: CheckCircle2, color: "emerald", hoverBg: "hover:bg-emerald-500/5 hover:border-emerald-500/10" },
            { label: t("inactive"), value: stats.inactive, icon: XCircle, color: "amber", hoverBg: "hover:bg-amber-500/5 hover:border-amber-500/10" },
            { label: t("photos") || "Photos", value: photosTotal || 0, icon: ImageIcon, color: "sky", hoverBg: "hover:bg-sky-500/5 hover:border-sky-500/10", loading: photosLoading },
            { label: t("videos") || "Videos", value: videosTotal || 0, icon: Video, color: "blue", hoverBg: "hover:bg-blue-500/5 hover:border-blue-500/10", loading: videosLoading },
          ].map((stat, idx) => (
            <Scale key={stat.label} delay={0.1 + idx * 0.05} className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:scale-[1.02] ${stat.hoverBg}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-${stat.color}/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  {(stat.loading ?? loading) ? <Skeleton className="mt-2 h-8 w-16 bg-white/5" /> : <div className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</div>}
                </div>
                <div className={`rounded-xl p-3 ring-1 ${
                  stat.color === "primary" ? "bg-primary/10 text-primary ring-primary/20" :
                  stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" :
                  stat.color === "amber" ? "bg-amber-500/10 text-amber-500 ring-amber-500/20" :
                  stat.color === "sky" ? "bg-sky-500/10 text-sky-500 ring-sky-500/20" :
                  "bg-blue-500/10 text-blue-500 ring-blue-500/20"
                }`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </Scale>
          ))}
        </div>

        {/* ── Quick Actions (Admin only) ── */}
        {isAdmin && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: t("events") || "Events", desc: `${stats.total} total`, icon: CalendarDays, color: "from-sky-500 to-blue-500", shadow: "shadow-sky-500/20", to: "/dashboard/events" },
              { title: t("photos") || "Photos", desc: `${photosTotal || 0} total`, icon: ImageIcon, color: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20", to: "/dashboard/photos" },
              { title: t("videos") || "Videos", desc: `${videosTotal || 0} total`, icon: Video, color: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20", to: "/dashboard/videos" },
              { title: "API Docs", desc: "Swagger UI", icon: Settings, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20", href: "http://localhost:5000/api-docs" },
            ].map((action, idx) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
              >
                {action.href ? (
                  <a href={action.href} target="_blank" rel="noreferrer" className="block">
                    <Card className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
                      <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${action.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />
                      <div className="relative flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg ${action.shadow} text-white shrink-0`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold group-hover:text-foreground transition-colors">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all" />
                      </div>
                    </Card>
                  </a>
                ) : (
                  <Link to={action.to}>
                    <Card className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
                      <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${action.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />
                      <div className="relative flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg ${action.shadow} text-white shrink-0`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold group-hover:text-foreground transition-colors">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all" />
                      </div>
                    </Card>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Main content: chart + upcoming ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Events by month chart */}
          <SlideIn delay={0.3} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden lg:col-span-1">
            <div className="border-b border-white/5 p-5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                    <div key={i} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="relative w-full rounded-t-lg bg-white/5 transition-all group-hover:bg-primary/50 overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-all duration-300"
                          style={{ height: `${Math.max(4, (count / maxBar) * 100)}%` }}
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
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{t("upcomingEvents")}</h3>
              </div>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
                <Link to="/dashboard/events" className="gap-1">
                  {t("viewAllEvents")} <ArrowRight className="h-3 w-3" />
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
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      key={e.id} type="button"
                      onClick={() => navigate("/dashboard/events")}
                      className="group flex w-full flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-primary/20 hover:shadow-lg"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <p className="font-semibold leading-tight group-hover:text-sky-500 transition-colors line-clamp-1">{truncate(e.title, 50)}</p>
                        <Badge className={`rounded-lg shrink-0 ${e.status ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}`} variant="outline">
                          {e.status ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          <span>{pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}</span>
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

        {/* ── Recent content previews (Admin) ── */}
        {isAdmin && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Photos */}
            <SlideIn delay={0.5} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-sky-400" />
                  <h3 className="font-semibold">{t("photos") || "Photos"}</h3>
                  <Badge variant="secondary" className="rounded-md text-[10px] px-1.5">{photosTotal || 0}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
                  <Link to="/dashboard/photos" className="gap-1">
                    {t("viewAllEvents") || "View All"} <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="p-5">
                {photosLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl bg-white/5" />)}
                  </div>
                ) : (photos || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground">
                    <ImageIcon className="mb-2 h-6 w-6 opacity-20" />
                    <p className="text-sm">{t("noPhotos") || "No photos yet"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {(photos || []).slice(0, 4).map((photo) => (
                      <Link key={photo.id} to="/dashboard/photos" className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/20">
                        <img
                          src={photo.imageUrl?.startsWith("http") ? photo.imageUrl : `http://localhost:5000${photo.imageUrl}`}
                          alt={photo.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.target.src = "https://placehold.co/200x200/0f172a/334155?text=No"; }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </SlideIn>

            {/* Recent Videos */}
            <SlideIn delay={0.55} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold">{t("videos") || "Videos"}</h3>
                  <Badge variant="secondary" className="rounded-md text-[10px] px-1.5">{videosTotal || 0}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
                  <Link to="/dashboard/videos" className="gap-1">
                    {t("viewAllEvents") || "View All"} <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="p-5">
                {videosLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl bg-white/5" />)}
                  </div>
                ) : (videos || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground">
                    <Video className="mb-2 h-6 w-6 opacity-20" />
                    <p className="text-sm">{t("noVideos") || "No videos yet"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(videos || []).slice(0, 2).map((video) => (
                      <Link key={video.id} to="/dashboard/videos" className="group relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-all">
                            <svg className="h-4 w-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 z-10">
                          <p className="text-xs font-medium text-white truncate">{video.title}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </SlideIn>
          </div>
        )}

        {/* ── Recent events ── */}
        <SlideIn delay={0.6} className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{t("recentEvents")}</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-white/5" asChild>
              <Link to="/dashboard/events" className="gap-1">
                {t("viewAllEvents")} <ArrowRight className="h-3 w-3" />
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
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }} key={e.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/10 hover:shadow-lg cursor-pointer"
                    onClick={() => navigate("/dashboard/events")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium group-hover:text-primary transition-colors">{truncate(e.title, 50)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pickDateStr(e) || "—"} {pickTimeStr(e) ? `• ${pickTimeStr(e)}` : ""}
                        </p>
                      </div>
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${e.status ? "bg-emerald-500 shadow-[0_0_5px_currentColor]" : "bg-zinc-500"}`} />
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
