import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearAuthError } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, LogIn, Sparkles, User, Lock } from "lucide-react";

import LanguageSelector from "../components/ui/LanguageSelector";
import ThemeToggle from "../components/ui/ThemeToggle";
import { FadeIn, Scale } from "@/components/ui/motion";

export default function Login() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      toast.success(t("loginSuccess") || "Login successful!");
      navigate("/dashboard/home");
    } catch (err) {
      toast.error(err || t("loginError") || "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen max-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-sky-600/20 blur-[130px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-blue-600/20 blur-[130px] animate-pulse delay-1000" />
      
      {/* Top right controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left side - Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <FadeIn className="relative z-10 max-w-lg mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md border border-white/10">
              <Sparkles className="h-5 w-5 text-sky-400" />
              <span className="font-medium text-sky-100">Events Softclub </span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold text-white tracking-widest">ULTRA</span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              {t("manageEvents")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                {t("effortlessly")}
              </span>
            </h1>
            
            <p className="text-lg text-white/70 leading-relaxed">
              Experience the next generation of event management. Streamlined workflows,
              beautiful analytics, and a powerful dashboard designed for pros.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="text-2xl font-bold text-white mb-1">10k+</div>
                <div className="text-sm text-white/60">Active Events</div>
              </div>
               <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-white/60">Uptime</div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <Scale className="w-full max-w-md">
            <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/25">
                  <LogIn className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {t("loginTitle")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("loginSubtitle")}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@softclub.tj"
                        className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 focus:border-sky-500/50 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("password")}</Label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 focus:border-sky-500/50 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 hover:scale-[1.02] transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      t("loginButton")
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6 text-center text-sm text-muted-foreground">
                <div className="rounded-xl bg-white/5 p-4 border border-white/5 w-full space-y-2">
                  <p className="font-medium text-foreground mb-1">Demo Credentials:</p>
                  <div>
                    <span className="text-xs text-muted-foreground mr-1">Admin:</span>
                    <code className="bg-black/20 px-2 py-0.5 rounded text-xs select-all">admin@softclub.tj</code>
                    <span className="mx-1">•</span>
                    <code className="bg-black/20 px-2 py-0.5 rounded text-xs select-all">Admin123!</code>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mr-1">Mentor:</span>
                    <code className="bg-black/20 px-2 py-0.5 rounded text-xs select-all">mentor@softclub.tj</code>
                    <span className="mx-1">•</span>
                    <code className="bg-black/20 px-2 py-0.5 rounded text-xs select-all">Mentor123!</code>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Created by <span className="font-semibold text-muted-foreground">Azizov MuhammadUmar</span>
                </p>
              </CardFooter>
            </Card>
          </Scale>
        </div>
      </div>
    </div>
  );
}
