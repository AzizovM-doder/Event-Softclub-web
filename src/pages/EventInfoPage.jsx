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
} from "lucide-react";

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
          <Skeleton className="h-12 w-64 rounded-3xl" />
          <Card className="rounded-3xl overflow-hidden">
            <Skeleton className="h-96 w-full" />
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
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
          <Card className="rounded-3xl p-8 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t("eventNotFound")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("eventNotFoundDescription")}
            </p>
            <Button
              className="mt-6 rounded-2xl"
              onClick={() => navigate("/events")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToEvents")}
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const dateStr = pickDateInputValue(event.date);
  const timeStr = pickTimeInputValue(event.time);
  const mapSrc = getMapEmbedSrc(event.location);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("eventDetails")}
            </h2>
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover image */}
            <Card className="rounded-3xl overflow-hidden border bg-background/50 backdrop-blur">
              <div className="relative h-96 w-full bg-muted/20">
                {event.coverImage && event.coverImage !== "null" ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <Badge
                    className="rounded-xl shadow-lg"
                    variant={event.status ? "default" : "secondary"}
                  >
                    {event.status ? t("active") : t("inactive")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Title & description */}
            <Card className="rounded-3xl border bg-background/50 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">
                  {event.title}
                </h1>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            {mapSrc && (
              <Card className="rounded-3xl border bg-background/50 backdrop-blur overflow-hidden">
                <div className="flex items-center justify-between border-b bg-background/40 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <p className="font-medium">{t("location")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => openGoogleMaps(event.location)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("openInMaps")}
                  </Button>
                </div>
                <iframe
                  title={`event-map-${event.id}`}
                  src={mapSrc}
                  className="h-96 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Card>
            )}
          </div>

          {/* Right column - details sidebar */}
          <div className="space-y-6">
            {/* Date & Time card */}
            <Card className="rounded-3xl border bg-background/50 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("date")}
                    </p>
                    <p className="text-lg font-semibold">
                      {dateStr ? formatDate(dateStr) : t("notSpecified")}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
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
            <Card className="rounded-3xl border bg-background/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("locationLabel")}
                    </p>
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
                        className="inline-flex items-center gap-2 text-lg font-semibold underline underline-offset-4 hover:opacity-80"
                      >
                        {event.location}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="text-lg font-semibold text-muted-foreground">
                        {t("notSpecified")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status card */}
            <Card className="rounded-3xl border bg-background/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("status")}
                    </p>
                    <Badge
                      className="rounded-xl"
                      variant={event.status ? "default" : "secondary"}
                    >
                      {event.status ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}