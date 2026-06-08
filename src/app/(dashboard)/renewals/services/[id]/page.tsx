"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
  RefreshCw,
  SkipForward,
  Server,
  Calendar,
  Info,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/contexts/AuthContext";
import {
  getClientService,
  updateClientService,
  markServiceRenewed,
  getRenewalEventsForService,
  updateRenewalEvent,
  getRenewalClients,
  getServiceProviders,
} from "@/services/renewal-firestore";
import {
  calculateDates,
  DEFAULT_BILLING_BUFFER_DAYS,
  DEFAULT_REMINDER_LEAD_DAYS,
  SERVICE_CATEGORY_LABELS,
  BILLING_STATUS_LABELS,
  BILLING_STATUS_COLORS,
  RENEWAL_EVENT_STATUS_LABELS,
  RENEWAL_EVENT_STATUS_COLORS,
  RENEWAL_CYCLE_LABELS,
  getDaysUntil,
  isOverdue,
} from "@/lib/renewal-utils";
import { formatDate, cn } from "@/lib/utils";
import type {
  ClientService,
  RenewalEvent,
  ServiceCategory,
  RenewalCycle,
  RenewalClient,
  ServiceProvider,
} from "@/types/renewal";

// ─── Schema ───────────────────────────────────────────────────────────────────

const editSchema = z.object({
  serviceName: z.string().min(2, "Service name required"),
  serviceCategory: z.string() as z.ZodType<ServiceCategory>,
  domainReference: z.string().optional(),
  actualRenewalDate: z.string().min(1, "Date required"),
  billingBufferDays: z.coerce.number().min(0).max(365),
  reminderLeadDays: z.coerce.number().min(0).max(365),
  renewalCycle: z.string() as z.ZodType<RenewalCycle>,
  customCycleDays: z.coerce.number().min(1).optional(),
  providerCost: z.coerce.number().min(0).optional(),
  currency: z.string(),
  notes: z.string().optional(),
  clientId: z.string(),
  providerId: z.string(),
});

type EditFormData = z.infer<typeof editSchema>;

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "domain", "website_hosting", "email_hosting", "ssl",
  "vps_server", "cloud", "software", "maintenance", "other",
];
const RENEWAL_CYCLES: RenewalCycle[] = [
  "monthly", "quarterly", "yearly", "two_yearly", "custom",
];

const SERVICE_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  renewed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-200 text-gray-600",
  expired: "bg-red-100 text-red-700",
};
const SERVICE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  renewed: "Renewed",
  cancelled: "Cancelled",
  expired: "Expired",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DateBadge({ dateStr, label }: { dateStr: string; label: string }) {
  const days = getDaysUntil(dateStr);
  const overdue = isOverdue(dateStr);
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "text-xs font-medium",
          overdue ? "text-red-600" : days <= 7 ? "text-orange-500" : days <= 30 ? "text-amber-600" : "text-foreground"
        )}
      >
        {formatDate(dateStr)}
        {overdue
          ? ` (${Math.abs(days)}d overdue)`
          : days === 0
          ? " (today)"
          : days > 0
          ? ` (${days}d)`
          : ""}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();

  const id = params.id as string;
  const startInEdit = searchParams.get("edit") === "true";

  const [service, setService] = useState<ClientService | null>(null);
  const [events, setEvents] = useState<RenewalEvent[]>([]);
  const [clients, setClients] = useState<RenewalClient[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(startInEdit);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Calculated date preview in edit mode
  const [calcBillingDue, setCalcBillingDue] = useState("");
  const [calcReminderDate, setCalcReminderDate] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const watchedRenewalDate = watch("actualRenewalDate");
  const watchedBufferDays = watch("billingBufferDays");
  const watchedLeadDays = watch("reminderLeadDays");
  const watchedCategory = watch("serviceCategory");
  const watchedCycle = watch("renewalCycle");
  const watchedClientId = watch("clientId");
  const watchedProviderId = watch("providerId");

  // Load service data
  const loadService = useCallback(async () => {
    setLoading(true);
    try {
      const [svc, evts, cls, provs] = await Promise.all([
        getClientService(id),
        getRenewalEventsForService(id),
        getRenewalClients(),
        getServiceProviders(),
      ]);
      if (!svc) {
        toast.error("Service not found");
        router.push("/renewals/services");
        return;
      }
      setService(svc);
      setEvents(evts);
      setClients(cls.filter((c) => c.status === "active"));
      setProviders(provs.filter((p) => p.status === "active"));

      reset({
        serviceName: svc.serviceName,
        serviceCategory: svc.serviceCategory,
        domainReference: svc.domainReference || "",
        actualRenewalDate: svc.actualRenewalDate,
        billingBufferDays: svc.billingBufferDays,
        reminderLeadDays: svc.reminderLeadDays,
        renewalCycle: svc.renewalCycle,
        customCycleDays: svc.customCycleDays,
        providerCost: svc.providerCost,
        currency: svc.currency || "AED",
        notes: svc.notes || "",
        clientId: svc.clientId,
        providerId: svc.providerId,
      });
    } catch {
      toast.error("Failed to load service");
    } finally {
      setLoading(false);
    }
  }, [id, reset, router]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  // Recalculate dates in edit mode
  useEffect(() => {
    if (!editing) return;
    if (watchedRenewalDate && watchedBufferDays >= 0 && watchedLeadDays >= 0) {
      try {
        const { billingDueDate, internalReminderDate } = calculateDates(
          watchedRenewalDate,
          Number(watchedBufferDays),
          Number(watchedLeadDays)
        );
        setCalcBillingDue(billingDueDate);
        setCalcReminderDate(internalReminderDate);
      } catch {
        setCalcBillingDue("");
        setCalcReminderDate("");
      }
    }
  }, [editing, watchedRenewalDate, watchedBufferDays, watchedLeadDays]);

  // Latest event (most recent upcoming/active)
  const latestEvent = events.find(
    (e) => e.status === "upcoming" || e.status === "reminder_sent" || e.status === "billing_due"
  ) ?? events[0];

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleMarkBillingCompleted = async () => {
    if (!service || !latestEvent) return;
    setActionLoading("billing");
    try {
      await updateClientService(service.id, { billingStatus: "billing_completed" });
      await updateRenewalEvent(latestEvent.id, { status: "billing_completed" });
      toast.success("Marked as billing completed");
      loadService();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRenewed = async () => {
    if (!service || !latestEvent || !profile?.id) return;
    setActionLoading("renewed");
    try {
      await markServiceRenewed(service.id, latestEvent.id, profile.id);
      toast.success("Service marked as renewed and next cycle created");
      loadService();
    } catch {
      toast.error("Failed to mark as renewed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkSkipped = async () => {
    if (!service || !latestEvent) return;
    setActionLoading("skipped");
    try {
      await updateClientService(service.id, { billingStatus: "skipped" });
      await updateRenewalEvent(latestEvent.id, { status: "skipped" });
      toast.success("Marked as skipped");
      loadService();
    } catch {
      toast.error("Failed to mark as skipped");
    } finally {
      setActionLoading(null);
    }
  };

  const onSave = async (data: EditFormData) => {
    if (!service) return;
    const selectedClient = clients.find((c) => c.id === data.clientId) ??
      clients.find((c) => c.id === service.clientId);
    const selectedProvider = providers.find((p) => p.id === data.providerId) ??
      providers.find((p) => p.id === service.providerId);

    setSaving(true);
    try {
      await updateClientService(service.id, {
        clientId: data.clientId,
        clientName: selectedClient?.companyName ?? service.clientName,
        providerId: data.providerId,
        providerName: selectedProvider?.providerName ?? service.providerName,
        serviceName: data.serviceName,
        serviceCategory: data.serviceCategory,
        domainReference: data.domainReference || undefined,
        actualRenewalDate: data.actualRenewalDate,
        billingBufferDays: Number(data.billingBufferDays),
        reminderLeadDays: Number(data.reminderLeadDays),
        renewalCycle: data.renewalCycle,
        customCycleDays: data.customCycleDays ? Number(data.customCycleDays) : undefined,
        providerCost: data.providerCost ? Number(data.providerCost) : undefined,
        currency: data.currency || "AED",
        notes: data.notes || undefined,
      });
      toast.success("Service updated successfully");
      setEditing(false);
      loadService();
    } catch {
      toast.error("Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
          <div className="space-y-1">
            <div className="h-5 bg-muted animate-pulse rounded w-48" />
            <div className="h-3 bg-muted animate-pulse rounded w-32" />
          </div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!service) return null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/renewals/services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{service.serviceName}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {service.serviceCode}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {service.clientName} · {service.providerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                reset();
              }}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">
                Renewal History
                {events.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                    {events.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview">
              {editing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  {/* Client & Provider */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Client &amp; Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                          value={watchedClientId}
                          onValueChange={(v) => setValue("clientId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                          value={watchedProviderId}
                          onValueChange={(v) => setValue("providerId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.providerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Service Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Service Name</Label>
                        <Input {...register("serviceName")} />
                        {errors.serviceName && (
                          <p className="text-xs text-destructive">{errors.serviceName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={watchedCategory}
                          onValueChange={(v) => setValue("serviceCategory", v as ServiceCategory)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {SERVICE_CATEGORY_LABELS[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Domain / Reference</Label>
                        <Input {...register("domainReference")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Renewal Cycle</Label>
                        <Select
                          value={watchedCycle}
                          onValueChange={(v) => setValue("renewalCycle", v as RenewalCycle)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RENEWAL_CYCLES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {RENEWAL_CYCLE_LABELS[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {watchedCycle === "custom" && (
                        <div className="space-y-2">
                          <Label>Custom Cycle Days</Label>
                          <Input type="number" min={1} {...register("customCycleDays")} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dates */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Renewal Dates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Actual Renewal Date</Label>
                          <Input type="date" {...register("actualRenewalDate")} />
                        </div>
                        <div className="space-y-2">
                          <Label>Billing Buffer Days</Label>
                          <Input type="number" min={0} {...register("billingBufferDays")} />
                        </div>
                        <div className="space-y-2">
                          <Label>Reminder Lead Days</Label>
                          <Input type="number" min={0} {...register("reminderLeadDays")} />
                        </div>
                      </div>
                      {calcBillingDue && calcReminderDate && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Info className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700">Recalculated Dates</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center justify-between rounded bg-white/70 px-3 py-2">
                              <span className="text-xs text-blue-700 font-medium">Billing Due</span>
                              <span className="text-xs font-semibold text-blue-900">{formatDate(calcBillingDue)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded bg-white/70 px-3 py-2">
                              <span className="text-xs text-blue-700 font-medium">Internal Reminder</span>
                              <span className="text-xs font-semibold text-blue-900">{formatDate(calcReminderDate)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cost */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Cost</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provider Cost</Label>
                        <Input type="number" min={0} step={0.01} {...register("providerCost")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Input {...register("currency")} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea rows={3} {...register("notes")} />
                    </CardContent>
                  </Card>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setEditing(false); reset(); }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                /* View mode */
                <div className="space-y-4">
                  {/* Info card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Server className="h-4 w-4 text-indigo-600" />
                        Service Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Client</p>
                          <p className="font-medium">{service.clientName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Provider</p>
                          <p className="font-medium">{service.providerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Category</p>
                          <Badge variant="outline" className="mt-0.5">
                            {SERVICE_CATEGORY_LABELS[service.serviceCategory]}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Renewal Cycle</p>
                          <p className="font-medium">{RENEWAL_CYCLE_LABELS[service.renewalCycle]}</p>
                        </div>
                        {service.domainReference && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Domain / Reference</p>
                            <p className="font-mono text-sm">{service.domainReference}</p>
                          </div>
                        )}
                        {service.providerCost !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Provider Cost</p>
                            <p className="font-medium">
                              {service.currency} {service.providerCost.toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Buffer / Lead Days</p>
                          <p className="font-medium">
                            {service.billingBufferDays}d / {service.reminderLeadDays}d
                          </p>
                        </div>
                      </div>

                      {service.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dates card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Key Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <DateBadge dateStr={service.internalReminderDate} label="Internal Reminder" />
                      <DateBadge dateStr={service.billingDueDate} label="Billing Due Date" />
                      <DateBadge dateStr={service.actualRenewalDate} label="Actual Renewal Date" />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ── Renewal History Tab ── */}
            <TabsContent value="history">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    Renewal History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No renewal events recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                Renewal:{" "}
                                {formatDate(event.actualRenewalDate)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Billing Due: {formatDate(event.billingDueDate)}
                                {" · "}
                                Reminder: {formatDate(event.internalReminderDate)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] px-2 py-0.5 rounded-full font-medium",
                                RENEWAL_EVENT_STATUS_COLORS[event.status]
                              )}
                            >
                              {RENEWAL_EVENT_STATUS_LABELS[event.status]}
                            </span>
                          </div>
                          {event.notes && (
                            <p className="text-xs text-muted-foreground">{event.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Actions panel */}
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Billing</span>
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                    BILLING_STATUS_COLORS[service.billingStatus]
                  )}
                >
                  {BILLING_STATUS_LABELS[service.billingStatus]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Service</span>
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                    SERVICE_STATUS_COLORS[service.serviceStatus] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {SERVICE_STATUS_LABELS[service.serviceStatus] ?? service.serviceStatus}
                </span>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <DateBadge dateStr={service.internalReminderDate} label="Reminder" />
                <DateBadge dateStr={service.billingDueDate} label="Billing Due" />
                <DateBadge dateStr={service.actualRenewalDate} label="Renewal" />
              </div>
            </CardContent>
          </Card>

          {/* Actions card */}
          {!editing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  size="sm"
                  variant={service.billingStatus === "billing_completed" ? "secondary" : "default"}
                  onClick={handleMarkBillingCompleted}
                  disabled={
                    !!actionLoading ||
                    service.billingStatus === "billing_completed" ||
                    service.billingStatus === "skipped"
                  }
                >
                  {actionLoading === "billing" ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Mark Billing Completed
                </Button>

                <Button
                  className="w-full justify-start"
                  size="sm"
                  variant="outline"
                  onClick={handleMarkRenewed}
                  disabled={!!actionLoading || !latestEvent}
                >
                  {actionLoading === "renewed" ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  )}
                  Mark as Renewed
                </Button>

                <Button
                  className="w-full justify-start"
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkSkipped}
                  disabled={
                    !!actionLoading ||
                    service.billingStatus === "skipped" ||
                    service.billingStatus === "billing_completed"
                  }
                >
                  {actionLoading === "skipped" ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SkipForward className="mr-2 h-3.5 w-3.5" />
                  )}
                  Mark as Skipped
                </Button>

                {isOverdue(service.billingDueDate) && service.billingStatus !== "billing_completed" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <p className="text-xs text-red-700 font-medium">Billing is overdue</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
