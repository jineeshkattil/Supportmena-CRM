import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  RenewalClient,
  ServiceProvider,
  ClientService,
  RenewalEvent,
  Reminder,
  ImportedDocument,
  ExtractionDraft,
  RenewalSettings,
  RenewalAuditLog,
} from "@/types/renewal";
import {
  calculateDates,
  getNextRenewalDate,
  DEFAULT_BILLING_BUFFER_DAYS,
  DEFAULT_REMINDER_LEAD_DAYS,
} from "@/lib/renewal-utils";

// ─── Collection Names ─────────────────────────────────────────────────────────

export const COLLECTIONS = {
  CLIENTS: "renewal_clients",
  PROVIDERS: "renewal_providers",
  SERVICES: "renewal_services",
  EVENTS: "renewal_events",
  REMINDERS: "renewal_reminders",
  NOTIFICATIONS: "renewal_notifications",
  DOCUMENTS: "renewal_documents",
  EXTRACTIONS: "renewal_extractions",
  SETTINGS: "renewal_settings",
  AUDIT: "renewal_audit_logs",
} as const;

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getRenewalClients(): Promise<RenewalClient[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.CLIENTS), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RenewalClient);
}

export async function getRenewalClient(id: string): Promise<RenewalClient | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.CLIENTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RenewalClient;
}

export async function createRenewalClient(
  data: Omit<RenewalClient, "id" | "clientCode" | "createdAt" | "updatedAt">,
  userId: string
): Promise<string> {
  const counter = Date.now().toString().slice(-4);
  const ref = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
    ...data,
    clientCode: `RC-${counter}`,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRenewalClient(
  id: string,
  data: Partial<RenewalClient>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Providers ────────────────────────────────────────────────────────────────

export async function getServiceProviders(): Promise<ServiceProvider[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.PROVIDERS), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceProvider);
}

export async function getServiceProvider(id: string): Promise<ServiceProvider | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.PROVIDERS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ServiceProvider;
}

export async function createServiceProvider(
  data: Omit<ServiceProvider, "id" | "providerCode" | "createdAt" | "updatedAt">,
  userId: string
): Promise<string> {
  const counter = Date.now().toString().slice(-4);
  const ref = await addDoc(collection(db, COLLECTIONS.PROVIDERS), {
    ...data,
    providerCode: `SP-${counter}`,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateServiceProvider(
  id: string,
  data: Partial<ServiceProvider>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PROVIDERS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Client Services ──────────────────────────────────────────────────────────

export async function getClientServices(
  constraints: QueryConstraint[] = []
): Promise<ClientService[]> {
  const q = query(
    collection(db, COLLECTIONS.SERVICES),
    ...constraints,
    orderBy("actualRenewalDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClientService);
}

export async function getClientService(id: string): Promise<ClientService | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.SERVICES, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ClientService;
}

export async function createClientService(
  data: Omit<
    ClientService,
    | "id"
    | "serviceCode"
    | "billingDueDate"
    | "internalReminderDate"
    | "createdAt"
    | "updatedAt"
  >,
  userId: string
): Promise<string> {
  const { billingDueDate, internalReminderDate } = calculateDates(
    data.actualRenewalDate,
    data.billingBufferDays,
    data.reminderLeadDays
  );
  const counter = Date.now().toString().slice(-4);

  const batch = writeBatch(db);

  const serviceRef = doc(collection(db, COLLECTIONS.SERVICES));
  batch.set(serviceRef, {
    ...data,
    serviceCode: `SVC-${counter}`,
    billingDueDate,
    internalReminderDate,
    billingStatus: "not_due",
    serviceStatus: "active",
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create initial renewal event
  const eventRef = doc(collection(db, COLLECTIONS.EVENTS));
  batch.set(eventRef, {
    clientServiceId: serviceRef.id,
    clientId: data.clientId,
    clientName: data.clientName,
    serviceName: data.serviceName,
    providerName: data.providerName,
    serviceCategory: data.serviceCategory,
    actualRenewalDate: data.actualRenewalDate,
    billingDueDate,
    internalReminderDate,
    status: "upcoming",
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return serviceRef.id;
}

export async function updateClientService(
  id: string,
  data: Partial<ClientService>
): Promise<void> {
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };

  // Recalculate dates if key fields changed
  if (
    data.actualRenewalDate !== undefined ||
    data.billingBufferDays !== undefined ||
    data.reminderLeadDays !== undefined
  ) {
    const existing = await getClientService(id);
    if (existing) {
      const renewal = data.actualRenewalDate ?? existing.actualRenewalDate;
      const buffer = data.billingBufferDays ?? existing.billingBufferDays;
      const lead = data.reminderLeadDays ?? existing.reminderLeadDays;
      const { billingDueDate, internalReminderDate } = calculateDates(
        renewal,
        buffer,
        lead
      );
      updates.billingDueDate = billingDueDate;
      updates.internalReminderDate = internalReminderDate;
    }
  }

  await updateDoc(doc(db, COLLECTIONS.SERVICES, id), updates);
}

// ─── Renewal Events ───────────────────────────────────────────────────────────

export async function getRenewalEvents(
  constraints: QueryConstraint[] = []
): Promise<RenewalEvent[]> {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    ...constraints,
    orderBy("actualRenewalDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RenewalEvent);
}

export async function getRenewalEventsForService(
  serviceId: string
): Promise<RenewalEvent[]> {
  return getRenewalEvents([where("clientServiceId", "==", serviceId)]);
}

export async function updateRenewalEvent(
  id: string,
  data: Partial<RenewalEvent>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markServiceRenewed(
  serviceId: string,
  eventId: string,
  userId: string
): Promise<void> {
  const service = await getClientService(serviceId);
  if (!service) throw new Error("Service not found");

  const batch = writeBatch(db);

  // Mark current event as renewed
  batch.update(doc(db, COLLECTIONS.EVENTS, eventId), {
    status: "renewed",
    updatedAt: serverTimestamp(),
  });

  // Update service
  const nextRenewalDate = getNextRenewalDate(
    service.actualRenewalDate,
    service.renewalCycle,
    service.customCycleDays
  );
  const { billingDueDate, internalReminderDate } = calculateDates(
    nextRenewalDate,
    service.billingBufferDays,
    service.reminderLeadDays
  );

  batch.update(doc(db, COLLECTIONS.SERVICES, serviceId), {
    actualRenewalDate: nextRenewalDate,
    billingDueDate,
    internalReminderDate,
    billingStatus: "not_due",
    serviceStatus: "renewed",
    updatedAt: serverTimestamp(),
  });

  // Create next renewal event
  const newEventRef = doc(collection(db, COLLECTIONS.EVENTS));
  batch.set(newEventRef, {
    clientServiceId: serviceId,
    clientId: service.clientId,
    clientName: service.clientName,
    serviceName: service.serviceName,
    providerName: service.providerName,
    serviceCategory: service.serviceCategory,
    actualRenewalDate: nextRenewalDate,
    billingDueDate,
    internalReminderDate,
    status: "upcoming",
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function getReminders(
  constraints: QueryConstraint[] = []
): Promise<Reminder[]> {
  const q = query(
    collection(db, COLLECTIONS.REMINDERS),
    ...constraints,
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reminder);
}

export async function createReminder(
  data: Omit<Reminder, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.REMINDERS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateReminder(
  id: string,
  data: Partial<Reminder>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.REMINDERS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getImportedDocuments(): Promise<ImportedDocument[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.DOCUMENTS), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ImportedDocument);
}

export async function createImportedDocument(
  data: Omit<ImportedDocument, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.DOCUMENTS), {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateImportedDocument(
  id: string,
  data: Partial<ImportedDocument>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.DOCUMENTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getExtractionByDocumentId(
  documentId: string
): Promise<ExtractionDraft | null> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.EXTRACTIONS),
      where("documentId", "==", documentId)
    )
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ExtractionDraft;
}

export async function createExtractionDraft(
  data: Omit<ExtractionDraft, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EXTRACTIONS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExtractionDraft(
  id: string,
  data: Partial<ExtractionDraft>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EXTRACTIONS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getExtractionDrafts(): Promise<ExtractionDraft[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.EXTRACTIONS),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExtractionDraft);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getRenewalSettings(): Promise<RenewalSettings | null> {
  const snap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as RenewalSettings;
}

export async function saveRenewalSettings(
  data: Omit<RenewalSettings, "id" | "updatedAt">
): Promise<void> {
  const existing = await getRenewalSettings();
  if (existing) {
    await updateDoc(doc(db, COLLECTIONS.SETTINGS, existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, COLLECTIONS.SETTINGS), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function logRenewalAudit(
  data: Omit<RenewalAuditLog, "id" | "timestamp">
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.AUDIT), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export async function getRenewalAuditLogs(): Promise<RenewalAuditLog[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.AUDIT), orderBy("timestamp", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RenewalAuditLog);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [services, events, reminders, documents] = await Promise.all([
    getClientServices(),
    getRenewalEvents(),
    getReminders(),
    getImportedDocuments(),
  ]);

  const remindersToday = events.filter(
    (e) => e.internalReminderDate === today && e.status === "upcoming"
  ).length;

  const billingDueThisWeek = events.filter(
    (e) =>
      e.billingDueDate >= today &&
      getDaysFromToday(e.billingDueDate) <= 7 &&
      e.status !== "billing_completed"
  ).length;

  const renewalsThisMonth = events.filter(
    (e) =>
      e.actualRenewalDate >= today &&
      getDaysFromToday(e.actualRenewalDate) <= 30
  ).length;

  const overdue = events.filter(
    (e) =>
      e.billingDueDate < today &&
      e.status !== "billing_completed" &&
      e.status !== "skipped" &&
      e.status !== "cancelled"
  ).length;

  const critical = events.filter(
    (e) =>
      e.actualRenewalDate >= today &&
      getDaysFromToday(e.actualRenewalDate) <= 7 &&
      e.status !== "billing_completed"
  ).length;

  const pendingDocuments = documents.filter(
    (d) => d.processingStatus === "needs_review"
  ).length;

  const upcoming7 = events.filter(
    (e) =>
      e.internalReminderDate >= today &&
      getDaysFromToday(e.internalReminderDate) <= 7
  ).length;

  const upcoming30 = events.filter(
    (e) =>
      e.internalReminderDate >= today &&
      getDaysFromToday(e.internalReminderDate) <= 30
  ).length;

  return {
    remindersToday,
    upcoming7,
    upcoming30,
    billingDueThisWeek,
    renewalsThisMonth,
    overdue,
    critical,
    pendingDocuments,
    totalServices: services.length,
    totalClients: new Set(services.map((s) => s.clientId)).size,
    totalReminders: reminders.length,
  };
}

function getDaysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Sample Data Seeder ───────────────────────────────────────────────────────

export async function seedSampleData(userId: string): Promise<void> {
  // Check if already seeded
  const existing = await getRenewalClients();
  if (existing.length > 0) return;

  const batch = writeBatch(db);

  // Clients
  const clients = [
    {
      clientCode: "RC-0001",
      companyName: "ERC International",
      contactPerson: "Ahmed Al Rashid",
      contactEmail: "ahmed@ercinternational.ae",
      contactPhone: "+971 50 111 2222",
      billingEmail: "billing@ercinternational.ae",
      status: "active" as const,
      notes: "Key client – website and hosting managed by SupportMENA",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      clientCode: "RC-0002",
      companyName: "Gulf Tech Solutions",
      contactPerson: "Sara Al Mansouri",
      contactEmail: "sara@gulftech.ae",
      contactPhone: "+971 55 333 4444",
      billingEmail: "accounts@gulftech.ae",
      status: "active" as const,
      notes: "Multiple domains and SSL certificates",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      clientCode: "RC-0003",
      companyName: "Noor Medical Group",
      contactPerson: "Dr. Khalid Al Noor",
      contactEmail: "it@noormedical.ae",
      contactPhone: "+971 4 222 3333",
      billingEmail: "finance@noormedical.ae",
      status: "active" as const,
      notes: "Email hosting and cloud services",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  const clientRefs = clients.map(() => doc(collection(db, COLLECTIONS.CLIENTS)));
  clients.forEach((c, i) => batch.set(clientRefs[i], c));

  // Providers
  const providers = [
    {
      providerCode: "SP-0001",
      providerName: "Hostinger",
      category: "hosting" as const,
      websiteUrl: "https://www.hostinger.com",
      loginUrl: "https://www.hostinger.com/cpanel",
      accountEmail: "hosting@supportmena.ae",
      status: "active" as const,
      notes: "Primary hosting provider",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      providerCode: "SP-0002",
      providerName: "GoDaddy",
      category: "domain" as const,
      websiteUrl: "https://www.godaddy.com",
      loginUrl: "https://sso.godaddy.com",
      accountEmail: "domains@supportmena.ae",
      status: "active" as const,
      notes: "Primary domain registrar",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      providerCode: "SP-0003",
      providerName: "Google Workspace",
      category: "email" as const,
      websiteUrl: "https://workspace.google.com",
      loginUrl: "https://admin.google.com",
      accountEmail: "admin@supportmena.ae",
      status: "active" as const,
      notes: "Email hosting for multiple clients",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      providerCode: "SP-0004",
      providerName: "Cloudflare",
      category: "ssl" as const,
      websiteUrl: "https://www.cloudflare.com",
      loginUrl: "https://dash.cloudflare.com",
      accountEmail: "ssl@supportmena.ae",
      status: "active" as const,
      notes: "SSL and CDN provider",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  const providerRefs = providers.map(() =>
    doc(collection(db, COLLECTIONS.PROVIDERS))
  );
  providers.forEach((p, i) => batch.set(providerRefs[i], p));

  await batch.commit();

  // Create services (need client/provider IDs from above)
  const today = new Date();
  const services = [
    {
      clientId: clientRefs[0].id,
      clientName: "ERC International",
      providerId: providerRefs[0].id,
      providerName: "Hostinger",
      serviceName: "Website Hosting",
      serviceCategory: "website_hosting" as const,
      domainReference: "ercinternational.ae",
      actualRenewalDate: "2026-07-31",
      billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
      reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
      renewalCycle: "yearly" as const,
      providerCost: 120,
      currency: "AED",
      assignedUserId: userId,
      billingStatus: "not_due" as const,
      serviceStatus: "active" as const,
      notes: "Annual website hosting for ERC International",
    },
    {
      clientId: clientRefs[0].id,
      clientName: "ERC International",
      providerId: providerRefs[1].id,
      providerName: "GoDaddy",
      serviceName: "Domain Registration",
      serviceCategory: "domain" as const,
      domainReference: "ercinternational.ae",
      actualRenewalDate: "2026-09-15",
      billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
      reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
      renewalCycle: "yearly" as const,
      providerCost: 80,
      currency: "AED",
      assignedUserId: userId,
      billingStatus: "not_due" as const,
      serviceStatus: "active" as const,
      notes: "Domain registration",
    },
    {
      clientId: clientRefs[1].id,
      clientName: "Gulf Tech Solutions",
      providerId: providerRefs[2].id,
      providerName: "Google Workspace",
      serviceName: "Email Hosting (Google Workspace)",
      serviceCategory: "email_hosting" as const,
      domainReference: "gulftech.ae",
      actualRenewalDate: "2026-08-20",
      billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
      reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
      renewalCycle: "yearly" as const,
      providerCost: 600,
      currency: "AED",
      assignedUserId: userId,
      billingStatus: "not_due" as const,
      serviceStatus: "active" as const,
      notes: "20 user Google Workspace plan",
    },
    {
      clientId: clientRefs[2].id,
      clientName: "Noor Medical Group",
      providerId: providerRefs[3].id,
      providerName: "Cloudflare",
      serviceName: "SSL Certificate",
      serviceCategory: "ssl" as const,
      domainReference: "noormedical.ae",
      actualRenewalDate: "2026-07-10",
      billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
      reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
      renewalCycle: "yearly" as const,
      providerCost: 200,
      currency: "AED",
      assignedUserId: userId,
      billingStatus: "not_due" as const,
      serviceStatus: "active" as const,
      notes: "SSL certificate renewal",
    },
  ];

  for (const svc of services) {
    await createClientService(svc, userId);
  }
}
