import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  clearEventsError,
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
  updateEventStatus,
} from "../features/events/eventsSlice";
import { fetchUsers } from "../features/users/usersSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
  MapPin,
  ExternalLink,
  Sparkles,
  Upload,
  Link2,
  Calendar,
  Clock,
  ArrowUpDown,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeIn, SlideIn, Scale } from "@/components/ui/motion";

/* ---------------- helpers (NO timezone bugs) ---------------- */

// date input wants "YYYY-MM-DD"
function pickDateInputValue(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// time input wants "HH:MM"
function pickTimeInputValue(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("T")) {
    const t = s.split("T")[1] || "";
    return t.slice(0, 5);
  }
  // fallback: try Date
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(11, 16);
}

// save to MockAPI in a stable format (same you already have)
// date => "YYYY-MM-DDT00:00:00.000Z"
// time => "1970-01-01THH:MM:00.000Z"
function buildIso(dateInput, timeInput) {
  const d = (dateInput || "").trim();
  const t = (timeInput || "").trim();

  const dateIso = d ? `${d}T00:00:00.000Z` : "";
  const timeIso = t ? `1970-01-01T${t}:00.000Z` : "";

  return { dateIso, timeIso };
}

function truncate(str, n) {
  const s = String(str ?? "");
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function getMapEmbedSrc(location) {
  const loc = (location || "").trim();
  if (!loc) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(loc)}&output=embed`;
}

function openGoogleMaps(location) {
  const loc = (location || "").trim();
  if (!loc) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    loc
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

const MONTH_KEYS = [
  "allMonths",
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_VALUES = ["all", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthFromEvent(e) {
  const d = pickDateInputValue(e?.date); // "YYYY-MM-DD"
  if (!d) return "";
  return d.slice(5, 7); // "MM"
}

function parseEventDate(dateStr) {
  const d = pickDateInputValue(dateStr);
  if (!d) return { day: "—", month: "" };
  const parts = d.split("-");
  const monthIdx = parseInt(parts[1], 10) - 1;
  return {
    day: String(parseInt(parts[2], 10)),
    month: MONTH_SHORT[monthIdx] || "",
    year: parts[0],
  };
}

/* ---------------- UI bits ---------------- */

function CardsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur flex flex-col"
        >
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 flex-1 rounded-xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */

const STATUS_STYLES = {
  PENDING: { bg: "bg-amber-500/15 text-amber-400 border-amber-500/20", dot: "bg-amber-400 shadow-amber-400/50" },
  COMPLETED: { bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400 shadow-emerald-400/50" },
  MISSED: { bg: "bg-red-500/15 text-red-400 border-red-500/20", dot: "bg-red-400 shadow-red-400/50" },
};

const STATUS_LABEL_KEYS = {
  PENDING: "pending",
  COMPLETED: "completed",
  MISSED: "missed",
};

const emptyForm = {
  title: "",
  date: "",
  time: "",
  location: "",
  status: "PENDING",
  coverImage: "",
  description: "",
  category: "",
  mentorId: null,
};

export default function EventsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items, loading, saving, error } = useSelector((s) => s.events);
  const { user } = useSelector((s) => s.auth);
  const { items: users } = useSelector((s) => s.users);
  const isAdmin = user?.role === "ADMIN";
  const thisMonth = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|PENDING|COMPLETED|MISSED
  const [monthFilter, setMonthFilter] = useState(thisMonth); // all|01..12
  const [mentorFilter, setMentorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create|edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [coverMode, setCoverMode] = useState("url"); // url|base64
  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Derive unique categories from events
  const categories = useMemo(() => {
    const cats = new Set();
    (items || []).forEach((e) => { if (e.category) cats.add(e.category); });
    return [...cats].sort();
  }, [items]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearEventsError());
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return (items || [])
      .filter((x) => {
        if (statusFilter !== "all") return x.status === statusFilter;
        return true;
      })
      .filter((x) => {
        if (monthFilter === "all") return true;
        return monthFromEvent(x) === monthFilter;
      })
      .filter((x) => {
        if (mentorFilter === "all") return true;
        return x.mentorId === mentorFilter;
      })
      .filter((x) => {
        if (categoryFilter === "all") return true;
        return x.category && x.category.toLowerCase() === categoryFilter.toLowerCase();
      })
      .filter((x) => {
        if (!s) return true;
        const hay = `${x.title} ${x.description} ${x.location}`.toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) => {
        const ad = pickDateInputValue(a?.date);
        const at = pickTimeInputValue(a?.time) || "00:00";
        const bd = pickDateInputValue(b?.date);
        const bt = pickTimeInputValue(b?.time) || "00:00";
        const cmp = `${ad}T${at}`.localeCompare(`${bd}T${bt}`);
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [items, q, statusFilter, monthFilter, mentorFilter, categoryFilter, sortOrder]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setCoverMode("url");
    if (fileRef.current) fileRef.current.value = "";
    setOpen(true);
  };

  const openEdit = (e) => {
    setMode("edit");
    setEditingId(e.id);

    const img = e.coverImage || "";
    const isBase64 = img.startsWith("data:image/");
    setCoverMode(isBase64 ? "base64" : "url");
    if (fileRef.current) fileRef.current.value = "";

    // ✅ this is the fix (no Date() conversion)
    setForm({
      title: e.title || "",
      date: pickDateInputValue(e.date),
      time: pickTimeInputValue(e.time),
      location: e.location || "",
      status: e.status || "PENDING",
      coverImage: img,
      description: e.description || "",
      category: e.category || "",
      mentorId: e.mentorId || null,
    });

    setOpen(true);
  };

  const submit = async (ev) => {
    ev.preventDefault();

    const { dateIso, timeIso } = buildIso(form.date, form.time);

    const payload = {
      title: (form.title || "").trim(),
      date: dateIso,
      time: timeIso,
      location: (form.location || "").trim(),
      status: form.status || "PENDING",
      coverImage: (form.coverImage || "").trim(),
      description: (form.description || "").trim(),
      category: (form.category || "").trim(),
      mentorId: form.mentorId || null,
    };

    if (!payload.title) return toast.error(t("titleRequired"));
    if (!payload.date) return toast.error(t("dateRequired"));
    if (!payload.time) return toast.error(t("timeRequired"));
    if (!payload.location) return toast.error(t("locationRequired"));
    if (!payload.coverImage || payload.coverImage === "null")
      return toast.error(t("coverRequired"));
    if (!payload.description) return toast.error(t("descriptionRequired"));

    try {
      if (mode === "create") {
        await dispatch(createEvent(payload)).unwrap();
        toast.success(t("eventCreated"));
      } else {
        await dispatch(updateEvent({ id: editingId, payload })).unwrap();
        toast.success(t("eventUpdated"));
      }
      setOpen(false);
    } catch (e) {
      toast.error(String(e || t("failed")));
    }
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteEvent(id)).unwrap();
      toast.success(t("eventDeleted"));
    } catch (e) {
      toast.error(String(e || t("failed")));
    }
  };

  const onPickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(t("pickImage"));
    if (file.size > 2.5 * 1024 * 1024) return toast.error(t("maxImageSize"));

    try {
      const base64 = await fileToBase64(file);
      setForm((p) => ({ ...p, coverImage: base64 }));
      toast.success(t("imageLoaded"));
    } catch {
      toast.error(t("failedReadFile"));
    }
  };

  const mapSrcForForm = getMapEmbedSrc(form.location);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header glow */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-600/10 via-background to-blue-600/10 p-6 backdrop-blur-xl transition-all hover:shadow-lg hover:shadow-sky-500/5">
          <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 p-2 text-white shadow-lg shadow-sky-500/25">
                   <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t("events")}
                </h2>
              </div>
              <p className="text-base text-muted-foreground/80 max-w-2xl">
                {t("eventsSubtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur"
                onClick={() => dispatch(fetchEvents())}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>

              <Button className="h-10 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all border-0" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("newEvent")}
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
          <CardHeader className="space-y-4 border-b border-white/5 p-6">
            {/* Top row: title + count */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{t("allEvents")}</CardTitle>
                <Badge variant="secondary" className="rounded-lg px-2.5 py-1 text-xs font-semibold gap-1">
                  <Sparkles className="h-3 w-3" /> {filtered.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Trans i18nKey="showingItems" values={{ count: filtered.length }} components={{ 1: <span className="font-medium text-foreground" /> }} />
              </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /></svg>
                </span>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-10 pl-9 rounded-xl bg-white/5 border-white/10 focus:border-sky-500/50 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status pills */}
                <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                  {[
                    { value: "all", label: t("all") },
                    { value: "PENDING", label: t("pending"), dot: "bg-amber-400" },
                    { value: "COMPLETED", label: t("completed"), dot: "bg-emerald-400" },
                    { value: "MISSED", label: t("missed"), dot: "bg-red-400" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusFilter(opt.value)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        statusFilter === opt.value
                          ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {opt.dot && <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Month select */}
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/5 border-white/10 w-36 text-xs">
                    <SelectValue placeholder={t("month")} />
                  </SelectTrigger>
                  <SelectContent className="h-64 rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                    {MONTH_KEYS.map((key, i) => (
                      <SelectItem key={MONTH_VALUES[i]} value={MONTH_VALUES[i]}>
                        {t(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Category select */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/5 border-white/10 w-40 text-xs">
                    <SelectValue placeholder={t("allCategories")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.length > 0 ? categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    )) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground">{t("noCategoriesYet")}</div>
                    )}
                  </SelectContent>
                </Select>

                {/* Mentor select */}
                <Select value={mentorFilter} onValueChange={setMentorFilter}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/5 border-white/10 w-40 text-xs">
                    <SelectValue placeholder={t("allMentors")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                    <SelectItem value="all">{t("allMentors")}</SelectItem>
                    {(users || []).filter((u) => u.role === "MENTOR" || u.role === "ADMIN").length > 0 ? (
                      (users || []).filter((u) => u.role === "MENTOR" || u.role === "ADMIN").map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground">{t("noMentorsYet")}</div>
                    )}
                  </SelectContent>
                </Select>

                {/* Sort direction */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl bg-white/5 border-white/10 text-xs gap-1.5 hover:bg-white/10"
                  onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {sortOrder === "asc" ? t("ascending") : t("descending")}
                </Button>

                {/* Clear filters */}
                {(q || statusFilter !== "all" || monthFilter !== "all" || mentorFilter !== "all" || categoryFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 gap-1.5"
                    onClick={() => { setQ(""); setStatusFilter("all"); setMonthFilter("all"); setMentorFilter("all"); setCategoryFilter("all"); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {t("clearFilters") || "Clear filters"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <CardsSkeleton />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((e, idx) => {
                  const dateStr = pickDateInputValue(e.date);
                  const timeStr = pickTimeInputValue(e.time);
                  const parsed = parseEventDate(e.date);
                  const isFeatured = idx === 0;

                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: Math.min(idx * 0.06, 0.5) }}
                      className={isFeatured ? "sm:col-span-2 sm:row-span-2" : ""}
                    >
                      <Card className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/[0.06] hover:border-white/[0.15] flex flex-col">
                        {/* Cover image / gradient top strip */}
                        <div className={`relative w-full overflow-hidden ${isFeatured ? "h-56 sm:h-72" : "h-40"}`}>
                          {e.coverImage && e.coverImage !== "null" ? (
                            <img
                              src={e.coverImage}
                              alt="cover"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-sky-600/20 via-blue-600/10 to-transparent" />
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                          {/* Date badge – floating on the image */}
                          <div className="absolute left-4 bottom-3 flex items-end gap-3">
                            <div className={`flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-md border border-white/10 shadow-lg ${isFeatured ? "px-4 py-2.5 min-w-[4rem]" : "px-3 py-1.5 min-w-[3.2rem]"}`}>
                              <span className={`font-bold leading-none text-foreground ${isFeatured ? "text-2xl" : "text-lg"}`}>{parsed.day}</span>
                              <span className={`font-semibold uppercase tracking-wider text-sky-400 mt-0.5 ${isFeatured ? "text-xs" : "text-[10px]"}`}>{parsed.month}</span>
                            </div>
                            <div>
                              <h3 className={`font-bold leading-tight text-foreground drop-shadow-sm ${isFeatured ? "text-lg sm:text-xl line-clamp-2" : "text-base line-clamp-1"}`}>
                                {isFeatured ? e.title : truncate(e.title, 45)}
                              </h3>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="absolute right-3 top-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold backdrop-blur-md shadow-sm border ${
                                (STATUS_STYLES[e.status] || STATUS_STYLES.PENDING).bg
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shadow-sm ${(STATUS_STYLES[e.status] || STATUS_STYLES.PENDING).dot}`} />
                              {t(STATUS_LABEL_KEYS[e.status] || "pending")}
                            </span>
                          </div>
                        </div>

                        {/* Card body */}
                        <CardContent className={`flex-1 flex flex-col justify-between space-y-3 ${isFeatured ? "p-5" : "p-4 pt-3"}`}>
                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {dateStr && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5">
                                <Calendar className="h-3 w-3 text-sky-400" />
                                {dateStr}
                              </span>
                            )}
                            {timeStr && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5">
                                <Clock className="h-3 w-3 text-sky-400" />
                                {timeStr}
                              </span>
                            )}
                            {e.location && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 hover:bg-white/[0.12] transition-colors cursor-pointer"
                                onClick={() => openGoogleMaps(e.location)}
                              >
                                <MapPin className="h-3 w-3 text-sky-400" />
                                <span className="max-w-[10rem] truncate">{e.location}</span>
                              </button>
                            )}
                          </div>

                          {/* Category + Mentor chips */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {e.category && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 text-sky-400 px-2 py-0.5 text-[10px] font-medium">
                                <Tag className="h-2.5 w-2.5" />
                                {e.category}
                              </span>
                            )}
                            {e.mentor && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 text-violet-400 px-2 py-0.5 text-[10px] font-medium">
                                <User className="h-2.5 w-2.5" />
                                {e.mentor.name || e.mentor.email}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className={`text-sm text-muted-foreground/80 leading-relaxed flex-1 ${isFeatured ? "line-clamp-5" : "line-clamp-2 min-h-[2.5rem]"}`}>
                            {isFeatured ? (e.description || "") : truncate(e.description, 110)}
                          </p>

                          {/* Admin status control */}
                          {isAdmin && (
                            <Select
                              value={e.status}
                              onValueChange={async (v) => {
                                if (v === e.status) return;
                                try {
                                  await dispatch(updateEventStatus({ id: e.id, status: v })).unwrap();
                                  toast.success(t("statusUpdated"));
                                } catch (err) { toast.error(String(err)); }
                              }}
                            >
                              <SelectTrigger className={`h-7 w-full rounded-lg text-[11px] font-medium border ${(STATUS_STYLES[e.status] || STATUS_STYLES.PENDING).bg}`} disabled={saving}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                                <SelectItem value="PENDING">
                                  <span className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-amber-400" />{t("pending")}</span>
                                </SelectItem>
                                <SelectItem value="COMPLETED">
                                  <span className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-400" />{t("completed")}</span>
                                </SelectItem>
                                <SelectItem value="MISSED">
                                  <span className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-red-400" />{t("missed")}</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] mt-auto">
                            <Button
                              className="h-10 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-semibold shadow-md shadow-sky-600/15 hover:shadow-sky-600/30 hover:scale-[1.01] transition-all border-0"
                              asChild
                            >
                              <Link to={`/dashboard/events/${e.id}`}>
                                <ExternalLink className="mr-1.5 h-4 w-4" />
                                {t("info")}
                              </Link>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.04] hover:bg-white/[0.1] hover:border-white/20 transition-all text-sm"
                              onClick={() => openEdit(e)}
                            >
                              <Pencil className="mr-1.5 h-4 w-4" />
                              {t("edit")}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                                  disabled={saving}
                                >
                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                  {t("delete")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("deleteEventTitle")}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("deleteEventDescription")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">{t("cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-xl bg-red-600 hover:bg-red-700"
                                    onClick={() => remove(e.id)}
                                  >
                                    {t("delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="py-20 text-center col-span-full">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/20 mb-4">
                      <Sparkles className="h-10 w-10 opacity-15" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-4">{t("noEventsFound")}</p>
                    <Button
                      className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 transition-all border-0"
                      onClick={openCreate}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("createFirstEvent")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOG: wide, inputs left, preview right */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild />
          <DialogContent className="max-h-[95vh] w-full max-w-6xl h-full lg:min-w-6xl sm:max-w-[95vw] rounded-3xl border-white/10 bg-background/80 backdrop-blur-2xl p-0 gap-0">
             <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background/50 px-6 py-4 backdrop-blur-xl">
                <DialogTitle className="text-xl font-bold">
                  {mode === "create" ? t("createEvent") : t("editEvent")}
                </DialogTitle>
                {/* Close button is automatically added by Radix UI, we can just leave this header clean or add custom close if needed, but existing is fine */}
             </div>
             
             <div className="p-6">
                {/* Wrap content to ensure padding */}
                <div className="grid gap-8 lg:grid-cols-5">
              {/* LEFT inputs */}
              <form onSubmit={submit} className="lg:col-span-3 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("title")}</Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                      placeholder={t("eventTitlePlaceholder")}
                    />
                  </div>


                  <div className="space-y-2">
                    <Label>{t("status")}</Label>
                    <Select
                      value={form.status || "PENDING"}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, status: v }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                        <SelectItem value="PENDING">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            {t("pending")}
                          </span>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {t("completed")}
                          </span>
                        </SelectItem>
                        <SelectItem value="MISSED">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            {t("missed")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("date")}</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("time")}</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>{t("locationLabel")}</Label>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, location: e.target.value }))
                      }
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                      placeholder={t("locationPlaceholder")}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>{t("category")}</Label>
                    <Input
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, category: e.target.value }))
                      }
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                      placeholder={t("categoryPlaceholder")}
                    />
                  </div>

                  {/* Mentor */}
                  <div className="space-y-2">
                    <Label>{t("selectMentor")}</Label>
                    <Select
                      value={form.mentorId || "__none__"}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, mentorId: v === "__none__" ? null : v }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue placeholder={t("selectMentor")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                        <SelectItem value="__none__">{t("noMentorOption")}</SelectItem>
                        {(users || []).filter((u) => u.role === "MENTOR" || u.role === "ADMIN").map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* cover */}
                  <div className="lg:col-span-2 space-y-2">
                    <Label>{t("coverImage")}</Label>

                    <Tabs
                      value={coverMode}
                      onValueChange={(v) => setCoverMode(v)}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white/5 p-1 h-12">
                        <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-10">
                          <Link2 className="mr-2 h-4 w-4" />
                          {t("url")}
                        </TabsTrigger>
                        <TabsTrigger value="base64" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-10">
                          <Upload className="mr-2 h-4 w-4" />
                          {t("upload")}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-4 space-y-2">
                        <Input
                          value={
                            form.coverImage?.startsWith("data:image/")
                              ? ""
                              : form.coverImage
                          }
                          onChange={(e) =>
                            setForm((p) => ({ ...p, coverImage: e.target.value }))
                          }
                          className="h-11 rounded-xl bg-white/5 border-white/10"
                          placeholder={t("urlPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("directImageUrl")}
                        </p>
                      </TabsContent>

                      <TabsContent value="base64" className="mt-4 space-y-2">
                        <Input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="h-11 rounded-xl bg-white/5 border-white/10 file:text-primary"
                          onChange={(e) => onPickFile(e.target.files?.[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("base64Hint")}
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>{t("description")}</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="min-h-24 rounded-xl bg-white/5 border-white/10"
                      placeholder={t("writeDetails")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl hover:bg-white/5"
                    onClick={() => setOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40" disabled={saving}>
                    {saving ? t("saving") : mode === "create" ? t("create") : t("update")}
                  </Button>
                </div>
              </form>

              {/* RIGHT preview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-sm font-medium">{t("preview")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("previewHint")}
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-muted/10">
                  <div className="border-b p-3 text-sm font-medium">{t("cover")}</div>
                  <div className="p-3">
                    {form.coverImage && form.coverImage !== "null" ? (
                      <img
                        src={form.coverImage}
                        alt="preview"
                        className="h-44 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-44 w-full place-items-center rounded-2xl bg-muted/20 text-sm text-muted-foreground">
                        {t("noImage")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-muted/10">
                  <div className="flex items-center justify-between border-b p-3">
                    <p className="text-sm font-medium">{t("map")}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-2xl"
                      onClick={() => openGoogleMaps(form.location)}
                      disabled={!form.location?.trim()}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {t("open")}
                    </Button>
                  </div>

                  <div className="p-3">
                    {form.location?.trim() ? (
                      <div className="overflow-hidden rounded-2xl border bg-background/40">
                        <iframe
                          title="form-map"
                          src={mapSrcForForm}
                          className="h-44 w-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="grid h-44 w-full place-items-center rounded-2xl bg-muted/20 text-sm text-muted-foreground">
                        {t("noLocation")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground">
                    {t("savingFormat")}
                  </p>
                  <p className="mt-1 text-xs">
                    date: <span className="font-mono">{form.date || "—"}</span>{" "}
                    • time:{" "}
                    <span className="font-mono">{form.time || "—"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
