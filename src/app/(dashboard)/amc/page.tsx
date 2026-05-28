"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Eye, AlertTriangle } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AMCContract } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate, getDaysUntilExpiry } from "@/lib/utils";
import Link from "next/link";

export default function AMCPage() {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "amcContracts"), orderBy("createdAt", "desc")));
        setContracts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AMCContract));
      } catch {
        setContracts([
          { id: "1", contractNumber: "AMC-0001", clientId: "1", clientName: "Skyline Properties", siteAddress: "Downtown Tower, Dubai", contractStartDate: "2024-01-01", contractEndDate: "2024-12-31", contractValue: 36000, serviceFrequency: "monthly" as const, assignedTechnicianName: "Ahmed Al Rashid", status: "active" as const, createdAt: null as never, updatedAt: null as never },
          { id: "2", contractNumber: "AMC-0002", clientId: "2", clientName: "Al Noor Technologies", siteAddress: "Business Bay, Dubai", contractStartDate: "2024-03-01", contractEndDate: "2025-02-28", contractValue: 24000, serviceFrequency: "quarterly" as const, status: "active" as const, createdAt: null as never, updatedAt: null as never },
          { id: "3", contractNumber: "AMC-0003", clientId: "3", clientName: "Gulf Smart Systems", siteAddress: "Al Quoz, Dubai", contractStartDate: "2023-08-01", contractEndDate: "2024-07-31", contractValue: 18000, serviceFrequency: "bi_annual" as const, status: "active" as const, createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
    pending_renewal: "bg-yellow-100 text-yellow-700",
  };

  const FREQ_LABELS: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    bi_annual: "Bi-Annual",
    annual: "Annual",
  };

  const columns: ColumnDef<AMCContract>[] = [
    { accessorKey: "contractNumber", header: "Contract #", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.contractNumber}</span>
    )},
    { accessorKey: "clientName", header: "Client", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.clientName}</p>
        <p className="text-xs text-muted-foreground">{row.original.siteAddress}</p>
      </div>
    )},
    { accessorKey: "contractValue", header: "Value", cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.contractValue)}</span>
    )},
    { accessorKey: "serviceFrequency", header: "Frequency", cell: ({ row }) => (
      <span className="text-sm">{FREQ_LABELS[row.original.serviceFrequency]}</span>
    )},
    { accessorKey: "contractEndDate", header: "Expiry", cell: ({ row }) => {
      const days = getDaysUntilExpiry(row.original.contractEndDate);
      const isExpiring = days !== null && days <= 90;
      return (
        <div className="flex items-center gap-1.5">
          {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
          <div>
            <p className={`text-xs ${isExpiring ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
              {formatDate(row.original.contractEndDate)}
            </p>
            {days !== null && days <= 90 && (
              <p className="text-[10px] text-orange-500">{days} days left</p>
            )}
          </div>
        </div>
      );
    }},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[row.original.status] || "bg-gray-100 text-gray-700"}`}>
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
        <Link href={`/amc/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
      </Button>
    )},
  ];

  const expiringCount = contracts.filter((c) => {
    const days = getDaysUntilExpiry(c.contractEndDate);
    return days !== null && days <= 90 && c.status === "active";
  }).length;

  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AMC Management</h2>
          <p className="text-sm text-muted-foreground">{contracts.length} active contracts</p>
        </div>
        <Button asChild>
          <Link href="/amc/new">
            <Plus className="h-4 w-4 mr-2" />New Contract
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Contracts", value: contracts.filter((c) => c.status === "active").length.toString() },
          { label: "Total Value", value: formatCurrency(totalValue) },
          { label: "Expiring Soon", value: expiringCount.toString(), alert: expiringCount > 0 },
          { label: "Expired", value: contracts.filter((c) => c.status === "expired").length.toString() },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 bg-card ${s.alert ? "border-orange-200" : ""}`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.alert ? "text-orange-600" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        searchKey="clientName"
        searchPlaceholder="Search by client..."
        loading={loading}
        emptyMessage="No AMC contracts found."
        emptyIcon={<RefreshCw className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
