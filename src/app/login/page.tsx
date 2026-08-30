"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const sb = getSupabase();
    if (!sb) {
      setError("Authentication not configured.");
      setLoading(false);
      return;
    }

    const { error: authErr } = await sb.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message === "Invalid login credentials"
        ? "Invalid email or password."
        : "Login failed. Please try again."
      );
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <Image src="/brand/elion-e-icon.svg" alt="ELION" width={48} height={48} className="mx-auto mb-6" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Authentication not configured yet.</p>
          <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Set <code className="text-[var(--color-accent)]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-[var(--color-accent)]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment variables.</p>
          </div>
          <a href="/" className="inline-block mt-4 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/brand/elion-e-icon.svg" alt="ELION" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {authError === "not_configured" && !error && (
            <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
              <p className="text-sm text-[var(--color-warning)]">Authentication is not configured. Set Supabase environment variables to access this page.</p>
            </div>
          )}
          {authError === "unauthorized" && !error && (
            <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p className="text-sm text-[var(--color-error)]">You do not have access to this application.</p>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-colors"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/landing" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            Back to ELION
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
