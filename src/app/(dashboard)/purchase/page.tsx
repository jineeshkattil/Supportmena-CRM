"use client";

import { useState, useEffect } from "react";
import { Plus, ShoppingCart, Eye } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PurchaseRequest } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

export default function PurchasePage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "purchaseRequests"), orderBy("createdAt", "desc")));
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PurchaseRequest));
      } catch {
        setRequests([
          { id: "1", requestNumber: "PR-001", requestedByName: "Ahmed Al Rashid", projectName: "CCTV - Al Noor HQ", items: [{ id: "1", itemName: "Cat6 Cable Box", quantity: 5 }], priority: "high", reason: "Needed for project", status: "pending", createdAt: null as never, updatedAt: null as never, requestedBy: "1" },
          { id: "2", requestNumber: "PR-002", requestedByName: "Mohammed Khalil", projectName: "Network Setup - Gulf Mart", items: [{ id: "2", itemName: "TP-Link Switch 24 Port", quantity: 2 }], priority: "medium", reason: "Project requirement", status: "approved", createdAt: null as never, updatedAt: null as never, requestedBy: "3" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const columns: ColumnDef<PurchaseRequest>[] = [
    { accessorKey: "requestNumber", header: "PR #", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.requestNumber}</span>
    )},
    { accessorKey: "requestedByName", header: "Requested By" },
    { accessorKey: "projectName", header: "Project", cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.projectName || "—"}</span>
    )},
    { id: "items", header: "Items", cell: ({ row }) => (
      <span className="text-sm">{row.original.items?.length || 0} item(s)</span>
    )},
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PRIORITY_COLORS[row.original.priority]}`}>
        {row.original.priority}
      </span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[row.original.status]}`}>
        {row.original.status}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
        <Link href={`/purchase/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
      </Button>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Purchase Management</h2>
          <p className="text-sm text-muted-foreground">{requests.length} purchase requests</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/purchase/new">
            <Plus className="h-4 w-4 mr-2" />New Request
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={requests}
        searchKey="requestedByName"
        searchPlaceholder="Search requests..."
        loading={loading}
        emptyMessage="No purchase requests found."
        emptyIcon={<ShoppingCart className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
