"use client";

import { useState, useEffect, type ReactNode, type ElementType } from "react";
import {
  Bell,
  Building2,
  FileText,
  Settings2,
  ShieldCheck,
  Loader2,
  Clock,
  CalendarDays,
  History,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { getRenewalSettings, saveRenewalSettings, getRenewalAuditLogs } from "@/services/renewal-firestore";
import { cn, formatDate } from "@/lib/utils";
import type { RenewalSettings, RenewalAuditLog } from "@/types/renewal";

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Omit<RenewalSettings, "id" | "updatedAt"> = {
  defaultBillingBufferDays: 45,
  defaultReminderLeadDays: 7,
  defaultCurrency: "AED",
  criticalRenewalThresholdDays: 7,
  companyName: "",
  companyEmail: "",
  reminderRecipients: [],
  emailNotificationEnabled: true,
  whatsappNotificationEnabled: false,
  autoApprovalEnabled: false,
  autoApprovalConfidenceThreshold: 90,
};

// ─── Section wrapper ────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

// ─── Field row ──────────────────────────────────────────────────────────────

function FieldRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-start", className)}>
      <div className="sm:pt-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

// ─── Toggle row ─────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  badge,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          {badge && (
            <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

// ─── Formula visual ────────────────────────────────────────────────────────

function FormulaVisual({
  bufferDays,
  leadDays,
}: {
  bufferDays: number;
  leadDays: number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5 text-[12px]">
      <p className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] mb-2">
        Date Formula Preview
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 text-indigo-700 px-2 py-0.5 font-medium">
          <CalendarDays className="h-3 w-3" />
          Renewal Date
        </span>
        <span className="text-muted-foreground">−</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 text-orange-700 px-2 py-0.5 font-medium">
          {bufferDays} days
        </span>
        <span className="text-muted-foreground">=</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
          <Clock className="h-3 w-3" />
          Billing Due Date
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
          <Clock className="h-3 w-3" />
          Billing Due Date
        </span>
        <span className="text-muted-foreground">−</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 text-orange-700 px-2 py-0.5 font-medium">
          {leadDays} days
        </span>
        <span className="text-muted-foreground">=</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">
          <Bell className="h-3 w-3" />
          Reminder Date
        </span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RenewalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<RenewalAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  // Form state
  const [defaultBillingBufferDays, setDefaultBillingBufferDays] = useState(
    DEFAULT_SETTINGS.defaultBillingBufferDays
  );
  const [defaultReminderLeadDays, setDefaultReminderLeadDays] = useState(
    DEFAULT_SETTINGS.defaultReminderLeadDays
  );
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_SETTINGS.defaultCurrency);
  const [criticalThresholdDays, setCriticalThresholdDays] = useState(
    DEFAULT_SETTINGS.criticalRenewalThresholdDays
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    DEFAULT_SETTINGS.emailNotificationEnabled
  );
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    DEFAULT_SETTINGS.whatsappNotificationEnabled
  );
  const [reminderRecipients, setReminderRecipients] = useState(
    (DEFAULT_SETTINGS.reminderRecipients ?? []).join("\n")
  );
  const [companyName, setCompanyName] = useState(DEFAULT_SETTINGS.companyName);
  const [companyEmail, setCompanyEmail] = useState(DEFAULT_SETTINGS.companyEmail);
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(
    DEFAULT_SETTINGS.autoApprovalEnabled
  );
  const [autoApprovalThreshold, setAutoApprovalThreshold] = useState(
    DEFAULT_SETTINGS.autoApprovalConfidenceThreshold
  );

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getRenewalSettings();
        if (s) {
          setDefaultBillingBufferDays(s.defaultBillingBufferDays);
          setDefaultReminderLeadDays(s.defaultReminderLeadDays);
          setDefaultCurrency(s.defaultCurrency ?? "AED");
          setCriticalThresholdDays(s.criticalRenewalThresholdDays ?? 7);
          setEmailNotificationsEnabled(s.emailNotificationEnabled ?? true);
          setWhatsappEnabled(s.whatsappNotificationEnabled ?? false);
          setReminderRecipients((s.reminderRecipients ?? []).join("\n"));
          setCompanyName(s.companyName ?? "");
          setCompanyEmail(s.companyEmail ?? "");
          setAutoApprovalEnabled(s.autoApprovalEnabled ?? false);
          setAutoApprovalThreshold(s.autoApprovalConfidenceThreshold ?? 90);
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Load audit logs (last 20)
  useEffect(() => {
    async function loadAudit() {
      try {
        const logs = await getRenewalAuditLogs();
        setAuditLogs(logs.slice(0, 20));
      } catch {
        // Non-critical — fail silently
      } finally {
        setAuditLoading(false);
      }
    }
    loadAudit();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRenewalSettings({
        defaultBillingBufferDays: Number(defaultBillingBufferDays),
        defaultReminderLeadDays: Number(defaultReminderLeadDays),
        defaultCurrency,
        criticalRenewalThresholdDays: Number(criticalThresholdDays),
        emailNotificationEnabled: emailNotificationsEnabled,
        whatsappNotificationEnabled: whatsappEnabled,
        reminderRecipients: reminderRecipients
          .split("\n")
          .map((e) => e.trim())
          .filter(Boolean),
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim(),
        autoApprovalEnabled,
        autoApprovalConfidenceThreshold: Number(autoApprovalThreshold),
      });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewal Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure defaults, notifications, and import behaviour
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-5">

          {/* Section 1: Default Billing Rules */}
          <SettingsSection
            icon={Settings2}
            title="Default Billing Rules"
            description="These values are applied when a new service is created without overrides."
          >
            <div className="space-y-5">
              <FieldRow
                label="Billing Buffer Days"
                description="Days before the actual renewal date when the billing invoice should be raised."
              >
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={defaultBillingBufferDays}
                  onChange={(e) => setDefaultBillingBufferDays(Number(e.target.value))}
                  className="max-w-[120px]"
                />
              </FieldRow>

              <Separator />

              <FieldRow
                label="Reminder Lead Days"
                description="Days before the billing due date to send an internal reminder to the team."
              >
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={defaultReminderLeadDays}
                  onChange={(e) => setDefaultReminderLeadDays(Number(e.target.value))}
                  className="max-w-[120px]"
                />
              </FieldRow>

              <FormulaVisual
                bufferDays={defaultBillingBufferDays}
                leadDays={defaultReminderLeadDays}
              />

              <Separator />

              <FieldRow
                label="Default Currency"
                description="The default currency used for provider cost fields."
              >
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger className="max-w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["AED", "USD", "EUR", "GBP"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <Separator />

              <FieldRow
                label="Critical Threshold Days"
                description="Number of days before actual renewal date to flag the service as critical."
              >
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={criticalThresholdDays}
                  onChange={(e) => setCriticalThresholdDays(Number(e.target.value))}
                  className="max-w-[120px]"
                />
              </FieldRow>
            </div>
          </SettingsSection>

          {/* Section 2: Notification Settings */}
          <SettingsSection
            icon={Bell}
            title="Notification Settings"
            description="Control how and where renewal reminders are delivered."
          >
            <div className="space-y-5">
              <ToggleRow
                label="Email Notifications"
                description="Send daily reminder emails to the listed recipient addresses."
                checked={emailNotificationsEnabled}
                onCheckedChange={setEmailNotificationsEnabled}
              />

              <Separator />

              <ToggleRow
                label="WhatsApp Notifications"
                description="Send WhatsApp messages for critical renewal alerts."
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
                badge="Coming Soon"
                disabled
              />

              <Separator />

              <FieldRow
                label="Reminder Recipients"
                description="Internal team email addresses to receive daily reminder summaries. One per line."
              >
                <Textarea
                  placeholder={"team@example.com\nmanager@example.com"}
                  value={reminderRecipients}
                  onChange={(e) => setReminderRecipients(e.target.value)}
                  rows={4}
                  className="text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {reminderRecipients.split("\n").filter((e) => e.trim()).length} recipient(s) configured
                </p>
              </FieldRow>
            </div>
          </SettingsSection>

          {/* Section 3: Company Settings */}
          <SettingsSection
            icon={Building2}
            title="Company Settings"
            description="Your company information used in notification emails and reports."
          >
            <div className="space-y-5">
              <FieldRow label="Company Name">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="SupportMENA Technologies"
                />
              </FieldRow>

              <Separator />

              <FieldRow label="Company Email">
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="info@supportmena.ae"
                />
              </FieldRow>
            </div>
          </SettingsSection>

          {/* Section 4: Document Import Settings */}
          <SettingsSection
            icon={FileText}
            title="Document Import Settings"
            description="Control how imported documents and AI extractions are processed."
          >
            <div className="space-y-5">
              <ToggleRow
                label="Auto-Approval Enabled"
                description="Automatically approve AI extractions when confidence score is at or above the threshold below."
                checked={autoApprovalEnabled}
                onCheckedChange={setAutoApprovalEnabled}
              />

              {autoApprovalEnabled && (
                <>
                  <Separator />
                  <FieldRow
                    label="Confidence Threshold (%)"
                    description="Extractions with a confidence score equal to or above this value will be auto-approved."
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={50}
                        max={100}
                        value={autoApprovalThreshold}
                        onChange={(e) => setAutoApprovalThreshold(Number(e.target.value))}
                        className="max-w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground">
                        Currently: <span className={cn(
                          "font-semibold",
                          autoApprovalThreshold >= 90
                            ? "text-green-600"
                            : autoApprovalThreshold >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}>{autoApprovalThreshold}%</span>
                      </span>
                    </div>
                  </FieldRow>
                </>
              )}
            </div>
          </SettingsSection>

          {/* Section 5: Audit Log preview */}
          <SettingsSection
            icon={History}
            title="Audit Log"
            description="Last 20 system actions recorded for this module."
          >
            <div className="rounded-lg border border-border overflow-hidden">
              {auditLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No audit entries yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        {["Timestamp", "User", "Action", "Entity", "Description"].map((h) => (
                          <th
                            key={h}
                            className="h-9 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap font-medium">
                            {log.userName || log.userId || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap text-muted-foreground">
                            {log.entityType}
                            {log.entityId && (
                              <span className="ml-1 font-mono text-[11px] opacity-60">
                                #{log.entityId.slice(0, 6)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] max-w-[260px]">
                            <p className="truncate text-muted-foreground">{log.description || "—"}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </SettingsSection>

          {/* Save button (bottom) */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
