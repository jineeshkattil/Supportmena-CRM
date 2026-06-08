"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { where } from "firebase/firestore";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Server,
  Globe,
  Mail,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getServiceProvider,
  updateServiceProvider,
  getClientServices,
} from "@/services/renewal-firestore";
import {
  PROVIDER_CATEGORY_LABELS,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { ServiceProvider, ClientService, ProviderCategory } from "@/types/renewal";

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

export default function ServiceProviderDetailPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "true");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const categoryValue = watch("category");
  const statusValue = watch("status");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, svcs] = await Promise.all([
          getServiceProvider(id),
          getClientServices([where("providerId", "==", id)]),
        ]);
        setProvider(p);
        setServices(svcs);
        if (p) {
          reset({
            providerName: p.providerName,
            category: p.category,
            websiteUrl: p.websiteUrl ?? "",
            loginUrl: p.loginUrl ?? "",
            accountEmail: p.accountEmail ?? "",
            supportEmail: p.supportEmail ?? "",
            notes: p.notes ?? "",
            status: p.status,
          });
        }
      } catch {
        toast.error("Failed to load provider");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await updateServiceProvider(id, {
        providerName: data.providerName,
        category: data.category,
        websiteUrl: data.websiteUrl || undefined,
        loginUrl: data.loginUrl || undefined,
        accountEmail: data.accountEmail || undefined,
        supportEmail: data.supportEmail || undefined,
        notes: data.notes || undefined,
        status: data.status,
      });
      setProvider((prev) => (prev ? { ...prev, ...data } : prev));
      toast.success("Provider updated successfully");
      setEditMode(false);
      router.replace(`/renewals/providers/${id}`);
    } catch {
      toast.error("Failed to update provider");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (provider) {
      reset({
        providerName: provider.providerName,
        category: provider.category,
        websiteUrl: provider.websiteUrl ?? "",
        loginUrl: provider.loginUrl ?? "",
        accountEmail: provider.accountEmail ?? "",
        supportEmail: provider.supportEmail ?? "",
        notes: provider.notes ?? "",
        status: provider.status,
      });
    }
    setEditMode(false);
    router.replace(`/renewals/providers/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/renewals/providers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-muted-foreground">Provider not found.</p>
        </div>
      </div>
    );
  }

  const activeServices = services.filter(
    (s) => s.serviceStatus === "active"
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link href="/renewals/providers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {provider.providerName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {provider.providerCode} &bull;{" "}
              {PROVIDER_CATEGORY_LABELS[provider.category]}
            </p>
          </div>
        </div>
        {!editMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Services",
            value: services.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Services",
            value: activeServices,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Category",
            value: PROVIDER_CATEGORY_LABELS[provider.category],
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Status",
            value: provider.status === "active" ? "Active" : "Inactive",
            color:
              provider.status === "active"
                ? "text-green-600"
                : "text-gray-500",
            bg: provider.status === "active" ? "bg-green-50" : "bg-gray-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3 flex items-center gap-3 bg-card"
          >
            <div className={`rounded-lg p-1.5 ${s.bg}`}>
              <Server className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${s.color}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Provider Info / Edit Form */}
      {editMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    Provider Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input {...register("providerName")} />
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    placeholder="https://..."
                    {...register("websiteUrl")}
                  />
                  {errors.websiteUrl && (
                    <p className="text-xs text-destructive">
                      {errors.websiteUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Login URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Internal notes..."
                {...register("notes")}
              />
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Provider Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-base">
                {provider.providerName}
              </span>
              <Badge variant="info">
                {PROVIDER_CATEGORY_LABELS[provider.category]}
              </Badge>
              <Badge
                variant={
                  provider.status === "active" ? "success" : "secondary"
                }
                className="capitalize"
              >
                {provider.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {provider.websiteUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Website
                  </p>
                  <a
                    href={provider.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {provider.websiteUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                </div>
              )}
              {provider.loginUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Login URL
                  </p>
                  <a
                    href={provider.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {provider.loginUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                </div>
              )}
              {provider.accountEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Account Email
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{provider.accountEmail}</span>
                  </div>
                </div>
              )}
              {provider.supportEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Support Email
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{provider.supportEmail}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              Added {formatDate(provider.createdAt)}
            </div>

            {provider.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </p>
                <p className="text-sm text-muted-foreground">{provider.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Services */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600" />
            Linked Services
            <span className="text-xs text-muted-foreground font-normal">
              ({services.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No services linked to this provider yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {svc.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {svc.clientName} &bull;{" "}
                        {SERVICE_CATEGORY_LABELS[svc.serviceCategory] ??
                          svc.serviceCategory}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant={
                          svc.serviceStatus === "active"
                            ? "success"
                            : svc.serviceStatus === "expired"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize text-[10px]"
                      >
                        {svc.serviceStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[11px] text-muted-foreground">
                    <span>
                      <span className="font-medium">Renewal:</span>{" "}
                      {formatDate(svc.actualRenewalDate)}
                    </span>
                    <span>
                      <span className="font-medium">Billing Due:</span>{" "}
                      {formatDate(svc.billingDueDate)}
                    </span>
                    {svc.providerCost !== undefined && (
                      <span>
                        <span className="font-medium">Cost:</span>{" "}
                        {svc.currency} {svc.providerCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
