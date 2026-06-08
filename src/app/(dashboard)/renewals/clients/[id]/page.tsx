"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Building2,
  Mail,
  Phone,
  FileText,
  Loader2,
  Server,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { where } from "firebase/firestore";
import { toast } from "sonner";
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
  getRenewalClient,
  updateRenewalClient,
  getClientServices,
} from "@/services/renewal-firestore";
import { SERVICE_CATEGORY_LABELS } from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { RenewalClient, ClientService } from "@/types/renewal";

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional(),
  billingEmail: z
    .string()
    .email("Invalid billing email")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormData = z.infer<typeof schema>;

export default function RenewalClientDetailPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const [client, setClient] = useState<RenewalClient | null>(null);
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

  const statusValue = watch("status");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, svcs] = await Promise.all([
          getRenewalClient(id),
          getClientServices([where("clientId", "==", id)]),
        ]);
        setClient(c);
        setServices(svcs);
        if (c) {
          reset({
            companyName: c.companyName,
            contactPerson: c.contactPerson ?? "",
            contactEmail: c.contactEmail ?? "",
            contactPhone: c.contactPhone ?? "",
            billingEmail: c.billingEmail ?? "",
            notes: c.notes ?? "",
            status: c.status,
          });
        }
      } catch {
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await updateRenewalClient(id, {
        companyName: data.companyName,
        contactPerson: data.contactPerson || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        billingEmail: data.billingEmail || undefined,
        notes: data.notes || undefined,
        status: data.status,
      });
      setClient((prev: RenewalClient | null) =>
        prev ? { ...prev, ...data } : prev
      );
      toast.success("Client updated successfully");
      setEditMode(false);
      router.replace(`/renewals/clients/${id}`);
    } catch {
      toast.error("Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (client) {
      reset({
        companyName: client.companyName,
        contactPerson: client.contactPerson ?? "",
        contactEmail: client.contactEmail ?? "",
        contactPhone: client.contactPhone ?? "",
        billingEmail: client.billingEmail ?? "",
        notes: client.notes ?? "",
        status: client.status,
      });
    }
    setEditMode(false);
    router.replace(`/renewals/clients/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/renewals/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-muted-foreground">Client not found.</p>
        </div>
      </div>
    );
  }

  const activeServices = services.filter((s) => s.serviceStatus === "active").length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link href="/renewals/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{client.companyName}</h2>
            <p className="text-sm text-muted-foreground">
              {client.clientCode}
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
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={saving}>
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
            label: "Status",
            value: client.status === "active" ? "Active" : "Inactive",
            color: client.status === "active" ? "text-green-600" : "text-gray-500",
            bg: client.status === "active" ? "bg-green-50" : "bg-gray-50",
          },
          {
            label: "Client Since",
            value: formatDate(client.createdAt),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3 flex items-center gap-3 bg-card"
          >
            <div className={`rounded-lg p-1.5 ${s.bg}`}>
              <Building2 className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Client Info / Edit Form */}
      {editMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input {...register("companyName")} />
                  {errors.companyName && (
                    <p className="text-xs text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input {...register("contactPerson")} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input {...register("contactPhone")} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" {...register("contactEmail")} />
                  {errors.contactEmail && (
                    <p className="text-xs text-destructive">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Billing Email</Label>
                  <Input type="email" {...register("billingEmail")} />
                  {errors.billingEmail && (
                    <p className="text-xs text-destructive">
                      {errors.billingEmail.message}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={3} {...register("notes")} placeholder="Internal notes..." />
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-base">{client.companyName}</span>
              <Badge variant={client.status === "active" ? "success" : "secondary"} className="capitalize">
                {client.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {client.contactPerson && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Contact Person</p>
                  <p className="font-medium">{client.contactPerson}</p>
                </div>
              )}
              {client.contactEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Contact Email</p>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{client.contactEmail}</span>
                  </div>
                </div>
              )}
              {client.contactPhone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{client.contactPhone}</span>
                  </div>
                </div>
              )}
              {client.billingEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Billing Email</p>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{client.billingEmail}</span>
                  </div>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </p>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Services */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Linked Services
              <span className="text-xs text-muted-foreground font-normal">
                ({services.length})
              </span>
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/renewals/services/new?clientId=${id}`}>
                + Add Service
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No services linked yet.</p>
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
                      <p className="text-sm font-medium truncate">{svc.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {svc.providerName} &bull;{" "}
                        {SERVICE_CATEGORY_LABELS[svc.serviceCategory] ?? svc.serviceCategory}
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
                    {svc.providerCost && (
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
