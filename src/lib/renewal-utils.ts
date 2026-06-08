import {
  subDays,
  addDays,
  differenceInDays,
  format,
  parseISO,
  isBefore,
  startOfDay,
} from "date-fns";
import type {
  BillingStatus,
  RenewalEventStatus,
  ReminderType,
  ReminderPriority,
  ProviderCategory,
  ServiceCategory,
} from "@/types/renewal";

export const DEFAULT_BILLING_BUFFER_DAYS = 45;
export const DEFAULT_REMINDER_LEAD_DAYS = 7;

export function calculateBillingDueDate(
  actualRenewalDate: string,
  billingBufferDays: number
): string {
  const renewal = parseISO(actualRenewalDate);
  return format(subDays(renewal, billingBufferDays), "yyyy-MM-dd");
}

export function calculateReminderDate(
  billingDueDate: string,
  reminderLeadDays: number
): string {
  const billing = parseISO(billingDueDate);
  return format(subDays(billing, reminderLeadDays), "yyyy-MM-dd");
}

export function calculateDates(
  actualRenewalDate: string,
  billingBufferDays = DEFAULT_BILLING_BUFFER_DAYS,
  reminderLeadDays = DEFAULT_REMINDER_LEAD_DAYS
): { billingDueDate: string; internalReminderDate: string } {
  const billingDueDate = calculateBillingDueDate(
    actualRenewalDate,
    billingBufferDays
  );
  const internalReminderDate = calculateReminderDate(
    billingDueDate,
    reminderLeadDays
  );
  return { billingDueDate, internalReminderDate };
}

export function getNextRenewalDate(
  currentRenewalDate: string,
  renewalCycle: string,
  customDays?: number
): string {
  const date = parseISO(currentRenewalDate);
  const cycleMap: Record<string, number> = {
    monthly: 30,
    quarterly: 90,
    yearly: 365,
    two_yearly: 730,
    custom: customDays || 365,
  };
  return format(addDays(date, cycleMap[renewalCycle] ?? 365), "yyyy-MM-dd");
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getDaysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), startOfDay(new Date()));
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function isOverdue(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), startOfDay(new Date()));
}

export function isUpcomingWithin(dateStr: string, days: number): boolean {
  const d = getDaysUntil(dateStr);
  return d >= 0 && d <= days;
}

export function isCritical(
  actualRenewalDate: string,
  thresholdDays = 7
): boolean {
  const d = getDaysUntil(actualRenewalDate);
  return d >= 0 && d <= thresholdDays;
}

export function getRenewalEventStatus(
  internalReminderDate: string,
  billingDueDate: string,
  actualRenewalDate: string,
  currentStatus: RenewalEventStatus
): RenewalEventStatus {
  if (
    currentStatus === "billing_completed" ||
    currentStatus === "renewed" ||
    currentStatus === "skipped" ||
    currentStatus === "cancelled"
  ) {
    return currentStatus;
  }
  const today = todayStr();
  if (isOverdue(actualRenewalDate)) return "overdue";
  if (today === billingDueDate) return "billing_due";
  if (isOverdue(billingDueDate)) return "overdue";
  if (today === internalReminderDate) return "reminder_sent";
  return "upcoming";
}

export function getBillingStatus(
  billingDueDate: string,
  currentStatus: BillingStatus
): BillingStatus {
  if (
    currentStatus === "billing_completed" ||
    currentStatus === "skipped"
  )
    return currentStatus;
  const today = todayStr();
  if (isOverdue(billingDueDate)) return "overdue";
  if (today === billingDueDate) return "billing_due";
  if (currentStatus === "reminder_sent") return "reminder_sent";
  return "not_due";
}

export function getReminderType(
  internalReminderDate: string,
  billingDueDate: string,
  actualRenewalDate: string
): { type: ReminderType; priority: ReminderPriority } {
  const today = todayStr();
  if (isCritical(actualRenewalDate))
    return { type: "critical_renewal", priority: "critical" };
  if (today === billingDueDate)
    return { type: "billing_due_today", priority: "high" };
  if (isOverdue(billingDueDate))
    return { type: "overdue_billing", priority: "critical" };
  if (today === internalReminderDate)
    return { type: "advance_reminder", priority: "medium" };
  return { type: "advance_reminder", priority: "low" };
}

export function buildReminderMessage(
  clientName: string,
  serviceName: string,
  actualRenewalDate: string,
  billingDueDate: string,
  reminderType: ReminderType
): string {
  const renewal = format(parseISO(actualRenewalDate), "dd MMM yyyy");
  const billing = format(parseISO(billingDueDate), "dd MMM yyyy");
  switch (reminderType) {
    case "advance_reminder":
      return `Advance reminder: ${serviceName} for ${clientName} renews on ${renewal}. Billing should be raised by ${billing}.`;
    case "billing_due_today":
      return `Billing is due today for ${serviceName} (${clientName}). Actual renewal date: ${renewal}.`;
    case "overdue_billing":
      return `OVERDUE: Billing for ${serviceName} (${clientName}) was due on ${billing}. Actual renewal: ${renewal}.`;
    case "critical_renewal":
      return `CRITICAL: ${serviceName} for ${clientName} renews on ${renewal} — within 7 days. Billing may be overdue!`;
    default:
      return `Renewal reminder for ${serviceName} (${clientName}).`;
  }
}

export const PROVIDER_CATEGORY_LABELS: Record<ProviderCategory, string> = {
  domain: "Domain",
  hosting: "Hosting",
  email: "Email",
  ssl: "SSL",
  cloud: "Cloud",
  software: "Software",
  other: "Other",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  domain: "Domain",
  website_hosting: "Website Hosting",
  email_hosting: "Email Hosting",
  ssl: "SSL Certificate",
  vps_server: "VPS / Server",
  cloud: "Cloud Hosting",
  software: "Software Subscription",
  maintenance: "Maintenance",
  other: "Other",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  not_due: "Not Due",
  reminder_sent: "Reminder Sent",
  billing_due: "Billing Due",
  billing_completed: "Billing Completed",
  overdue: "Overdue",
  skipped: "Skipped",
};

export const BILLING_STATUS_COLORS: Record<BillingStatus, string> = {
  not_due: "bg-gray-100 text-gray-700",
  reminder_sent: "bg-blue-100 text-blue-700",
  billing_due: "bg-orange-100 text-orange-700",
  billing_completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  skipped: "bg-gray-200 text-gray-600",
};

export const RENEWAL_EVENT_STATUS_LABELS: Record<RenewalEventStatus, string> =
  {
    upcoming: "Upcoming",
    reminder_sent: "Reminder Sent",
    billing_due: "Billing Due",
    billing_completed: "Billing Completed",
    overdue: "Overdue",
    renewed: "Renewed",
    skipped: "Skipped",
    cancelled: "Cancelled",
  };

export const RENEWAL_EVENT_STATUS_COLORS: Record<RenewalEventStatus, string> =
  {
    upcoming: "bg-blue-100 text-blue-700",
    reminder_sent: "bg-indigo-100 text-indigo-700",
    billing_due: "bg-orange-100 text-orange-700",
    billing_completed: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    renewed: "bg-emerald-100 text-emerald-700",
    skipped: "bg-gray-200 text-gray-600",
    cancelled: "bg-gray-200 text-gray-500",
  };

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  advance_reminder: "Advance Reminder",
  billing_due_today: "Billing Due Today",
  overdue_billing: "Overdue Billing",
  critical_renewal: "Critical Renewal",
};

export const REMINDER_PRIORITY_COLORS: Record<ReminderPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export const RENEWAL_CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  two_yearly: "2-Yearly",
  custom: "Custom",
};
