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
} from "../features/events/eventsSlice";

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

function monthFromEvent(e) {
  const d = pickDateInputValue(e?.date); // "YYYY-MM-DD"
  if (!d) return "";
  return d.slice(5, 7); // "MM"
}

/* ---------------- UI bits ---------------- */

function CardsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-3xl overflow-hidden border bg-background/60 backdrop-blur"
        >
          <Skeleton className="h-52 w-full" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-6 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-2xl" />
              <Skeleton className="h-9 w-24 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */

const emptyForm = {
  title: "",
  date: "",
  time: "",
  location: "",
  status: true,
  coverImage: "",
  description: "",
};

export default function EventsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items, loading, saving, error } = useSelector((s) => s.events);
  const thisMonth = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|active|inactive
  const [monthFilter, setMonthFilter] = useState(thisMonth); // all|01..12

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create|edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [coverMode, setCoverMode] = useState("url"); // url|base64
  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearEventsError());
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return (items || [])
      .filter((x) => {
        if (statusFilter === "active") return x.status === true;
        if (statusFilter === "inactive") return x.status === false;
        return true;
      })
      .filter((x) => {
        if (monthFilter === "all") return true;
        return monthFromEvent(x) === monthFilter;
      })
      .filter((x) => {
        if (!s) return true;
        const hay = `${x.title} ${x.description} ${x.location}`.toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) => {
        // stable sort without timezone shift
        const ad = pickDateInputValue(a?.date);
        const at = pickTimeInputValue(a?.time) || "00:00";
        const bd = pickDateInputValue(b?.date);
        const bt = pickTimeInputValue(b?.time) || "00:00";
        return `${bd}T${bt}`.localeCompare(`${ad}T${at}`);
      });
  }, [items, q, statusFilter, monthFilter]);

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
      status: e.status === true,
      coverImage: img,
      description: e.description || "",
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
      status: !!form.status,
      coverImage: (form.coverImage || "").trim(),
      description: (form.description || "").trim(),
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
                    { value: "active", label: t("active"), dot: "bg-emerald-500" },
                    { value: "inactive", label: t("inactive"), dot: "bg-zinc-500" },
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

                {/* Clear filters */}
                {(q || statusFilter !== "all" || monthFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 gap-1.5"
                    onClick={() => { setQ(""); setStatusFilter("all"); setMonthFilter("all"); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {t("clearFilters") || "Clear filters"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <CardsSkeleton />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filtered.map((e, idx) => {
                  const dateStr = pickDateInputValue(e.date);
                  const timeStr = pickTimeInputValue(e.time);

                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }} 
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <Card className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-white/20">
                        {/* cover */}
                        <div className="relative h-56 w-full overflow-hidden bg-muted/20">
                          {e.coverImage && e.coverImage !== "null" ? (
                            <img
                              src={e.coverImage}
                              alt="cover"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground bg-muted/10">
                              <Sparkles className="h-10 w-10 opacity-20" />
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80" />
                          
                          <div className="absolute left-3 top-3">
                            <Badge
                              className={`rounded-xl shadow-lg backdrop-blur-md ${e.status ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-zinc-500/20 text-zinc-500 border-zinc-500/30"}`}
                              variant="outline"
                            >
                              {e.status ? t("active") : t("inactive")}
                            </Badge>
                          </div>

                          <div className="absolute right-3 top-3 flex gap-2">
                             <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="h-9 w-9 rounded-xl bg-black/40 text-white backdrop-blur hover:bg-black/60 border-0"
                              onClick={() => openGoogleMaps(e.location)}
                              disabled={!String(e.location || "").trim()}
                              title={t("map")}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-1.5">
                            <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              {truncate(e.title, 50)}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                               <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                                  <span className="font-medium">{dateStr || "—"}</span>
                                  {timeStr && <span>• {timeStr}</span>}
                               </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[4.5rem]">
                            {truncate(e.description, 120)}
                          </div>

                          <div className="pt-2 flex items-center gap-2">
                                <Button
                                 className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all border-0 h-10"
                                 asChild
                              >
                                <Link to={`/dashboard/events/${e.id}`}>
                                  {t("info")} <Link2 className="ml-2 h-4 w-4" />
                                </Link>
                             </Button>

                             <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                  onClick={() => openEdit(e)}
                                  title={t("edit")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                      disabled={saving}
                                      title={t("delete")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl border-white/10 bg-black/90 backdrop-blur-xl">
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
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="py-20 text-center col-span-full">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-4">
                        <Sparkles className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-muted-foreground text-lg">{t("noEventsFound")}</p>
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
                      value={form.status ? "active" : "inactive"}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, status: v === "active" }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="inactive">{t("inactive")}</SelectItem>
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
