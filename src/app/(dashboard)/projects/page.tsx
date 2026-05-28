"use client";

import { useState, useEffect } from "react";
import { Plus, Briefcase, Eye, Pencil, MapPin } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import Link from "next/link";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project));
      } catch {
        setProjects([
          { id: "1", projectCode: "PRJ-001", projectName: "CCTV Installation - Al Noor HQ", projectType: "cctv" as const, clientId: "1", clientName: "Al Noor Technologies", siteAddress: "Business Bay, Dubai", projectManagerName: "Mohammed Khalil", status: "in_progress" as const, startDate: "2024-07-01", expectedEndDate: "2024-07-20", projectValue: 45000, assignedTechnicians: [], createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "2", projectCode: "PRJ-002", projectName: "Network Setup - Gulf Mart", projectType: "networking" as const, clientId: "2", clientName: "Gulf Smart Systems", siteAddress: "Al Quoz, Dubai", projectManagerName: "Mohammed Khalil", status: "scheduled" as const, startDate: "2024-07-15", expectedEndDate: "2024-07-25", projectValue: 78500, assignedTechnicians: [], createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "3", projectCode: "PRJ-003", projectName: "AMC - Skyline Tower", projectType: "amc" as const, clientId: "3", clientName: "Skyline Properties", siteAddress: "Downtown, Dubai", status: "completed" as const, startDate: "2024-06-01", actualEndDate: "2024-06-28", projectValue: 25000, assignedTechnicians: [], createdBy: "", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const getStatusStyle = (status: string) => PROJECT_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";
  const getTypeLabel = (type: string) => PROJECT_TYPES.find((t) => t.value === type)?.label || type;

  const columns: ColumnDef<Project>[] = [
    { accessorKey: "projectCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.projectCode}</span>
    )},
    { accessorKey: "projectName", header: "Project", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.projectName}</p>
        <p className="text-xs text-muted-foreground">{getTypeLabel(row.original.projectType)}</p>
      </div>
    )},
    { accessorKey: "clientName", header: "Client" },
    { accessorKey: "siteAddress", header: "Site", cell: ({ row }) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {row.original.siteAddress && <><MapPin className="h-3 w-3" />{row.original.siteAddress}</>}
      </div>
    )},
    { accessorKey: "projectValue", header: "Value", cell: ({ row }) => (
      <span className="font-semibold text-sm">{formatCurrency(row.original.projectValue)}</span>
    )},
    { accessorKey: "expectedEndDate", header: "End Date", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.actualEndDate || row.original.expectedEndDate)}
      </span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(row.original.status)}`}>
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/projects/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/projects/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />New Project
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {PROJECT_STATUSES.slice(0, 4).map((s) => (
          <div key={s.value} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{projects.filter((p) => p.status === s.value).length}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchKey="projectName"
        searchPlaceholder="Search projects..."
        loading={loading}
        emptyMessage="No projects found."
        emptyIcon={<Briefcase className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
