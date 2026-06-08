"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createServiceProvider } from "@/services/renewal-firestore";
import { PROVIDER_CATEGORY_LABELS } from "@/lib/renewal-utils";
import type { ProviderCategory } from "@/types/renewal";

const schema = z.object({
  providerName: z.string().min(2, "Provider name is required"),
  category: z.enum([
    "domain",
    "hosting",
    "email",
    "ssl",
    "cloud",
    "software",
    "other",
  ]),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  loginUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  accountEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  supportEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormData = z.infer<typeof schema>;

const categoryOptions = Object.entries(PROVIDER_CATEGORY_LABELS) as [
  ProviderCategory,
  string,
][];

export default function NewServiceProviderPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const categoryValue = watch("category");
  const statusValue = watch("status");

  const onSubmit = async (data: FormData) => {
    if (!profile?.id) {
      toast.error("You must be logged in");
      return;
    }
    setSaving(true);
    try {
      await createServiceProvider(
        {
          providerName: data.providerName,
          category: data.category,
          websiteUrl: data.websiteUrl || undefined,
          loginUrl: data.loginUrl || undefined,
          accountEmail: data.accountEmail || undefined,
          supportEmail: data.supportEmail || undefined,
          notes: data.notes || undefined,
          status: data.status,
        },
        profile.id
      );
      toast.success("Service provider created successfully");
      router.push("/renewals/providers");
    } catch {
      toast.error("Failed to create service provider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/renewals/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">New Service Provider</h2>
          <p className="text-sm text-muted-foreground">
            Add a new provider for renewal tracking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Provider Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Provider Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Provider Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. GoDaddy, Hostinger, Google Workspace"
                  {...register("providerName")}
                />
                {errors.providerName && (
                  <p className="text-xs text-destructive">
                    {errors.providerName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={categoryValue}
                  onValueChange={(v) =>
                    setValue("category", v as ProviderCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusValue}
                  onValueChange={(v) =>
                    setValue("status", v as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  type="url"
                  placeholder="https://www.example.com"
                  {...register("websiteUrl")}
                />
                {errors.websiteUrl && (
                  <p className="text-xs text-destructive">
                    {errors.websiteUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Login / Control Panel URL</Label>
                <Input
                  type="url"
                  placeholder="https://www.example.com/login"
                  {...register("loginUrl")}
                />
                {errors.loginUrl && (
                  <p className="text-xs text-destructive">
                    {errors.loginUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Account Email</Label>
                <Input
                  type="email"
                  placeholder="account@company.ae"
                  {...register("accountEmail")}
                />
                {errors.accountEmail && (
                  <p className="text-xs text-destructive">
                    {errors.accountEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  placeholder="support@provider.com"
                  {...register("supportEmail")}
                />
                {errors.supportEmail && (
                  <p className="text-xs text-destructive">
                    {errors.supportEmail.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Internal notes about this provider..."
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline">
            <Link href="/renewals/providers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Create Provider"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
