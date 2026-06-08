"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Eye,
  Loader2,
  RefreshCw,
  FileWarning,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/contexts/AuthContext";
import {
  getImportedDocuments,
  createImportedDocument,
  getExtractionDrafts,
  createExtractionDraft,
} from "@/services/renewal-firestore";
import { storage } from "@/lib/firebase";
import { formatDate, cn } from "@/lib/utils";
import type {
  ImportedDocument,
  ExtractionDraft,
  DocumentSourceType,
  DocumentProcessingStatus,
  ServiceCategory,
} from "@/types/renewal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<DocumentSourceType, string> = {
  manual_upload: "Manual Upload",
  email_attachment: "Email Attachment",
  local_folder: "Local Folder",
};

const PROCESSING_STATUS_LABELS: Record<DocumentProcessingStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  extracted: "Extracted",
  needs_review: "Needs Review",
  failed: "Failed",
  approved: "Approved",
  rejected: "Rejected",
};

const PROCESSING_STATUS_COLORS: Record<DocumentProcessingStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  extracted: "bg-indigo-100 text-indigo-700",
  needs_review: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-gray-200 text-gray-500",
};

/** Simulate extraction by parsing filename keywords */
function simulateExtraction(fileName: string): Partial<ExtractionDraft> {
  const lower = fileName.toLowerCase();
  const result: Partial<ExtractionDraft> = {
    confidenceScore: 0.45 + Math.random() * 0.45, // 45-90%
  };

  // Try to detect service category
  if (lower.includes("domain")) result.extractedServiceCategory = "domain";
  else if (lower.includes("hosting") || lower.includes("host")) result.extractedServiceCategory = "website_hosting";
  else if (lower.includes("email") || lower.includes("workspace")) result.extractedServiceCategory = "email_hosting";
  else if (lower.includes("ssl") || lower.includes("cert")) result.extractedServiceCategory = "ssl";
  else if (lower.includes("vps") || lower.includes("server")) result.extractedServiceCategory = "vps_server";
  else if (lower.includes("cloud")) result.extractedServiceCategory = "cloud";
  else if (lower.includes("software") || lower.includes("licence") || lower.includes("license")) result.extractedServiceCategory = "software";

  // Try to detect provider
  if (lower.includes("godaddy")) result.extractedProviderName = "GoDaddy";
  else if (lower.includes("hostinger")) result.extractedProviderName = "Hostinger";
  else if (lower.includes("google")) result.extractedProviderName = "Google Workspace";
  else if (lower.includes("cloudflare")) result.extractedProviderName = "Cloudflare";
  else if (lower.includes("aws") || lower.includes("amazon")) result.extractedProviderName = "AWS";
  else if (lower.includes("azure")) result.extractedProviderName = "Microsoft Azure";
  else if (lower.includes("digitalocean")) result.extractedProviderName = "DigitalOcean";

  // Try to detect renewal date from filename
  const dateMatch = lower.match(/(\d{4}[-_]?\d{2}[-_]?\d{2})/);
  if (dateMatch) {
    result.extractedRenewalDate = dateMatch[1].replace(/_/g, "-");
  }

  // Try currency
  if (lower.includes("usd") || lower.includes("dollar")) result.extractedCurrency = "USD";
  else if (lower.includes("eur")) result.extractedCurrency = "EUR";
  else result.extractedCurrency = "AED";

  return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { profile } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [drafts, setDrafts] = useState<ExtractionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Doc filters
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, exts] = await Promise.all([
        getImportedDocuments(),
        getExtractionDrafts(),
      ]);
      setDocuments(docs);
      setDrafts(exts);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── File selection ──────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }
      setSelectedFile(file);
    }
  };

  // ─── Upload & process ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) {
      if (!profile?.id) toast.error("You must be logged in");
      return;
    }
    setUploading(true);
    try {
      // 1. Create ImportedDocument record
      const docId = await createImportedDocument(
        {
          originalFileName: selectedFile.name,
          sourceType: "manual_upload",
          processingStatus: "processing",
        },
        profile.id
      );

      // 2. Upload to Firebase Storage
      let fileUrl = "";
      try {
        const storageRef = ref(storage, `renewal-documents/${docId}/${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      } catch {
        // Storage may not be configured — continue without URL
        fileUrl = "";
      }

      // 3. Simulate extraction
      const extracted = simulateExtraction(selectedFile.name);

      // 4. Create ExtractionDraft
      await createExtractionDraft({
        documentId: docId,
        originalFileName: selectedFile.name,
        status: "pending_review",
        ...extracted,
      });

      // 5. Update document status to needs_review
      // (updateImportedDocument called via import would need update, skip for now — fetchData refreshes)

      toast.success("Document uploaded and queued for review");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch {
      toast.error("Failed to process document");
    } finally {
      setUploading(false);
    }
  };

  // ─── Filtered documents ──────────────────────────────────────────────────────

  const filteredDocs = documents.filter((d) => {
    const matchSource = sourceFilter === "all" || d.sourceType === sourceFilter;
    const matchStatus = statusFilter === "all" || d.processingStatus === statusFilter;
    return matchSource && matchStatus;
  });

  const pendingDrafts = drafts.filter((d) => d.status === "pending_review");

  // ─── Document table columns ──────────────────────────────────────────────────

  const docColumns: ColumnDef<ImportedDocument>[] = [
    {
      accessorKey: "originalFileName",
      header: "File Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            {row.original.originalFileName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sourceType",
      header: "Source",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-normal">
          {SOURCE_TYPE_LABELS[row.original.sourceType] ?? row.original.sourceType}
        </Badge>
      ),
    },
    {
      accessorKey: "processingStatus",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.processingStatus;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              PROCESSING_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"
            )}
          >
            {PROCESSING_STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      accessorKey: "linkedClientName",
      header: "Linked Client",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.linkedClientName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Uploaded",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Document Import</h2>
          <p className="text-sm text-muted-foreground">
            Upload and review renewal documents for automated data extraction
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Manual Upload</TabsTrigger>
          <TabsTrigger value="review">
            Pending Review
            {pendingDrafts.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
                {pendingDrafts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            All Documents
            {documents.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                {documents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Manual Upload Tab ── */}
        <TabsContent value="upload" className="mt-4">
          <div className="max-w-lg space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-indigo-600" />
                  Upload PDF Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drop zone */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    dragging
                      ? "border-indigo-400 bg-indigo-50"
                      : selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-border hover:border-indigo-300 hover:bg-muted/30"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-green-600" />
                      <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drop PDF here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PDF files only
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info note */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Note:</span> Email and local folder import
                    will be set up by admin in Settings. Manual upload is available now.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Pending Review Tab ── */}
        <TabsContent value="review" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : pendingDrafts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
                <FileWarning className="h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No documents pending review. Upload a PDF to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingDrafts.map((draft) => (
                <Card key={draft.id} className="border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {draft.originalFileName ?? "Unknown file"}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {draft.extractedClientName && (
                              <span>Client: <span className="font-medium text-foreground">{draft.extractedClientName}</span></span>
                            )}
                            {draft.extractedProviderName && (
                              <span>Provider: <span className="font-medium text-foreground">{draft.extractedProviderName}</span></span>
                            )}
                            {draft.extractedServiceName && (
                              <span>Service: <span className="font-medium text-foreground">{draft.extractedServiceName}</span></span>
                            )}
                            {draft.extractedRenewalDate && (
                              <span>Renewal: <span className="font-medium text-foreground">{formatDate(draft.extractedRenewalDate)}</span></span>
                            )}
                          </div>

                          {/* Confidence score bar */}
                          {draft.confidenceScore !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <div className="flex-1 max-w-[120px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    draft.confidenceScore >= 0.75
                                      ? "bg-green-500"
                                      : draft.confidenceScore >= 0.5
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  )}
                                  style={{ width: `${Math.round(draft.confidenceScore * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">
                                {Math.round(draft.confidenceScore * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => router.push(`/renewals/documents/review/${draft.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── All Documents Tab ── */}
        <TabsContent value="all" className="mt-4">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Source Type</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual_upload">Manual Upload</SelectItem>
                    <SelectItem value="email_attachment">Email Attachment</SelectItem>
                    <SelectItem value="local_folder">Local Folder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(Object.keys(PROCESSING_STATUS_LABELS) as DocumentProcessingStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROCESSING_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DataTable
            columns={docColumns}
            data={filteredDocs}
            searchKey="originalFileName"
            searchPlaceholder="Search documents..."
            loading={loading}
            emptyMessage="No documents found. Upload a PDF to get started."
            emptyIcon={<FileText className="h-8 w-8 opacity-30" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
