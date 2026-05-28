"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  User,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Building2,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";

const DEMO: Project = {
  id: "demo",
  projectCode: "PRJ-001",
  projectName: "CCTV Installation - Al Noor HQ",
  projectType: "cctv",
  clientId: "1",
  clientName: "Al Noor Technologies",
  siteAddress: "Business Bay, Dubai",
  contactPerson: "Mr. Khalid Al Noor",
  projectManagerId: "3",
  projectManagerName: "Mohammed Khalil",
  assignedTechnicians: ["1", "2", "4"],
  startDate: "2024-07-01",
  expectedEndDate: "2024-07-20",
  quotationId: "1",
  invoiceId: "1",
  projectValue: 45000,
  status: "in_progress",
  notes: "8 dome cameras and 1 NVR. Site survey completed.",
  materialCost: 25000,
  labourCost: 8000,
  expenses: 1200,
  createdBy: "system",
  createdAt: null as never,
  updatedAt: null as never,
};

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as Project);
        } else {
          setProject({ ...DEMO, id });
        }
      } catch {
        setProject({ ...DEMO, id });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  const statusInfo =
    PROJECT_STATUSES.find((s) => s.value === project.status) ||
    PROJECT_STATUSES[0];
  const typeLabel =
    PROJECT_TYPES.find((t) => t.value === project.projectType)?.label ||
    project.projectType;

  const projectValue = project.projectValue || 0;
  const materialCost = project.materialCost || 0;
  const labourCost = project.labourCost || 0;
  const expenses = project.expenses || 0;
  const totalCost = materialCost + labourCost + expenses;
  const profit = projectValue - totalCost;
  const profitMargin = projectValue > 0 ? (profit / projectValue) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{project.projectName}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusInfo.color}`}
              >
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {project.projectCode} · {typeLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Client
            </div>
            <p className="font-semibold">{project.clientName}</p>
            <Link
              href={`/crm/${project.clientId}`}
              className="text-xs text-primary hover:underline"
            >
              View client
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Timeline
            </div>
            <p className="font-semibold">{formatDate(project.startDate)}</p>
            <p className="text-xs text-muted-foreground">
              {project.actualEndDate
                ? `Completed ${formatDate(project.actualEndDate)}`
                : `Expected ${formatDate(project.expectedEndDate)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" /> Project Value
            </div>
            <p className="text-xl font-bold">{formatCurrency(projectValue)}</p>
            {profit !== 0 && (
              <p
                className={`text-xs font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {profitMargin.toFixed(1)}% margin
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {project.siteAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Site Address</p>
                  <p>{project.siteAddress}</p>
                </div>
              </div>
            )}
            {project.contactPerson && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p>{project.contactPerson}</p>
                </div>
              </div>
            )}
            {project.projectManagerName && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Project Manager
                  </p>
                  <p>{project.projectManagerName}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Assigned Technicians
                </p>
                <p>
                  {project.assignedTechnicians.length}{" "}
                  {project.assignedTechnicians.length === 1
                    ? "technician"
                    : "technicians"}
                </p>
              </div>
            </div>
            {project.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-line">{project.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project Value</span>
              <span className="font-medium">{formatCurrency(projectValue)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Material Cost</span>
              <span>{formatCurrency(materialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labour Cost</span>
              <span>{formatCurrency(labourCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses</span>
              <span>{formatCurrency(expenses)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total Cost</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            <Separator />
            <div
              className={`rounded-lg p-3 ${profit >= 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}
            >
              <div className="flex justify-between">
                <span
                  className={`text-sm font-medium ${profit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {profit >= 0 ? "Estimated Profit" : "Loss"}
                </span>
                <span
                  className={`font-bold ${profit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {formatCurrency(profit)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span
                  className={`text-xs ${profit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  Margin
                </span>
                <span
                  className={`text-xs font-semibold ${profit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(project.quotationId || project.invoiceId) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Related Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.quotationId && (
                <Link
                  href={`/quotations/${project.quotationId}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Quotation</p>
                    <p className="text-sm font-medium">View quotation</p>
                  </div>
                </Link>
              )}
              {project.invoiceId && (
                <Link
                  href={`/invoices/${project.invoiceId}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="text-sm font-medium">View invoice</p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
