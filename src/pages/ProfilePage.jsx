import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../features/auth/authSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Code2,
  Smartphone,
  Palette,
  Crown,
  Monitor,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  User,
  Sparkles,
  RefreshCcw,
  MapPin,
} from "lucide-react";
import { FadeIn, SlideIn, Scale } from "@/components/ui/motion";
import { motion } from "framer-motion";

/* ── helpers ── */

function calcAge(birthday) {
  if (!birthday) return null;
  const b = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const SPEC_CONFIG = {
  FRONTEND: { label: "Frontend Developer", icon: Monitor, color: "from-sky-500 to-blue-500", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30", desc: "Building modern, responsive web interfaces" },
  BACKEND: { label: "Backend Developer", icon: Code2, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", desc: "Building scalable APIs and server infrastructure" },
  MOBILE: { label: "Mobile Developer", icon: Smartphone, color: "from-violet-500 to-purple-500", bg: "bg-violet-500/10 text-violet-400 border-violet-500/30", desc: "Creating cross-platform mobile applications" },
  DESIGN: { label: "UI/UX Designer", icon: Palette, color: "from-rose-500 to-pink-500", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", desc: "Designing beautiful and intuitive user experiences" },
  DIRECTOR: { label: "Director", icon: Crown, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", desc: "Leading the team and driving the vision" },
};

const LEVEL_CONFIG = {
  SENIOR: { label: "Senior", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", ring: "ring-amber-500/30" },
  MIDDLE: { label: "Middle", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", ring: "ring-blue-500/30" },
  JUNIOR: { label: "Junior", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", ring: "ring-emerald-500/30" },
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);
  const loading = useSelector((s) => s.auth.loading);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Skeleton className="h-96 w-full max-w-2xl rounded-3xl bg-white/5" />
        </div>
      </DashboardLayout>
    );
  }

  const spec = SPEC_CONFIG[user.specialization] || null;
  const lvl = LEVEL_CONFIG[user.level] || null;
  const age = calcAge(user.birthday);
  const SpecIcon = spec?.icon || Briefcase;
  const initials = `${(user.name || "?")[0]}${(user.surname || "")[0] || ""}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero profile card */}
        <FadeIn className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          {/* Gradient background */}
          <div className={`h-40 sm:h-48 w-full bg-gradient-to-br ${spec?.color || "from-sky-500 to-blue-600"} relative z-0 overflow-hidden rounded-t-3xl`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_60%)]" />
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            
            {/* Refresh button */}
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="sm" className="rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur" onClick={() => dispatch(fetchMe())} disabled={loading}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Avatar + Name */}
          <div className="relative z-10 px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${spec?.color || "from-sky-500 to-blue-600"} text-white text-3xl sm:text-4xl font-bold shadow-2xl ring-4 ring-background`}
              >
                {initials}
              </motion.div>

              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {user.name} {user.surname || ""}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className={`rounded-lg text-[10px] font-bold uppercase tracking-widest ${user.role === "ADMIN" ? "bg-sky-500/10 text-sky-400 border-sky-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                    <Shield className="h-3 w-3 mr-1" /> {user.role}
                  </Badge>
                  {spec && (
                    <Badge variant="outline" className={`rounded-lg text-[10px] font-bold ${spec.bg}`}>
                      <SpecIcon className="h-3 w-3 mr-1" /> {spec.label}
                    </Badge>
                  )}
                  {lvl && (
                    <Badge variant="outline" className={`rounded-lg text-[10px] font-bold ${lvl.bg}`}>
                      {lvl.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {user.description && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
                <p className="text-base text-muted-foreground/90 leading-relaxed max-w-2xl">
                  {user.description}
                </p>
              </motion.div>
            )}
          </div>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("email") || "Email", value: user.email, icon: Mail, color: "primary" },
            { label: t("age") || "Age", value: age != null ? `${age} ${t("yearsOld") || "years old"}` : "—", icon: Calendar, color: "sky" },
            { label: t("yearsAtSoftclub") || "Years at SoftClub", value: user.yearsAtSoftclub != null ? `${user.yearsAtSoftclub} ${t("years") || "years"}` : "—", icon: Clock, color: "emerald" },
            { label: t("joinDate") || "Join Date", value: formatDate(user.createdAt), icon: Sparkles, color: "violet" },
          ].map((stat, idx) => (
            <Scale key={stat.label} delay={0.1 + idx * 0.08}>
              <Card className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 hover:bg-white/10 hover:border-white/10 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 ring-1 shrink-0 ${
                    stat.color === "primary" ? "bg-primary/10 text-primary ring-primary/20" :
                    stat.color === "sky" ? "bg-sky-500/10 text-sky-500 ring-sky-500/20" :
                    stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" :
                    "bg-violet-500/10 text-violet-500 ring-violet-500/20"
                  }`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 font-semibold truncate">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Scale>
          ))}
        </div>

        {/* Specialization highlight */}
        {spec && (
          <SlideIn delay={0.3}>
            <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6">
              <div className={`absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br ${spec.color} opacity-5 blur-3xl`} />
              <div className="relative flex items-start gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${spec.color} text-white shadow-lg`}>
                  <SpecIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{spec.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground/80">{spec.desc}</p>
                  {lvl && (
                    <div className="mt-3">
                      <Badge variant="outline" className={`rounded-lg text-sm font-semibold px-3 py-1 ${lvl.bg}`}>
                        {lvl.label} {t("level") || "Level"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </SlideIn>
        )}

        {/* Birthday card */}
        {user.birthday && (
          <SlideIn delay={0.4}>
            <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("birthday") || "Birthday"}</p>
                  <p className="text-lg font-bold">{formatDate(user.birthday)}</p>
                  {age != null && (
                    <p className="text-sm text-muted-foreground/60">{age} {t("yearsOld") || "years old"}</p>
                  )}
                </div>
              </div>
            </Card>
          </SlideIn>
        )}
      </div>
    </DashboardLayout>
  );
}
