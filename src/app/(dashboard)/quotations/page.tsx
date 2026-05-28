"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Eye, Pencil, Send, Copy } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Quotation } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTATION_STATUSES } from "@/lib/constants";
import Link from "next/link";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "quotations"), orderBy("createdAt", "desc")));
        setQuotations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Quotation));
      } catch {
        setQuotations([
          { id: "1", quotationNumber: "QT-0001", clientId: "1", clientName: "Al Noor Technologies", quotationDate: "2024-07-01", validUntil: "2024-07-31", grandTotal: 45000, status: "sent" as const, items: [], resourceItems: [], subtotal: 42857, materialTotal: 35000, resourceCostTotal: 7857, discount: 0, vatAmount: 2143, createdBy: "", estimatedProfit: 8000, marginPercentage: 18.7, createdAt: null as never, updatedAt: null as never },
          { id: "2", quotationNumber: "QT-0002", clientId: "2", clientName: "Gulf Smart Systems", quotationDate: "2024-07-05", validUntil: "2024-08-04", grandTotal: 78500, status: "approved" as const, items: [], resourceItems: [], subtotal: 74762, materialTotal: 60000, resourceCostTotal: 14762, discount: 0, vatAmount: 3738, createdBy: "", estimatedProfit: 15000, marginPercentage: 19.1, createdAt: null as never, updatedAt: null as never },
          { id: "3", quotationNumber: "QT-0003", clientId: "3", clientName: "Dubai Mall Management", quotationDate: "2024-07-10", validUntil: "2024-08-09", grandTotal: 125000, status: "draft" as const, items: [], resourceItems: [], subtotal: 119048, materialTotal: 95000, resourceCostTotal: 24048, discount: 0, vatAmount: 5952, createdBy: "", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const getStatusStyle = (status: string) => {
    return QUOTATION_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";
  };

  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "quotationNumber", header: "Number", cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-primary">{row.original.quotationNumber}</span>
    )},
    { accessorKey: "clientName", header: "Client", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.clientName}</p>
        <p className="text-xs text-muted-foreground">{formatDate(row.original.quotationDate)}</p>
      </div>
    )},
    { accessorKey: "validUntil", header: "Valid Until", cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.validUntil)}</span>
    )},
    { accessorKey: "grandTotal", header: "Amount", cell: ({ row }) => (
      <div>
        <p className="font-semibold">{formatCurrency(row.original.grandTotal)}</p>
        {row.original.marginPercentage && (
          <p className="text-xs text-green-600">{row.original.marginPercentage.toFixed(1)}% margin</p>
        )}
      </div>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(row.original.status)}`}>
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/quotations/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/quotations/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  const totalValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const approvedValue = quotations.filter((q) => q.status === "approved" || q.status === "accepted").reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quotations</h2>
          <p className="text-sm text-muted-foreground">{quotations.length} quotations</p>
        </div>
        <Button asChild>
          <Link href="/quotations/new">
            <Plus className="h-4 w-4 mr-2" />New Quotation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Quotations", value: quotations.length.toString(), sub: "All time" },
          { label: "Total Value", value: formatCurrency(totalValue), sub: "All quotations" },
          { label: "Approved Value", value: formatCurrency(approvedValue), sub: "Approved & accepted" },
          { label: "Pending Approval", value: quotations.filter((q) => q.status === "pending_approval").length.toString(), sub: "Awaiting review" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={quotations}
        searchKey="clientName"
        searchPlaceholder="Search by client..."
        loading={loading}
        emptyMessage="No quotations found."
        emptyIcon={<FileText className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
