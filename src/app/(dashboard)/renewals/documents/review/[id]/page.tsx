"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Copy, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateExtractionDraft,
  updateImportedDocument,
  updateClientService,
  createClientService,
  getRenewalClients,
  getServiceProviders,
  getClientServices,
  COLLECTIONS,
} from "@/services/renewal-firestore";
import { SERVICE_CATEGORY_LABELS, calculateDates, DEFAULT_BILLING_BUFFER_DAYS, DEFAULT_REMINDER_LEAD_DAYS } from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { ExtractionDraft, ImportedDocument, RenewalClient, ServiceProvider, ServiceCategory, ClientService } from "@/types/renewal";

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "domain", "website_hosting", "email_hosting", "ssl", "vps_server", "cloud", "software", "maintenance", "other",
];

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [draft, setDraft] = useState<ExtractionDraft | null>(null);
  const [document, setDocument] = useState<ImportedDocument | null>(null);
  const [clients, setClients] = useState<RenewalClient[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable extraction fields
  const [form, setForm] = useState({
    extractedClientName: "",
    extractedProviderName: "",
    extractedServiceName: "",
    extractedServiceCategory: "" as ServiceCategory | "",
    extractedDomainReference: "",
    extractedRenewalDate: "",
    extractedAmount: "",
    extractedCurrency: "AED",
    extractedInvoiceReference: "",
    reviewNotes: "",
    selectedServiceId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        // Load draft - id could be documentId or draftId
        let draftData: ExtractionDraft | null = null;
        
        // Try to find by documentId first
        const snap = await getDocs(query(
          collection(db, COLLECTIONS.EXTRACTIONS),
          where("documentId", "==", id)
        ));
        if (!snap.empty) {
          draftData = { id: snap.docs[0].id, ...snap.docs[0].data() } as ExtractionDraft;
        } else {
          // Try direct id
          const directSnap = await getDoc(doc(db, COLLECTIONS.EXTRACTIONS, id));
          if (directSnap.exists()) {
            draftData = { id: directSnap.id, ...directSnap.data() } as ExtractionDraft;
          }
        }

        if (!draftData) { toast.error("Extraction draft not found"); router.push("/renewals/documents"); return; }
        setDraft(draftData);

        // Load the linked document
        if (draftData.documentId) {
          const docSnap = await getDoc(doc(db, COLLECTIONS.DOCUMENTS, draftData.documentId));
          if (docSnap.exists()) setDocument({ id: docSnap.id, ...docSnap.data() } as ImportedDocument);
        }

        const [c, p, s] = await Promise.all([getRenewalClients(), getServiceProviders(), getClientServices()]);
        setClients(c.filter(x => x.status === "active"));
        setProviders(p.filter(x => x.status === "active"));
        setServices(s);

        setForm({
          extractedClientName: draftData.extractedClientName || "",
          extractedProviderName: draftData.extractedProviderName || "",
          extractedServiceName: draftData.extractedServiceName || "",
          extractedServiceCategory: draftData.extractedServiceCategory || "",
          extractedDomainReference: draftData.extractedDomainReference || "",
          extractedRenewalDate: draftData.extractedRenewalDate || "",
          extractedAmount: draftData.extractedAmount?.toString() || "",
          extractedCurrency: draftData.extractedCurrency || "AED",
          extractedInvoiceReference: draftData.extractedInvoiceReference || "",
          reviewNotes: "",
          selectedServiceId: "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load review data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleApproveNew = async () => {
    if (!draft || !profile?.id) return;
    if (!form.extractedRenewalDate) { toast.error("Renewal date is required"); return; }

    const client = clients.find(c => c.companyName.toLowerCase().includes(form.extractedClientName.toLowerCase()));
    const provider = providers.find(p => p.providerName.toLowerCase().includes(form.extractedProviderName.toLowerCase()));

    if (!client) { toast.error("No matching client found. Please create the client first."); return; }
    if (!provider) { toast.error("No matching provider found. Please create the provider first."); return; }

    setSaving(true);
    try {
      const serviceId = await createClientService({
        clientId: client.id,
        clientName: client.companyName,
        providerId: provider.id,
        providerName: provider.providerName,
        serviceName: form.extractedServiceName || "Service from document",
        serviceCategory: (form.extractedServiceCategory as ServiceCategory) || "other",
        domainReference: form.extractedDomainReference || undefined,
        actualRenewalDate: form.extractedRenewalDate,
        billingBufferDays: DEFAULT_BILLING_BUFFER_DAYS,
        reminderLeadDays: DEFAULT_REMINDER_LEAD_DAYS,
        renewalCycle: "yearly",
        providerCost: form.extractedAmount ? parseFloat(form.extractedAmount) : undefined,
        currency: form.extractedCurrency,
        billingStatus: "not_due",
        serviceStatus: "active",
        notes: `Created from document import. Invoice ref: ${form.extractedInvoiceReference || "N/A"}`,
      }, profile.id);

      await updateExtractionDraft(draft.id, {
        status: "approved",
        extractedClientName: form.extractedClientName,
        extractedProviderName: form.extractedProviderName,
        extractedServiceName: form.extractedServiceName,
        extractedServiceCategory: form.extractedServiceCategory as ServiceCategory || undefined,
        extractedDomainReference: form.extractedDomainReference || undefined,
        extractedRenewalDate: form.extractedRenewalDate,
        extractedAmount: form.extractedAmount ? parseFloat(form.extractedAmount) : undefined,
        extractedCurrency: form.extractedCurrency,
        reviewedBy: profile.id,
        reviewNotes: form.reviewNotes,
      });

      if (document) {
        await updateImportedDocument(document.id, {
          processingStatus: "approved",
          linkedClientId: client.id,
          linkedClientName: client.companyName,
          linkedServiceId: serviceId,
        });
      }

      toast.success("Approved! New service record created.");
      router.push("/renewals/services");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create service record");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveUpdate = async () => {
    if (!draft || !form.selectedServiceId || !profile?.id) { toast.error("Select a service to update"); return; }
    if (!form.extractedRenewalDate) { toast.error("Renewal date is required"); return; }

    setSaving(true);
    try {
      const { billingDueDate, internalReminderDate } = calculateDates(
        form.extractedRenewalDate, DEFAULT_BILLING_BUFFER_DAYS, DEFAULT_REMINDER_LEAD_DAYS
      );

      await updateClientService(form.selectedServiceId, {
        actualRenewalDate: form.extractedRenewalDate,
        billingDueDate,
        internalReminderDate,
        billingStatus: "not_due",
      });

      await updateExtractionDraft(draft.id, {
        status: "approved",
        reviewedBy: profile.id,
        reviewNotes: form.reviewNotes,
      });

      toast.success("Service updated with new renewal date.");
      router.push(`/renewals/services/${form.selectedServiceId}`);
    } catch {
      toast.error("Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateExtractionDraft(draft.id, { status: "rejected", reviewNotes: form.reviewNotes });
      if (document) await updateImportedDocument(document.id, { processingStatus: "rejected" });
      toast.success("Extraction rejected");
      router.push("/renewals/documents");
    } catch { toast.error("Failed to reject"); } finally { setSaving(false); }
  };

  const handleDuplicate = async () => {
    if (!draft) return;
    await updateExtractionDraft(draft.id, { status: "duplicate" });
    toast.success("Marked as duplicate");
    router.push("/renewals/documents");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!draft) return null;

  // confidenceScore is stored as 0-1 float; convert to 0-100 for display
  const confidence = Math.round((draft.confidenceScore || 0) * 100);
  const confidenceColor = confidence >= 75 ? "text-green-600" : confidence >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/renewals/documents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Review Extraction</h2>
          <p className="text-sm text-muted-foreground">{document?.originalFileName || "Document Review"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Document info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Source Document</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">File Name</p>
                <p className="text-sm font-medium mt-0.5">{document?.originalFileName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Source</p>
                <p className="text-sm mt-0.5 capitalize">{document?.sourceType?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Uploaded</p>
                <p className="text-sm mt-0.5">{formatDate(document?.createdAt)}</p>
              </div>
              {document?.fileUrl && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">View Original PDF</a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Confidence Score</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${confidenceColor}`}>{confidence}%</span>
                <span className="text-sm text-muted-foreground mb-1">confidence</span>
              </div>
              <Progress value={confidence} className="h-2" />
              <p className={`text-xs ${confidenceColor}`}>
                {confidence >= 75 ? "High confidence — data looks reliable"
                  : confidence >= 50 ? "Medium confidence — review carefully"
                  : "Low confidence — manual verification needed"}
              </p>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleApproveNew} disabled={saving} className="w-full" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-300" />Approve & Create New Service
              </Button>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Approve & update existing:</p>
                <Select value={form.selectedServiceId} onValueChange={(v) => setForm((f) => ({ ...f, selectedServiceId: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select service..." /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.clientName} — {s.serviceName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleApproveUpdate} disabled={saving || !form.selectedServiceId} variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />Update Existing Service
                </Button>
              </div>
              <Button onClick={handleDuplicate} disabled={saving} variant="outline" size="sm" className="w-full">
                <Copy className="h-3.5 w-3.5 mr-2" />Mark as Duplicate
              </Button>
              <Button onClick={handleReject} disabled={saving} variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
                <XCircle className="h-3.5 w-3.5 mr-2" />Reject
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Editable extraction form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Review & Edit Extracted Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input
                    value={form.extractedClientName}
                    onChange={(e) => setForm((f) => ({ ...f, extractedClientName: e.target.value }))}
                    placeholder="Client company name"
                  />
                  {clients.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Known clients: {clients.map(c => c.companyName).join(", ")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Provider Name</Label>
                  <Input
                    value={form.extractedProviderName}
                    onChange={(e) => setForm((f) => ({ ...f, extractedProviderName: e.target.value }))}
                    placeholder="Service provider name"
                  />
                  {providers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Known: {providers.map(p => p.providerName).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    value={form.extractedServiceName}
                    onChange={(e) => setForm((f) => ({ ...f, extractedServiceName: e.target.value }))}
                    placeholder="e.g. Website Hosting"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <Select
                    value={form.extractedServiceCategory}
                    onValueChange={(v) => setForm((f) => ({ ...f, extractedServiceCategory: v as ServiceCategory }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain / Reference</Label>
                  <Input
                    value={form.extractedDomainReference}
                    onChange={(e) => setForm((f) => ({ ...f, extractedDomainReference: e.target.value }))}
                    placeholder="e.g. example.com or ACC-12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Renewal Date *</Label>
                  <Input
                    type="date"
                    value={form.extractedRenewalDate}
                    onChange={(e) => setForm((f) => ({ ...f, extractedRenewalDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={form.extractedAmount}
                    onChange={(e) => setForm((f) => ({ ...f, extractedAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={form.extractedCurrency}
                    onChange={(e) => setForm((f) => ({ ...f, extractedCurrency: e.target.value }))}
                    placeholder="AED"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Reference</Label>
                  <Input
                    value={form.extractedInvoiceReference}
                    onChange={(e) => setForm((f) => ({ ...f, extractedInvoiceReference: e.target.value }))}
                    placeholder="INV-0001"
                  />
                </div>
              </div>
              {form.extractedRenewalDate && (
                <div className="rounded-lg border bg-blue-50/50 p-3 text-xs text-blue-700 space-y-1">
                  <p className="font-medium">Calculated Dates (using default settings):</p>
                  {(() => {
                    const { billingDueDate, internalReminderDate } = calculateDates(form.extractedRenewalDate, DEFAULT_BILLING_BUFFER_DAYS, DEFAULT_REMINDER_LEAD_DAYS);
                    return (
                      <>
                        <p>Billing Due Date: <strong>{billingDueDate}</strong> (renewal − {DEFAULT_BILLING_BUFFER_DAYS} days)</p>
                        <p>Internal Reminder: <strong>{internalReminderDate}</strong> (billing − {DEFAULT_REMINDER_LEAD_DAYS} days)</p>
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  rows={2}
                  value={form.reviewNotes}
                  onChange={(e) => setForm((f) => ({ ...f, reviewNotes: e.target.value }))}
                  placeholder="Optional notes about this review..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
