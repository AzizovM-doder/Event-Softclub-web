import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, login } from "../features/auth/authSlice";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Login() {
  const dispatch = useDispatch();
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-center rounded-3xl border bg-muted/20 p-10">
            <h1 className="text-3xl font-semibold tracking-tight">events-softclub</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Clean admin panel to manage events. Fast UI, CRUD, and pro layout.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="secondary">Redux Toolkit</Badge>
              <Badge variant="secondary">MockAPI CRUD</Badge>
              <Badge variant="secondary">Responsive</Badge>
            </div>

            <div className="mt-10 rounded-2xl border bg-background p-4">
              <p className="text-sm font-medium">Demo account</p>
              <p className="mt-1 text-xs text-muted-foreground">
                username: <span className="font-medium">adminEventSoftclub</span>
                <br />
                password: <span className="font-medium">123456</span>
              </p>
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    placeholder="adminEventSoftclub"
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
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

                <Button className="h-11 w-full rounded-2xl">Sign in</Button>

                <p className="text-center text-xs text-muted-foreground">
                  No backend. Single user auth with a simple <span className="font-medium">if</span>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
