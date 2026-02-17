import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import DashboardLayout from "../components/layout/DashboardLayout";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  User,
} from "lucide-react";
import { FadeIn, SlideIn, Scale } from "@/components/ui/motion";

/* ---------------- status styles ---------------- */

const STATUS_STYLES = {
  PENDING: { bg: "bg-amber-500/80 text-white border-amber-400/50", dot: "bg-amber-200" },
  COMPLETED: { bg: "bg-emerald-500/80 text-white border-emerald-400/50", dot: "bg-emerald-200" },
  MISSED: { bg: "bg-red-500/80 text-white border-red-400/50", dot: "bg-red-200" },
};

const STATUS_LABEL_KEYS = {
  PENDING: "pending",
  COMPLETED: "completed",
  MISSED: "missed",
};

/* ---------------- helpers ---------------- */

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

function pickTimeInputValue(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("T")) {
    const t = s.split("T")[1] || "";
    return t.slice(0, 5);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(11, 16);
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

function formatDate(dateStr) {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ---------------- page ---------------- */

export default function EventInfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items, loading } = useSelector((s) => s.events);

  useEffect(() => {
    if (!items || items.length === 0) {
      dispatch(fetchEvents());
    }
  }, [dispatch, items]);

  const event = items?.find((e) => String(e.id) === String(id));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 rounded-3xl bg-white/5" />
          <Card className="rounded-3xl overflow-hidden border-white/10 bg-white/5">
            <Skeleton className="h-96 w-full bg-white/5" />
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-2/3 bg-white/5" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Scale>
            <Card className="rounded-3xl p-10 text-center border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                <Sparkles className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-2xl font-bold">{t("eventNotFound")}</h2>
              <p className="mt-3 text-base text-muted-foreground max-w-xs mx-auto">
                {t("eventNotFoundDescription")}
              </p>
              <Button
                className="mt-8 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all h-11 px-8"
                onClick={() => navigate("/dashboard/events")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToEvents")}
              </Button>
            </Card>
          </Scale>
        </div>
      </DashboardLayout>
    );
  }

  const dateStr = pickDateInputValue(event.date);
  const timeStr = pickTimeInputValue(event.time);
  const mapSrc = getMapEmbedSrc(event.location);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with back button */}
        <FadeIn className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-10 w-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 p-2 text-white shadow-lg shadow-sky-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t("eventDetails")}
            </h2>
          </div>
        </FadeIn>

        {/* Main content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover image */}
            <SlideIn delay={0.1}>
              <Card className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div className="relative h-96 w-full bg-muted/20 overflow-hidden">
                  {event.coverImage && event.coverImage !== "null" ? (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground bg-muted/10">
                      <Sparkles className="h-16 w-16 opacity-10" />
                      <span className="mt-4 opacity-50">{t("noImage")}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-8 left-8 flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`rounded-xl px-4 py-1.5 text-sm shadow-xl backdrop-blur-md ${(STATUS_STYLES[event.status] || STATUS_STYLES.PENDING).bg}`}
                      variant="outline"
                    >
                      <span className={`h-2 w-2 rounded-full mr-2 ${(STATUS_STYLES[event.status] || STATUS_STYLES.PENDING).dot}`} />
                      {t(STATUS_LABEL_KEYS[event.status] || "pending")}
                    </Badge>
                    {event.category && (
                      <Badge
                        className="rounded-xl px-4 py-1.5 text-sm shadow-xl backdrop-blur-md bg-sky-500/20 text-sky-300 border-sky-500/30"
                        variant="outline"
                      >
                        {event.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </SlideIn>

            {/* Title & description */}
            <SlideIn delay={0.2}>
              <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {event.title}
                  </h1>
                  <div className="h-px w-20 bg-gradient-to-r from-sky-500 to-blue-500" />
                  <div className="prose prose-lg max-w-none text-muted-foreground/90 leading-relaxed">
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  </div>
                </CardContent>
              </Card>
            </SlideIn>

            {/* Map */}
            {mapSrc && (
              <SlideIn delay={0.3}>
                <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <p className="font-semibold">{t("location")}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openGoogleMaps(event.location)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("openInMaps")}
                    </Button>
                  </div>
                  <iframe
                    title={`event-map-${event.id}`}
                    src={mapSrc}
                    className="h-96 w-full grayscale-[0.5] invert-[0.1] contrast-[1.1] transition-all hover:grayscale-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </Card>
              </SlideIn>
            )}
          </div>

          {/* Right column - details sidebar */}
          <div className="space-y-6">
            {/* Date & Time card */}
            <Scale delay={0.2} className="h-full">
              <div className="sticky top-24 space-y-6">
                <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl shadow-xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar className="h-32 w-32 -mr-10 -mt-10 rotate-12" />
                  </div>
                  
                  <CardContent className="p-6 space-y-6 relative">
                    <h3 className="font-semibold text-lg border-b border-white/10 pb-4">{t("dateTime")}</h3>
                    
                    <div className="flex items-start gap-4 group">
                      <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500 ring-1 ring-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t("date")}
                        </p>
                        <p className="text-lg font-semibold">
                          {dateStr ? formatDate(dateStr) : t("notSpecified")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t("time")}
                        </p>
                        <p className="text-lg font-semibold">
                          {timeStr || t("notSpecified")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location card */}
                <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl shadow-xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg border-b border-white/10 pb-4">{t("locationLabel")}</h3>
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500 ring-1 ring-blue-500/20">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        {String(event.location || "").trim() ? (
                          <a
                            href={
                              String(event.location).startsWith("http")
                                ? event.location
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    event.location
                                  )}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex flex-col gap-1 text-base font-medium hover:opacity-80 transition-opacity"
                          >
                            <span className="underline underline-offset-4 decoration-blue-500/50 hover:decoration-blue-500">{event.location}</span>
                            <span className="text-xs text-blue-400 flex items-center gap-1">
                               {t("openInMaps")} <ExternalLink className="h-3 w-3" />
                            </span>
                          </a>
                        ) : (
                          <p className="text-base font-medium text-muted-foreground">
                            {t("notSpecified")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mentor info card */}
                <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl shadow-xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg border-b border-white/10 pb-4">{t("mentorInfo")}</h3>
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500 ring-1 ring-sky-500/20">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        {event.mentor ? (
                          <>
                            <p className="text-base font-semibold">{event.mentor.name}</p>
                            {event.mentor.specialization && (
                              <p className="text-sm text-muted-foreground">{event.mentor.specialization}</p>
                            )}
                            {event.mentor.level && (
                              <Badge variant="secondary" className="mt-1 rounded-lg text-xs">{event.mentor.level}</Badge>
                            )}
                          </>
                        ) : (
                          <p className="text-base text-muted-foreground">{t("noMentorAssigned")}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Scale>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
