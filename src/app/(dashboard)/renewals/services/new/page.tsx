"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Server, Calendar, DollarSign, FileText, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRenewalClients,
  getServiceProviders,
  createClientService,
} from "@/services/renewal-firestore";
import {
  calculateDates,
  DEFAULT_BILLING_BUFFER_DAYS,
  DEFAULT_REMINDER_LEAD_DAYS,
  SERVICE_CATEGORY_LABELS,
  RENEWAL_CYCLE_LABELS,
} from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { RenewalClient, ServiceProvider, ServiceCategory, RenewalCycle } from "@/types/renewal";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  providerId: z.string().min(1, "Provider is required"),
  serviceName: z.string().min(2, "Service name is required"),
  serviceCategory: z.string().min(1, "Category is required") as z.ZodType<ServiceCategory>,
  domainReference: z.string().optional(),
  actualRenewalDate: z.string().min(1, "Renewal date is required"),
  billingBufferDays: z.coerce.number().min(0).max(365).default(DEFAULT_BILLING_BUFFER_DAYS),
  reminderLeadDays: z.coerce.number().min(0).max(365).default(DEFAULT_REMINDER_LEAD_DAYS),
  renewalCycle: z.string().min(1, "Renewal cycle is required") as z.ZodType<RenewalCycle>,
  customCycleDays: z.coerce.number().min(1).optional(),
  providerCost: z.coerce.number().min(0).optional(),
  currency: z.string().default("AED"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "domain",
  "website_hosting",
  "email_hosting",
  "ssl",
  "vps_server",
  "cloud",
  "software",
  "maintenance",
  "other",
];

const RENEWAL_CYCLES: RenewalCycle[] = [
  "monthly",
  "quarterly",
  "yearly",
  "two_yearly",
  "custom",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewServicePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<RenewalClient[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Calculated date preview state
  const [calcBillingDue, setCalcBillingDue] = useState<string>("");
  const [calcReminderDate, setCalcReminderDate] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
      reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
      currency: "AED",
    },
  });

  const watchedRenewalDate = watch("actualRenewalDate");
  const watchedBufferDays = watch("billingBufferDays");
  const watchedLeadDays = watch("reminderLeadDays");
  const watchedCategory = watch("serviceCategory");
  const watchedCycle = watch("renewalCycle");
  const watchedClientId = watch("clientId");
  const watchedProviderId = watch("providerId");

  // Load clients and providers
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [c, p] = await Promise.all([getRenewalClients(), getServiceProviders()]);
        setClients(c.filter((cl) => cl.status === "active"));
        setProviders(p.filter((pr) => pr.status === "active"));
      } catch {
        toast.error("Failed to load clients/providers");
      } finally {
        setLoadingDropdowns(false);
      }
    }
    loadDropdowns();
  }, []);

  // Recalculate dates whenever inputs change
  const recalcDates = useCallback(() => {
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
    } else {
      setCalcBillingDue("");
      setCalcReminderDate("");
    }
  }, [watchedRenewalDate, watchedBufferDays, watchedLeadDays]);

  useEffect(() => {
    recalcDates();
  }, [recalcDates]);

  const selectedClient = clients.find((c) => c.id === watchedClientId);
  const selectedProvider = providers.find((p) => p.id === watchedProviderId);

  const onSubmit = async (data: FormData) => {
    if (!profile?.id) {
      toast.error("You must be logged in");
      return;
    }
    if (!selectedClient) {
      toast.error("Please select a valid client");
      return;
    }
    if (!selectedProvider) {
      toast.error("Please select a valid provider");
      return;
    }
    setSaving(true);
    try {
      await createClientService(
        {
          clientId: data.clientId,
          clientName: selectedClient.companyName,
          providerId: data.providerId,
          providerName: selectedProvider.providerName,
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
          billingStatus: "not_due",
          serviceStatus: "active",
          notes: data.notes || undefined,
        },
        profile.id
      );
      toast.success("Service created successfully");
      router.push("/renewals/services");
    } catch {
      toast.error("Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/renewals/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">New Client Service</h2>
          <p className="text-sm text-muted-foreground">
            Add a service subscription for renewal tracking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Client & Provider */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Client &amp; Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Client <span className="text-destructive">*</span>
              </Label>
              {loadingDropdowns ? (
                <div className="h-9 bg-muted animate-pulse rounded-md" />
              ) : (
                <Select
                  value={watchedClientId}
                  onValueChange={(v) => setValue("clientId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Provider <span className="text-destructive">*</span>
              </Label>
              {loadingDropdowns ? (
                <div className="h-9 bg-muted animate-pulse rounded-md" />
              ) : (
                <Select
                  value={watchedProviderId}
                  onValueChange={(v) => setValue("providerId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.providerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.providerId && (
                <p className="text-xs text-destructive">{errors.providerId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Website Hosting – ercinternational.ae"
                {...register("serviceName")}
              />
              {errors.serviceName && (
                <p className="text-xs text-destructive">{errors.serviceName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Service Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedCategory}
                onValueChange={(v) => setValue("serviceCategory", v as ServiceCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SERVICE_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceCategory && (
                <p className="text-xs text-destructive">{errors.serviceCategory.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Domain / Reference</Label>
              <Input
                placeholder="e.g. ercinternational.ae"
                {...register("domainReference")}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Renewal Cycle <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedCycle}
                onValueChange={(v) => setValue("renewalCycle", v as RenewalCycle)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle..." />
                </SelectTrigger>
                <SelectContent>
                  {RENEWAL_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {RENEWAL_CYCLE_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.renewalCycle && (
                <p className="text-xs text-destructive">{errors.renewalCycle.message}</p>
              )}
            </div>

            {watchedCycle === "custom" && (
              <div className="space-y-2">
                <Label>Custom Cycle Days</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 180"
                  {...register("customCycleDays")}
                />
                {errors.customCycleDays && (
                  <p className="text-xs text-destructive">{errors.customCycleDays.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renewal Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Renewal Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  Actual Renewal Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("actualRenewalDate")}
                />
                {errors.actualRenewalDate && (
                  <p className="text-xs text-destructive">{errors.actualRenewalDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Billing Buffer Days</Label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  {...register("billingBufferDays")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Days before renewal to bill client
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reminder Lead Days</Label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  {...register("reminderLeadDays")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Days before billing due to send reminder
                </p>
              </div>
            </div>

            {/* Calculated dates preview */}
            {calcBillingDue && calcReminderDate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">
                    Auto-calculated Dates
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded bg-white/70 px-3 py-2">
                    <span className="text-xs text-blue-700 font-medium">Billing Due Date</span>
                    <span className="text-xs font-semibold text-blue-900">
                      {formatDate(calcBillingDue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white/70 px-3 py-2">
                    <span className="text-xs text-blue-700 font-medium">Internal Reminder</span>
                    <span className="text-xs font-semibold text-blue-900">
                      {formatDate(calcReminderDate)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-blue-600 mt-1">
                  These dates are calculated automatically and saved with the service.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider Cost</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                {...register("providerCost")}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                placeholder="AED"
                {...register("currency")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Internal notes about this service..."
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline">
            <Link href="/renewals/services">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving || loadingDropdowns}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Create Service"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
