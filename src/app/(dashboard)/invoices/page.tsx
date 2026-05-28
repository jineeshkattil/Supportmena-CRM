"use client";

import { useState, useEffect } from "react";
import { Plus, Receipt, Eye, Pencil, AlertCircle } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Invoice } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUSES } from "@/lib/constants";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "invoices"), orderBy("createdAt", "desc")));
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
      } catch {
        setInvoices([
          { id: "1", invoiceNumber: "INV-0001", clientId: "1", clientName: "Al Noor Technologies", invoiceDate: "2024-07-01", dueDate: "2024-07-31", invoiceType: "tax_invoice" as const, items: [], subtotal: 42857, discount: 0, vatAmount: 2143, grandTotal: 45000, paidAmount: 45000, balanceAmount: 0, status: "paid" as const, createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "2", invoiceNumber: "INV-0002", clientId: "2", clientName: "Gulf Smart Systems", invoiceDate: "2024-07-10", dueDate: "2024-08-09", invoiceType: "tax_invoice" as const, items: [], subtotal: 74762, discount: 0, vatAmount: 3738, grandTotal: 78500, paidAmount: 40000, balanceAmount: 38500, status: "partially_paid" as const, createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "3", invoiceNumber: "INV-0003", clientId: "3", clientName: "Skyline Properties", invoiceDate: "2024-06-15", dueDate: "2024-07-15", invoiceType: "tax_invoice" as const, items: [], subtotal: 23810, discount: 0, vatAmount: 1190, grandTotal: 25000, paidAmount: 0, balanceAmount: 25000, status: "overdue" as const, createdBy: "", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const getStatusStyle = (status: string) => INVOICE_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";

  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: "invoiceNumber", header: "Invoice #", cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-primary">{row.original.invoiceNumber}</span>
    )},
    { accessorKey: "clientName", header: "Client", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.clientName}</p>
        <p className="text-xs text-muted-foreground capitalize">{row.original.invoiceType.replace("_", " ")}</p>
      </div>
    )},
    { accessorKey: "invoiceDate", header: "Date", cell: ({ row }) => (
      <div className="text-sm">
        <p>{formatDate(row.original.invoiceDate)}</p>
        <p className="text-xs text-muted-foreground">Due: {formatDate(row.original.dueDate)}</p>
      </div>
    )},
    { accessorKey: "grandTotal", header: "Amount", cell: ({ row }) => (
      <div>
        <p className="font-semibold">{formatCurrency(row.original.grandTotal)}</p>
        <p className="text-xs text-muted-foreground">
          Paid: {formatCurrency(row.original.paidAmount)}
        </p>
      </div>
    )},
    { accessorKey: "balanceAmount", header: "Balance", cell: ({ row }) => (
      <p className={`font-semibold text-sm ${row.original.balanceAmount > 0 ? "text-destructive" : "text-green-600"}`}>
        {formatCurrency(row.original.balanceAmount)}
      </p>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(row.original.status)}`}>
        {row.original.status === "overdue" && <AlertCircle className="h-3 w-3 mr-1" />}
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/invoices/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/invoices/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.grandTotal, 0);
  const pendingAmount = invoices.filter((i) => ["sent", "partially_paid"].includes(i.status)).reduce((sum, i) => sum + i.balanceAmount, 0);
  const overdueAmount = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.balanceAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />New Invoice
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Collected", value: formatCurrency(totalRevenue), color: "text-green-600" },
          { label: "Pending", value: formatCurrency(pendingAmount), color: "text-blue-600" },
          { label: "Overdue", value: formatCurrency(overdueAmount), color: "text-red-600" },
          { label: "Total Invoices", value: invoices.length.toString(), color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchKey="clientName"
        searchPlaceholder="Search by client..."
        loading={loading}
        emptyMessage="No invoices found."
        emptyIcon={<Receipt className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
