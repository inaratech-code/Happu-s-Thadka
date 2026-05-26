"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/motion";
import { Building2, Eye, EyeOff, Lock, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import { firstAllowedPath } from "@/lib/permissions";
import { Providers } from "@/components/providers";
import { isRemoteDataSource } from "@/lib/data-source";
import { getFixedWorkspaceId } from "@/lib/env";

function LoginForm() {
  const router = useRouter();
  const { login, session, ready } = useAuth();
  const { state } = useStore();
  const usesServerDb = isRemoteDataSource();
  const workspace = getFixedWorkspaceId();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session) {
      router.replace(firstAllowedPath(session));
    }
  }, [ready, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(workspace, username, password, state.staff);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen relative flex noise-bg overflow-hidden">
      <div className="ambient-glow ambient-glow-amber" />
      <div className="ambient-glow ambient-glow-orange" />

      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(10,10,11,0.85) 0%, rgba(10,10,11,0.4) 50%, rgba(234,88,12,0.15) 100%), 
              url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80')`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="text-amber-400/80 text-sm font-medium tracking-wider uppercase mb-3">
              Mahendinagar · Ghuiyaghat
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1] max-w-lg">
              The Real Taste
              <br />
              <span className="text-amber-400">of the Night.</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-md text-base leading-relaxed">
              Premium restaurant POS & ERP — built for speed, built for the floor.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle className="!h-10 !w-10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden ring-1 ring-amber-500/30">
              <Image src="/logo.png" alt="Happus Tadka" fill className="object-cover" sizes="48px" />
            </div>
            <div>
              <p className="font-bold text-lg">Happus Tadka</p>
              <p className="text-xs text-muted-foreground">Restaurant Management</p>
            </div>
          </div>

          <div className="surface-card p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {usesServerDb
                ? "Sign in with your staff credentials"
                : "Use your staff username and password"}
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <p className="text-sm text-red-400 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
                  {error}
                </p>
              )}
              {usesServerDb && (
                <div className="rounded-lg border border-[var(--border)] bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-amber-500/90 shrink-0" />
                    {workspace}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11"
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
            Admin sets access in Settings → Staff
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginForm />
    </Providers>
  );
}
