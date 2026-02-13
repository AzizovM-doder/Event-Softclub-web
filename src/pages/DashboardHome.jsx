import React, { useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, CheckCircle2, XCircle, Timer } from "lucide-react";
import { truncate } from "../utils/format";

export default function DashboardHome() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.status === true).length;
    const inactive = items.filter((x) => x.status === false).length;
    return { total, active, inactive };
  }, [items]);

  const recent = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [items]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Overview of your events.</p>
          </div>
          <Badge variant="secondary" className="rounded-xl">
            {loading ? "Loading…" : "Live"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-semibold">{stats.total}</div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-semibold">{stats.active}</div>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-semibold">{stats.inactive}</div>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Smooth UI <span className="text-muted-foreground">+ CRUD</span>
              </div>
              <Timer className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((e) => (
              <div key={e.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{truncate(e.title, 90)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="rounded-xl" variant={e.status ? "default" : "secondary"}>
                    {e.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">{truncate(e.description, 120)}</p>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="text-sm text-muted-foreground">No events yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
