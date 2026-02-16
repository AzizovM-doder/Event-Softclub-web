import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchPhotos, createPhoto, updatePhoto, deletePhoto } from "../features/photos/photosSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar,
  Eye,
  Sparkles,
  RefreshCcw,
} from "lucide-react";

const API_BASE = "http://localhost:5000";

function getImageSrc(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

export default function PhotosPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: photos, loading, saving, total, page, totalPages } = useSelector((s) => s.photos);
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    dispatch(fetchPhotos({ page: currentPage, limit: 12, search: search || undefined }));
  }, [dispatch, currentPage, search]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setFile(null); setPreview(""); setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (photo) => {
    setEditing(photo); setTitle(photo.title); setDescription(photo.description || "");
    setPreview(getImageSrc(photo.imageUrl)); setFile(null); setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) formData.append("image", file);
    try {
      if (editing) {
        await dispatch(updatePhoto({ id: editing.id, formData })).unwrap();
        toast.success(t("photoUpdated") || "Photo updated!");
      } else {
        await dispatch(createPhoto(formData)).unwrap();
        toast.success(t("photoCreated") || "Photo created!");
      }
      setDialogOpen(false); resetForm();
      dispatch(fetchPhotos({ page: currentPage, limit: 12, search: search || undefined }));
    } catch (err) { toast.error(err || "Failed to save photo"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deletePhoto(deleteTarget.id)).unwrap();
      toast.success(t("photoDeleted") || "Photo deleted!");
      setDeleteTarget(null);
      dispatch(fetchPhotos({ page: currentPage, limit: 12, search: search || undefined }));
    } catch (err) { toast.error(err || "Failed to delete photo"); }
  };

  const refresh = () => dispatch(fetchPhotos({ page: currentPage, limit: 12, search: search || undefined }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("photos") || "Photos"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("managePhotos") || "Manage your photo gallery"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5">
              <Sparkles className="h-3 w-3" /> {total || 0} {t("photos") || "Photos"}
            </Badge>
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={refresh}>
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {isAdmin && (
              <Button
                onClick={openCreate}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all h-9 px-4 text-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {t("addPhoto") || "Add Photo"}
              </Button>
            )}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPhotos") || "Search photos..."}
            className="pl-9 h-10 rounded-xl bg-white/5 border-white/10 focus:border-sky-500/50 transition-colors"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border border-white/10 overflow-hidden pt-0">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 rounded-2xl border-dashed border-2 border-white/10 bg-white/[0.02]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 mb-5">
              <ImageIcon className="h-10 w-10 text-sky-500/40" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">{t("noPhotos") || "No photos yet"}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Upload your first photo to get started</p>
            {isAdmin && (
              <Button onClick={openCreate} className="mt-5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white">
                <Plus className="mr-1.5 h-4 w-4" /> {t("addFirstPhoto") || "Add your first photo"}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-500 cursor-pointer pt-0"
                  onClick={() => setViewing(photo)}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-black/20">
                    <img
                      src={getImageSrc(photo.imageUrl)}
                      alt={photo.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.target.src = "https://placehold.co/600x400/0f172a/334155?text=No+Image"; }}
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover view icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Card info */}
                  <CardContent className="relative z-10 p-4 space-y-1">
                    <h3 className="font-semibold text-sm truncate">{photo.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(photo.createdAt)}
                    </div>
                  </CardContent>

                  {/* Admin actions — top right */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-20">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white"
                        onClick={(e) => { e.stopPropagation(); openEdit(photo); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-500/30 hover:bg-red-500/40 text-white"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(photo); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-xl h-9 w-9 p-0 text-xs ${currentPage === pageNum ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Detail / Lightbox Dialog ── */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-2xl overflow-hidden border border-white/10 bg-background/95 backdrop-blur-xl">
          {viewing && (
            <div className="flex flex-col">
              {/* Hero Image */}
              <div className="relative w-full max-h-[65vh] overflow-hidden bg-black/30">
                <img
                  src={getImageSrc(viewing.imageUrl)}
                  alt={viewing.title}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = "https://placehold.co/800x500/0f172a/334155?text=No+Image"; }}
                />
              </div>
              {/* Info */}
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-xl font-bold tracking-tight truncate">{viewing.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(viewing.createdAt)}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="rounded-lg h-8 gap-1.5" onClick={() => { setViewing(null); openEdit(viewing); }}>
                        <Pencil className="h-3 w-3" /> {t("edit") || "Edit"}
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg h-8 gap-1.5" onClick={() => { setViewing(null); setDeleteTarget(viewing); }}>
                        <Trash2 className="h-3 w-3" /> {t("delete") || "Delete"}
                      </Button>
                    </div>
                  )}
                </div>
                {viewing.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{viewing.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              {editing ? (t("editPhoto") || "Edit Photo") : (t("addPhoto") || "Add Photo")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("title") || "Title"}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter photo title..." className="rounded-xl bg-white/5 border-white/10 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("description") || "Description"}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." className="rounded-xl bg-white/5 border-white/10 min-h-[80px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("image") || "Image"}</Label>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                  <Button type="button" size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full h-7 w-7 bg-black/50 hover:bg-black/70 text-white" onClick={() => { setFile(null); setPreview(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 mb-3">
                    <Upload className="h-5 w-5 text-sky-500" />
                  </div>
                  <span className="text-sm font-medium">{t("clickToUpload") || "Click to upload image"}</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP (max 10MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setDialogOpen(false); resetForm(); }}>
                {t("cancel") || "Cancel"}
              </Button>
              <Button type="submit" disabled={saving || (!file && !editing)} className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/15">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? (t("save") || "Save") : (t("create") || "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePhoto") || "Delete Photo?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePhotoConfirm") || `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
              {t("delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
