import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  clearUsersError,
} from "../features/users/usersSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
  Sparkles,
  Users,
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
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/motion";

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

const SPEC_CONFIG = {
  FRONTEND: { label: "Frontend", icon: Monitor, color: "from-sky-500 to-blue-500", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  BACKEND: { label: "Backend", icon: Code2, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  MOBILE: { label: "Mobile Dev", icon: Smartphone, color: "from-violet-500 to-purple-500", bg: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
  DESIGN: { label: "Designer", icon: Palette, color: "from-rose-500 to-pink-500", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  DIRECTOR: { label: "Director", icon: Crown, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
};

const LEVEL_CONFIG = {
  SENIOR: { label: "Senior", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  MIDDLE: { label: "Middle", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  JUNIOR: { label: "Junior", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
};

const emptyForm = {
  email: "",
  password: "",
  name: "",
  surname: "",
  birthday: "",
  level: "",
  specialization: "",
  yearsAtSoftclub: "",
  description: "",
  role: "MENTOR",
};

export default function UsersPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items, loading, saving, error } = useSelector((s) => s.users);
  const currentUser = useSelector((s) => s.auth.user);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [specFilter, setSpecFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearUsersError());
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || [])
      .filter((u) => {
        if (roleFilter !== "all" && u.role !== roleFilter) return false;
        if (specFilter !== "all" && u.specialization !== specFilter) return false;
        if (s) {
          const hay = `${u.name} ${u.surname || ""} ${u.email} ${u.description || ""}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      });
  }, [items, q, roleFilter, specFilter]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (u) => {
    setMode("edit");
    setEditingId(u.id);
    setForm({
      email: u.email || "",
      password: "",
      name: u.name || "",
      surname: u.surname || "",
      birthday: u.birthday ? new Date(u.birthday).toISOString().slice(0, 10) : "",
      level: u.level || "",
      specialization: u.specialization || "",
      yearsAtSoftclub: u.yearsAtSoftclub != null ? String(u.yearsAtSoftclub) : "",
      description: u.description || "",
      role: u.role || "MENTOR",
    });
    setOpen(true);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!form.name.trim()) return toast.error(t("nameRequired") || "Name is required");
    if (!form.email.trim()) return toast.error(t("emailRequired") || "Email is required");
    if (mode === "create" && !form.password) return toast.error(t("passwordRequired") || "Password is required");

    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      surname: form.surname.trim() || undefined,
      birthday: form.birthday || undefined,
      level: form.level || undefined,
      specialization: form.specialization || undefined,
      yearsAtSoftclub: form.yearsAtSoftclub !== "" ? parseInt(form.yearsAtSoftclub) : undefined,
      description: form.description.trim() || undefined,
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    try {
      if (mode === "create") {
        await dispatch(createUser(payload)).unwrap();
        toast.success(t("userCreated") || "User created");
      } else {
        await dispatch(updateUser({ id: editingId, payload })).unwrap();
        toast.success(t("userUpdated") || "User updated");
      }
      setOpen(false);
    } catch (e) {
      toast.error(String(e || t("failed")));
    }
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success(t("userDeleted") || "User deleted");
    } catch (e) {
      toast.error(String(e || t("failed")));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/10 via-background to-purple-600/10 p-6 backdrop-blur-xl">
          <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 p-2 text-white shadow-lg shadow-violet-500/25">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t("userManagement") || "User Management"}
                </h2>
              </div>
              <p className="text-base text-muted-foreground/80 max-w-2xl">
                {t("userManagementSubtitle") || "Manage mentors, assign roles, and track team members"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur" onClick={() => dispatch(fetchUsers())} disabled={loading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> {t("refresh")}
              </Button>
              <Button className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] transition-all border-0" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("addMentor") || "Add Mentor"}
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Filters */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
          <div className="p-5 border-b border-white/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /></svg>
                </span>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchUsers") || "Search users..."} className="h-10 pl-9 rounded-xl bg-white/5 border-white/10 focus:border-violet-500/50 transition-colors" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Role pills */}
                <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                  {[
                    { value: "all", label: t("all") },
                    { value: "ADMIN", label: "Admin" },
                    { value: "MENTOR", label: "Mentor" },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setRoleFilter(opt.value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${roleFilter === opt.value ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Specialization */}
                <Select value={specFilter} onValueChange={setSpecFilter}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/5 border-white/10 w-40 text-xs">
                    <SelectValue placeholder={t("specialization") || "Specialization"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {Object.entries(SPEC_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Result count */}
                <Badge variant="secondary" className="rounded-lg px-2.5 py-1 text-xs font-semibold gap-1">
                  <Users className="h-3 w-3" /> {filtered.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* User cards grid */}
          <CardContent className="p-5">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-4">
                  <Users className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-muted-foreground text-lg">{t("noUsersFound") || "No users found"}</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((u, idx) => {
                  const spec = SPEC_CONFIG[u.specialization] || null;
                  const lvl = LEVEL_CONFIG[u.level] || null;
                  const age = calcAge(u.birthday);
                  const SpecIcon = spec?.icon || Briefcase;

                  return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: idx * 0.08 }}>
                      <Card className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-white/20">
                        {/* Gradient top bar */}
                        <div className={`h-2 w-full bg-gradient-to-r ${spec?.color || "from-zinc-500 to-zinc-600"}`} />

                        <CardContent className="p-5 space-y-4">
                          {/* Avatar + name row */}
                          <div className="flex items-start gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${spec?.color || "from-zinc-500 to-zinc-600"} text-white text-xl font-bold shadow-lg`}>
                              {(u.name || "?")[0]}{(u.surname || "")[0] || ""}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg leading-tight truncate">
                                {u.name} {u.surname || ""}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                <Mail className="h-3 w-3" /> {u.email}
                              </p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className={`rounded-lg text-[10px] font-bold uppercase tracking-widest ${u.role === "ADMIN" ? "bg-sky-500/10 text-sky-400 border-sky-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                              <Shield className="h-3 w-3 mr-1" /> {u.role}
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

                          {/* Info row */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {age != null && (
                              <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1.5 rounded-lg">
                                <Calendar className="h-3 w-3" /> {age} {t("yearsOld") || "y.o."}
                              </div>
                            )}
                            {u.yearsAtSoftclub != null && (
                              <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1.5 rounded-lg">
                                <Clock className="h-3 w-3" /> {u.yearsAtSoftclub} {t("yearsAtSC") || "yr @ SC"}
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {u.description && (
                            <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                              {u.description}
                            </p>
                          )}

                          {/* Actions */}
                          {currentUser?.id !== u.id && (
                            <div className="flex gap-2 pt-1">
                              <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs" onClick={() => openEdit(u)}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" /> {t("edit")}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-xs" disabled={saving}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-white/10 bg-black/90 backdrop-blur-xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("deleteUserTitle") || "Delete user?"}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("deleteUserDescription") || "This will permanently remove this user account."}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">{t("cancel")}</AlertDialogCancel>
                                    <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={() => remove(u.id)}>
                                      {t("delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild />
          <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-2xl rounded-3xl border-white/10 bg-background/90 backdrop-blur-2xl p-0 gap-0">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-background/50 px-6 py-4 backdrop-blur-xl">
              <DialogTitle className="text-xl font-bold">
                {mode === "create" ? (t("createMentor") || "Create Mentor") : (t("editMentor") || "Edit Mentor")}
              </DialogTitle>
            </div>

            <form onSubmit={submit} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("name") || "Name"}</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>{t("surname") || "Surname"}</Label>
                  <Input value={form.surname} onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <Label>{t("email") || "Email"}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" placeholder="mentor@softclub.tj" />
                </div>
                <div className="space-y-2">
                  <Label>{t("password")} {mode === "edit" && <span className="text-muted-foreground text-xs">({t("leaveEmpty") || "leave empty to keep"})</span>}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" placeholder="••••••" />
                </div>
                <div className="space-y-2">
                  <Label>{t("birthday") || "Birthday"}</Label>
                  <Input type="date" value={form.birthday} onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>{t("level") || "Level"}</Label>
                  <Select value={form.level} onValueChange={(v) => setForm((p) => ({ ...p, level: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10"><SelectValue placeholder={t("selectLevel") || "Select level"} /></SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                      <SelectItem value="MIDDLE">Middle</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("specialization") || "Specialization"}</Label>
                  <Select value={form.specialization} onValueChange={(v) => setForm((p) => ({ ...p, specialization: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10"><SelectValue placeholder={t("selectSpec") || "Select specialization"} /></SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                      {Object.entries(SPEC_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("yearsAtSoftclub") || "Years at SoftClub"}</Label>
                  <Input type="number" min="0" max="50" value={form.yearsAtSoftclub} onChange={(e) => setForm((p) => ({ ...p, yearsAtSoftclub: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>{t("role") || "Role"}</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                      <SelectItem value="MENTOR">Mentor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("description") || "Description"}</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-20 rounded-xl bg-white/5 border-white/10" placeholder={t("descriptionPlaceholder") || "Write a bio / description..."} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" className="rounded-xl hover:bg-white/5" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40" disabled={saving}>
                  {saving ? (t("saving") || "Saving...") : mode === "create" ? (t("create") || "Create") : (t("update") || "Update")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
