import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { clearAuthError, login } from "../features/auth/authSlice";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const LANG_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
  { value: "tj", label: "TJ" },
];

export default function Login() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const token = useSelector((s) => s.auth.token);
  const error = useSelector((s) => s.auth.error);

  const [form, setForm] = useState({ username: "", password: "" });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (token) return <Navigate to="/dashboard" replace />;

  const submit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  const lang = ["en", "ru", "tj"].includes(i18n.language) ? i18n.language : i18n.language?.split("-")[0] || "en";

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-2xl"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Select
          value={lang}
          onValueChange={(v) => {
            i18n.changeLanguage(v);
            if (typeof localStorage !== "undefined") localStorage.setItem("lang", v);
          }}
        >
          <SelectTrigger className="w-[90px] rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANG_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-center rounded-3xl border bg-muted/20 p-10">
            <h1 className="text-3xl font-semibold tracking-tight">{t("appName")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("loginSubtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="secondary">Redux Toolkit</Badge>
              <Badge variant="secondary">MockAPI CRUD</Badge>
              <Badge variant="secondary">{t("responsive")}</Badge>
            </div>

            <div className="mt-10 rounded-2xl border bg-background p-4">
              <p className="text-sm font-medium">{t("demoAccount")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("username")}: <span className="font-medium">adminEventSoftclub</span>
                <br />
                {t("password")}: <span className="font-medium">123456</span>
              </p>
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>{t("login")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("username")}</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    placeholder="adminEventSoftclub"
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("password")}</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="123456"
                    className="h-11 rounded-2xl"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button className="h-11 w-full rounded-2xl">{t("signIn")}</Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("noBackend")}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
