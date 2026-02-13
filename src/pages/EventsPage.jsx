import React, { useEffect, useMemo, useRef, useState } from "react";
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

const MONTHS = [
  { value: "all", label: "All months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

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
  const { items, loading, saving, error } = useSelector((s) => s.events);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|active|inactive
  const [monthFilter, setMonthFilter] = useState("all"); // all|01..12

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

    if (!payload.title) return toast.error("Title is required");
    if (!payload.date) return toast.error("Date is required");
    if (!payload.time) return toast.error("Time is required");
    if (!payload.location) return toast.error("Location is required");
    if (!payload.coverImage || payload.coverImage === "null")
      return toast.error("Cover image is required (real URL/Base64)");
    if (!payload.description) return toast.error("Description is required");

    try {
      if (mode === "create") {
        await dispatch(createEvent(payload)).unwrap();
        toast.success("Event created");
      } else {
        await dispatch(updateEvent({ id: editingId, payload })).unwrap();
        toast.success("Event updated");
      }
      setOpen(false);
    } catch (e) {
      toast.error(String(e || "Failed"));
    }
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteEvent(id)).unwrap();
      toast.success("Event deleted");
    } catch (e) {
      toast.error(String(e || "Failed"));
    }
  };

  const onPickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Pick an image");
    if (file.size > 2.5 * 1024 * 1024) return toast.error("Max 2.5MB image");

    try {
      const base64 = await fileToBase64(file);
      setForm((p) => ({ ...p, coverImage: base64 }));
      toast.success("Image loaded");
    } catch {
      toast.error("Failed to read file");
    }
  };

  const mapSrcForForm = getMapEmbedSrc(form.location);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header glow */}
        <div className="relative overflow-hidden rounded-3xl border bg-background/40 p-5 backdrop-blur">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-muted/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-muted/40 blur-3xl" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-2xl font-semibold tracking-tight">
                  Events
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Cards • Cover + map • URL/Base64
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-2xl bg-background/60"
                onClick={() => dispatch(fetchEvents())}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button className="rounded-2xl" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New event
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-3xl border bg-background/50 backdrop-blur">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All events</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing <span className="font-medium">{filtered.length}</span>{" "}
                items
              </p>
            </div>

            {/* Filters */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, location, description…"
                className="h-10 rounded-2xl bg-background/60 sm:w-72"
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-2xl bg-background/60 sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-10 rounded-2xl bg-background/60 sm:w-44">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <CardsSkeleton />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((e) => {
                  const mapSrc = getMapEmbedSrc(e.location);
                  const dateStr = pickDateInputValue(e.date);
                  const timeStr = pickTimeInputValue(e.time);

                  return (
                    <Card
                      key={e.id}
                      className="rounded-3xl pt-0 overflow-hidden border bg-background/55 backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {/* cover */}
                      <div className="relative">
                        <div className="h-56 w-full bg-muted/20 overflow-hidden">
                          {e.coverImage && e.coverImage !== "null" ? (
                            <img
                              src={e.coverImage}
                              alt="cover"
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />

                        <div className="absolute left-3 top-3">
                          <Badge
                            className="rounded-xl shadow-sm"
                            variant={e.status ? "default" : "secondary"}
                          >
                            {e.status ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="absolute right-3 top-3">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 rounded-2xl bg-background/70 backdrop-blur"
                            onClick={() => openGoogleMaps(e.location)}
                            disabled={!String(e.location || "").trim()}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Map
                          </Button>
                        </div>

                        {mapSrc && (
                          <div className="absolute bottom-3 left-3 right-3 overflow-hidden rounded-2xl border bg-background/35 backdrop-blur">
                            <iframe
                              title={`map-${e.id}`}
                              src={mapSrc}
                              className="h-28 w-full"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-1">
                          <p className="font-semibold leading-snug">
                            {truncate(e.title, 80)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dateStr || "---- -- --"}{" "}
                            {timeStr ? `• ${timeStr}` : ""}
                          </p>
                        </div>

                        <div className="rounded-2xl border bg-background/40 p-3 text-sm text-muted-foreground">
                          {truncate(e.description, 150)}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {String(e.location || "").trim() ? (
                            <a
                              href={
                                String(e.location).startsWith("http")
                                  ? e.location
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      e.location
                                    )}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:opacity-80"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {truncate(e.location, 28)}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No location
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            variant="outline"
                            className="h-9 rounded-2xl bg-background/60"
                            onClick={() => openEdit(e)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="h-9 rounded-2xl"
                                disabled={saving}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete event?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the event permanently from
                                  MockAPI.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-2xl">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-2xl"
                                  onClick={() => remove(e.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                    No events found.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOG: wide, inputs left, preview right */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild />
          <DialogContent className="w-[min(1200px,96vw)] max-w-none rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Create event" : "Edit event"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-5">
              {/* LEFT inputs */}
              <form onSubmit={submit} className="md:col-span-3 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="h-11 rounded-2xl"
                      placeholder="Event title…"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status ? "active" : "inactive"}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, status: v === "active" }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="h-11 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                      className="h-11 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Location (address or link)</Label>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, location: e.target.value }))
                      }
                      className="h-11 rounded-2xl"
                      placeholder="Dushanbe / Google Maps link / any place…"
                    />
                  </div>

                  {/* cover */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Cover image</Label>

                    <Tabs
                      value={coverMode}
                      onValueChange={(v) => setCoverMode(v)}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                        <TabsTrigger value="url" className="rounded-2xl">
                          <Link2 className="mr-2 h-4 w-4" />
                          URL
                        </TabsTrigger>
                        <TabsTrigger value="base64" className="rounded-2xl">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-3 space-y-2">
                        <Input
                          value={
                            form.coverImage?.startsWith("data:image/")
                              ? ""
                              : form.coverImage
                          }
                          onChange={(e) =>
                            setForm((p) => ({ ...p, coverImage: e.target.value }))
                          }
                          className="h-11 rounded-2xl"
                          placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Direct image URL.
                        </p>
                      </TabsContent>

                      <TabsContent value="base64" className="mt-3 space-y-2">
                        <Input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="h-11 rounded-2xl"
                          onChange={(e) => onPickFile(e.target.files?.[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                          Base64 (max 2.5MB).
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="min-h-24 rounded-2xl"
                      placeholder="Write details…"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="rounded-2xl" disabled={saving}>
                    {saving ? "Saving…" : mode === "create" ? "Create" : "Update"}
                  </Button>
                </div>
              </form>

              {/* RIGHT preview */}
              <div className="md:col-span-2 space-y-4">
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-sm font-medium">Preview</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stays compact (no dialog height explosion)
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-muted/10">
                  <div className="border-b p-3 text-sm font-medium">Cover</div>
                  <div className="p-3">
                    {form.coverImage && form.coverImage !== "null" ? (
                      <img
                        src={form.coverImage}
                        alt="preview"
                        className="h-44 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-44 w-full place-items-center rounded-2xl bg-muted/20 text-sm text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-muted/10">
                  <div className="flex items-center justify-between border-b p-3">
                    <p className="text-sm font-medium">Map</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-2xl"
                      onClick={() => openGoogleMaps(form.location)}
                      disabled={!form.location?.trim()}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Open
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
                        No location
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-xs text-muted-foreground">
                    Saving format:
                  </p>
                  <p className="mt-1 text-xs">
                    date: <span className="font-mono">{form.date || "—"}</span>{" "}
                    • time:{" "}
                    <span className="font-mono">{form.time || "—"}</span>
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
