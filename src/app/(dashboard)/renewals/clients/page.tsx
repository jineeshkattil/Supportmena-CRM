"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Eye, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { getRenewalClients, updateRenewalClient } from "@/services/renewal-firestore";
import { formatDate } from "@/lib/utils";
import type { RenewalClient } from "@/types/renewal";

export default function RenewalClientsPage() {
  const [clients, setClients] = useState<RenewalClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getRenewalClients();
      setClients(data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleToggleStatus = async (client: RenewalClient) => {
    const newStatus = client.status === "active" ? "inactive" : "active";
    try {
      await updateRenewalClient(client.id, { status: newStatus });
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Client ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update client status");
    }
  };

  const columns: ColumnDef<RenewalClient>[] = [
    {
      accessorKey: "clientCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.clientCode}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{row.original.companyName}</p>
            {row.original.contactPerson && (
              <p className="text-xs text-muted-foreground truncate">
                {row.original.contactPerson}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contactEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.contactEmail || "—"}
        </span>
      ),
    },
    {
      accessorKey: "contactPhone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.contactPhone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "success" : "secondary"}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/renewals/clients/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/renewals/clients/${row.original.id}?edit=true`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={
              row.original.status === "active"
                ? "Deactivate client"
                : "Activate client"
            }
            onClick={() => handleToggleStatus(row.original)}
          >
            {row.original.status === "active" ? (
              <ToggleRight className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const inactiveClients = clients.filter((c) => c.status === "inactive").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewal Clients</h2>
          <p className="text-sm text-muted-foreground">
            {totalClients} client{totalClients !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/renewals/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Clients",
            value: totalClients,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active",
            value: activeClients,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Inactive",
            value: inactiveClients,
            color: "text-gray-500",
            bg: "bg-gray-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3 flex items-center gap-3 bg-card"
          >
            <div className={`rounded-lg p-1.5 ${s.bg}`}>
              <Building2 className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={clients}
        searchKey="companyName"
        searchPlaceholder="Search clients..."
        loading={loading}
        emptyMessage="No renewal clients found. Add your first client."
        emptyIcon={<Building2 className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
