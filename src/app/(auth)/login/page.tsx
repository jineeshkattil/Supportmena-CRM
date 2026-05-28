"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

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
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="text-left">
            <h1 className="text-white text-xl font-bold">SupportMENA OS</h1>
            <p className="text-navy-300 text-xs">Operations Platform</p>
          </div>
        </div>
      </div>

      <Card className="border-navy-700 bg-navy-800/50 backdrop-blur shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-white text-xl">Welcome back</CardTitle>
          <CardDescription className="text-navy-300">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-navy-200">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@supportmena.com"
                  className="pl-10 bg-navy-700/50 border-navy-600 text-white placeholder:text-navy-400 focus-visible:ring-primary"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-navy-200">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-navy-700/50 border-navy-600 text-white placeholder:text-navy-400 focus-visible:ring-primary"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-navy-700/30 border border-navy-600/50">
            <p className="text-navy-300 text-xs font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-navy-400">
              <p>Email: <span className="text-navy-200">admin@supportmena.com</span></p>
              <p>Password: <span className="text-navy-200">Admin@123</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-navy-500 text-xs mt-6">
        © 2024 SupportMENA Technologies. All rights reserved.
      </p>
    </div>
  );
}
