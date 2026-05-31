"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/motion";
import { Building2, Eye, EyeOff, Lock, Sparkles, User } from "lucide-react";
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
import {
  COMPANY_LOGO_PATH,
  COMPANY_NAME,
  COMPANY_URL,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "@/lib/product-brand";

function InaraLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box =
    size === "lg" ? "h-[4.5rem] w-[4.5rem]" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <a
      href={COMPANY_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={COMPANY_NAME}
      className={`relative ${box} shrink-0 block rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/95 hover:ring-amber-500/40 transition-shadow`}
    >
      <Image
        src={COMPANY_LOGO_PATH}
        alt={COMPANY_NAME}
        fill
        className="object-contain p-1"
        sizes={size === "lg" ? "72px" : size === "sm" ? "40px" : "48px"}
        priority
      />
    </a>
  );
}

function BuiltByInaraTech({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <p
      className={`text-[11px] ${onDark ? "text-white/75" : "text-muted-foreground/70"} ${className}`}
    >
      Built by{" "}
      <a
        href={COMPANY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium underline-offset-2 hover:underline transition-colors ${
          onDark ? "text-amber-300 hover:text-amber-200" : "text-amber-500/90 hover:text-amber-400"
        }`}
      >
        {COMPANY_NAME}
      </a>
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const { login, session, ready } = useAuth();
  const { state } = useStore();
  const usesServerDb = isRemoteDataSource();
  const workspace = getFixedWorkspaceId();
  const restaurantName = state.settings.restaurantName?.trim();
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
            backgroundImage: `linear-gradient(135deg, rgba(10,10,11,0.94) 0%, rgba(10,10,11,0.72) 45%, rgba(10,10,11,0.55) 100%), 
              url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80')`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 pb-16 min-h-full text-white">
          <div className="flex items-center gap-3">
            <InaraLogo size="lg" />
            <div>
              <p className="font-bold text-xl tracking-tight text-white">{PRODUCT_NAME}</p>
              <p className="text-sm text-white/80">{PRODUCT_TAGLINE}</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="inline-flex items-center gap-1.5 text-amber-300 text-sm font-medium tracking-wider uppercase mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Powered for restaurants
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1] max-w-lg text-white">
              Run service,
              <br />
              <span className="text-amber-400">inventory & accounts</span>
              <br />
              in one place.
            </h1>
            <p className="mt-4 text-white/85 max-w-md text-base leading-relaxed">
              Offline-first POS and ERP — built for speed on the floor and clarity in the back office.
            </p>
            <BuiltByInaraTech onDark className="mt-8" />
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
            <InaraLogo />
            <div>
              <p className="font-bold text-lg">{PRODUCT_NAME}</p>
              <p className="text-xs text-muted-foreground">{PRODUCT_TAGLINE}</p>
            </div>
          </div>

          <div className="surface-card p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="hidden lg:flex items-center gap-3 mb-6 pb-6 border-b border-[var(--border)]">
              <InaraLogo size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-base">{PRODUCT_NAME}</p>
                {restaurantName ? (
                  <p className="text-xs text-muted-foreground truncate">{restaurantName}</p>
                ) : (
                  <BuiltByInaraTech />
                )}
              </div>
            </div>

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

          <div className="mt-6 space-y-2 text-center">
            <BuiltByInaraTech />
            <p className="text-[11px] text-muted-foreground/60">Admin sets access in Settings → Staff</p>
          </div>
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
