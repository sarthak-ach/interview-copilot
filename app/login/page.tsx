"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme support local to page (syncs with globals)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("interview-copilot-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("interview-copilot-theme", nextTheme);
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setFormError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-moss" size={36} />
          <p className="text-sm font-semibold text-moss">Loading account details...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-ink sm:px-6 lg:px-8">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-mint/40 blur-3xl dark:bg-mint/10"></div>
      
      {/* Top Controls */}
      <div className="absolute top-5 right-5">
        <button
          className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-ink transition hover:bg-shell shadow-sm cursor-pointer"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-ink text-shell shadow-soft transition hover:rotate-6">
            <Bot size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-moss font-medium">Continue preparing with your AI-Copilot</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-line bg-panel/90 p-8 shadow-soft backdrop-blur-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {formError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-coral/10 p-3.5 text-sm font-medium text-coral border border-coral/20">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/40">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full h-11 pl-10 pr-3.5 rounded-lg border border-line bg-shell/40 text-ink placeholder:text-ink/35 focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition duration-200 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/40">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full h-11 pl-10 pr-10 rounded-lg border border-line bg-shell/40 text-ink placeholder:text-ink/35 focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition duration-200 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink/40 hover:text-ink/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-ink text-shell font-semibold text-sm transition hover:bg-moss hover:scale-[1.01] active:scale-[0.99] disabled:bg-ink/50 disabled:scale-100 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Prompt to register */}
          <div className="mt-6 text-center border-t border-line/60 pt-4">
            <p className="text-sm text-ink/60">
              New to Interview Copilot?{" "}
              <Link href="/register" className="font-semibold text-moss hover:underline hover:text-ink transition">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
