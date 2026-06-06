"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch {
      toast.error("Could not send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password";
      toast.error(msg.includes("wrong-password") || msg.includes("user-not-found")
        ? "Invalid email or password"
        : "Sign in failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Form panel — 60% on desktop */}
      <div className="flex-1 lg:flex-none lg:w-3/5 flex flex-col px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12 lg:mb-16">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-primary/20">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="leading-tight">
            <p className="text-foreground font-semibold text-sm tracking-tight">SupportMENA OS</p>
            <p className="text-muted-foreground text-[10px] tracking-wide">Operations Platform</p>
          </div>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto lg:mx-0 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-9 h-10"
                  autoComplete="email"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Sending..." : "Forgot?"}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 h-10"
                  autoComplete="current-password"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center lg:text-left text-[11px] text-muted-foreground mt-8">
          © {new Date().getFullYear()} SupportMENA Technologies. All rights reserved.
        </p>
      </div>

      {/* Brand panel — 40% on desktop, hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-violet-700">
        {/* Decorative orbs */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 blur-3xl"
        />
        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Faded brand S */}
        <span
          aria-hidden
          className="absolute -right-12 top-1/2 -translate-y-1/2 select-none text-white/[0.08] font-bold leading-none tracking-tighter"
          style={{ fontSize: "32rem" }}
        >
          S
        </span>

        {/* Tagline */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60 font-medium">
            <span className="h-px w-8 bg-white/40" />
            SupportMENA OS
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl xl:text-4xl font-semibold leading-tight tracking-tight">
              The operating system for technical service businesses.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Unify your CRM, quotations, projects, inventory and HR in one
              powerful platform built for modern teams.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {[
                { label: "Modules", value: "17+" },
                { label: "Faster ops", value: "3×" },
                { label: "Uptime", value: "99.9%" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-[11px] text-white/60 mt-0.5 tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/50">
            Trusted by teams across MENA.
          </p>
        </div>
      </div>
    </div>
  );
}
