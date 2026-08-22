import { Timestamp } from "firebase/firestore";

// ─── Renewal Clients ──────────────────────────────────────────────────────────

export interface RenewalClient {
  id: string;
  clientCode: string;
  companyName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingEmail?: string;
  notes?: string;
  status: "active" | "inactive";
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Service Providers ────────────────────────────────────────────────────────

export type ProviderCategory =
  | "domain"
  | "hosting"
  | "email"
  | "ssl"
  | "cloud"
  | "software"
  | "other";

export interface ServiceProvider {
  id: string;
  providerCode: string;
  providerName: string;
  category: ProviderCategory;
  websiteUrl?: string;
  loginUrl?: string;
  accountEmail?: string;
  supportEmail?: string;
  notes?: string;
  status: "active" | "inactive";
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Client Services ──────────────────────────────────────────────────────────

export type ServiceCategory =
  | "domain"
  | "website_hosting"
  | "email_hosting"
  | "ssl"
  | "vps_server"
  | "cloud"
  | "software"
  | "maintenance"
  | "other";

export type RenewalCycle =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "two_yearly"
  | "custom";

export type BillingStatus =
  | "not_due"
  | "reminder_sent"
  | "billing_due"
  | "billing_completed"
  | "overdue"
  | "skipped";

export type ServiceStatus = "active" | "renewed" | "cancelled" | "expired";

export interface ClientService {
  id: string;
  serviceCode: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  domainReference?: string;
  actualRenewalDate: string;
  billingBufferDays: number;
  reminderLeadDays: number;
  billingDueDate: string;
  internalReminderDate: string;
  renewalCycle: RenewalCycle;
  customCycleDays?: number;
  providerCost?: number;
  currency: string;
  assignedUserId?: string;
  assignedUserName?: string;
  billingStatus: BillingStatus;
  serviceStatus: ServiceStatus;
  notes?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Renewal Events ───────────────────────────────────────────────────────────

export type RenewalEventStatus =
  | "upcoming"
  | "reminder_sent"
  | "billing_due"
  | "billing_completed"
  | "overdue"
  | "renewed"
  | "skipped"
  | "cancelled";

export interface RenewalEvent {
  id: string;
  clientServiceId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  providerName: string;
  serviceCategory: ServiceCategory;
  actualRenewalDate: string;
  billingDueDate: string;
  internalReminderDate: string;
  status: RenewalEventStatus;
  notes?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export type ReminderType =
  | "advance_reminder"
  | "billing_due_today"
  | "overdue_billing"
  | "critical_renewal";

export type ReminderPriority = "low" | "medium" | "high" | "critical";
export type ReminderStatus = "pending" | "sent" | "snoozed" | "completed";

export interface Reminder {
  id: string;
  renewalEventId: string;
  clientServiceId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  providerName: string;
  serviceCategory?: ServiceCategory;
  reminderType: ReminderType;
  reminderDate: string;
  billingDueDate: string;
  actualRenewalDate: string;
  message: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  snoozeUntil?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationChannel = "in_app" | "email" | "whatsapp";
export type RenewalNotificationStatus = "pending" | "sent" | "failed";

export interface RenewalNotification {
  id: string;
  reminderId: string;
  clientName: string;
  serviceName: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  message: string;
  status: RenewalNotificationStatus;
  sentDate?: string;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentSourceType =
  | "manual_upload"
  | "email_attachment"
  | "local_folder";

export type DocumentProcessingStatus =
  | "pending"
  | "processing"
  | "extracted"
  | "needs_review"
  | "failed"
  | "approved"
  | "rejected";

export interface ImportedDocument {
  id: string;
  originalFileName: string;
  sourceType: DocumentSourceType;
  sourceReference?: string;
  fileUrl?: string;
  fileHash?: string;
  processingStatus: DocumentProcessingStatus;
  extractedText?: string;
  linkedClientId?: string;
  linkedClientName?: string;
  linkedServiceId?: string;
  linkedServiceName?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Extraction Drafts ────────────────────────────────────────────────────────

export type ExtractionStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "duplicate";

export interface ExtractionDraft {
  id: string;
  documentId: string;
  originalFileName?: string;
  extractedClientName?: string;
  extractedProviderName?: string;
  extractedServiceName?: string;
  extractedServiceCategory?: ServiceCategory;
  extractedDomainReference?: string;
  extractedRenewalDate?: string;
  extractedAmount?: number;
  extractedCurrency?: string;
  extractedInvoiceReference?: string;
  confidenceScore?: number;
  status: ExtractionStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Renewal Settings ─────────────────────────────────────────────────────────

export interface RenewalSettings {
  id: string;
  defaultBillingBufferDays: number;
  defaultReminderLeadDays: number;
  defaultCurrency: string;
  companyName: string;
  companyEmail: string;
  reminderRecipients: string[];
  emailNotificationEnabled: boolean;
  whatsappNotificationEnabled: boolean;
  autoApprovalEnabled: boolean;
  autoApprovalConfidenceThreshold: number;
  criticalRenewalThresholdDays: number;
  updatedAt: Timestamp;
}

// ─── Renewal Audit Log ────────────────────────────────────────────────────────

export interface RenewalAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  description: string;
  timestamp: Timestamp;
}
