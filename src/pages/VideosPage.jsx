import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchVideos, createVideo, updateVideo, deleteVideo } from "../features/videos/videosSlice";
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
  Video as VideoIcon,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Play,
  Calendar,
  Sparkles,
  RefreshCcw,
} from "lucide-react";

const API_BASE = "http://localhost:5000";

function getVideoSrc(url) {
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

export default function VideosPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: videos, loading, saving, total, page, totalPages } = useSelector((s) => s.videos);
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
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    dispatch(fetchVideos({ page: currentPage, limit: 12, search: search || undefined }));
  }, [dispatch, currentPage, search]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setFile(null); setFileName(""); setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (video) => {
    setEditing(video); setTitle(video.title); setDescription(video.description || "");
    setFileName(video.videoUrl ? "Current video" : ""); setFile(null); setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) formData.append("video", file);
    try {
      if (editing) {
        await dispatch(updateVideo({ id: editing.id, formData })).unwrap();
        toast.success(t("videoUpdated") || "Video updated!");
      } else {
        await dispatch(createVideo(formData)).unwrap();
        toast.success(t("videoCreated") || "Video created!");
      }
      setDialogOpen(false); resetForm();
      dispatch(fetchVideos({ page: currentPage, limit: 12, search: search || undefined }));
    } catch (err) { toast.error(err || "Failed to save video"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteVideo(deleteTarget.id)).unwrap();
      toast.success(t("videoDeleted") || "Video deleted!");
      setDeleteTarget(null);
      dispatch(fetchVideos({ page: currentPage, limit: 12, search: search || undefined }));
    } catch (err) { toast.error(err || "Failed to delete video"); }
  };

  const refresh = () => dispatch(fetchVideos({ page: currentPage, limit: 12, search: search || undefined }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                <VideoIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("videos") || "Videos"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("manageVideos") || "Manage your video library"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-semibold gap-1.5">
              <Sparkles className="h-3 w-3" /> {total || 0} {t("videos") || "Videos"}
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
                {t("addVideo") || "Add Video"}
              </Button>
            )}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchVideos") || "Search videos..."}
            className="pl-9 h-10 rounded-xl bg-white/5 border-white/10 focus:border-sky-500/50 transition-colors"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border border-white/10 overflow-hidden pt-0">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 rounded-2xl border-dashed border-2 border-white/10 bg-white/[0.02]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 mb-5">
              <VideoIcon className="h-10 w-10 text-sky-500/40" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">{t("noVideos") || "No videos yet"}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Upload your first video to get started</p>
            {isAdmin && (
              <Button onClick={openCreate} className="mt-5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white">
                <Plus className="mr-1.5 h-4 w-4" /> {t("addFirstVideo") || "Add your first video"}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, i) => (
              <motion.div
                key={video.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-500 cursor-pointer pt-0"
                  onClick={() => setViewing(video)}
                >
                  {/* Thumbnail / Play */}
                  <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 shadow-xl">
                        <Play className="h-6 w-6 text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Video duration mock overlay */}
                    <div className="absolute bottom-2 right-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white/80">
                      ▶ VIDEO
                    </div>
                  </div>

                  {/* Info */}
                  <CardContent className="p-4 space-y-1.5">
                    <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{video.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(video.createdAt)}
                    </div>
                  </CardContent>

                  {/* Admin actions — top right */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-20">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white"
                        onClick={(e) => { e.stopPropagation(); openEdit(video); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-500/30 hover:bg-red-500/40 text-white"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(video); }}
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

      {/* ── Detail / Player Dialog ── */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="sm:max-w-4xl p-0 rounded-2xl overflow-hidden border border-white/10 bg-background/95 backdrop-blur-xl">
          {viewing && (
            <div className="flex flex-col">
              {/* Video Player */}
              <div className="relative w-full aspect-video bg-black">
                <video
                  src={getVideoSrc(viewing.videoUrl)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
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
                <VideoIcon className="h-4 w-4 text-white" />
              </div>
              {editing ? (t("editVideo") || "Edit Video") : (t("addVideo") || "Add Video")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("title") || "Title"}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter video title..." className="rounded-xl bg-white/5 border-white/10 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("description") || "Description"}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." className="rounded-xl bg-white/5 border-white/10 min-h-[80px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("videoFile") || "Video File"}</Label>
              <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 shrink-0">
                  <Upload className="h-5 w-5 text-sky-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{fileName || (t("clickToUploadVideo") || "Click to upload video")}</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM, MOV (max 100MB)</p>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                {fileName && (
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.preventDefault(); setFile(null); setFileName(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </label>
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
            <AlertDialogTitle>{t("deleteVideo") || "Delete Video?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteVideoConfirm") || `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
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
