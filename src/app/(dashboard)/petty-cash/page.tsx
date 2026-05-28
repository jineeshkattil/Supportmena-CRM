"use client";

import { useState, useEffect } from "react";
import { Plus, Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PettyCashTransaction } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "success" | "destructive" | "warning" | "secondary" | "info"> = {
  settled: "success",
  rejected: "destructive",
  pending_settlement: "warning",
  submitted: "info",
  given: "secondary",
  approved: "success",
};

export default function PettyCashPage() {
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "pettyCash"), orderBy("createdAt", "desc")));
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PettyCashTransaction));
      } catch {
        setTransactions([
          { id: "1", transactionNumber: "PC-0001", employeeName: "Ahmed Al Rashid", projectName: "CCTV - Al Noor HQ", expenseCategory: "Fuel", amountGiven: 500, amountSpent: 380, amountReturned: 120, status: "settled", createdBy: "", createdAt: null as never, updatedAt: null as never, employeeId: "1" },
          { id: "2", transactionNumber: "PC-0002", employeeName: "Mohammed Khalil", projectName: "Network Setup - Gulf Mart", expenseCategory: "Site Materials", amountGiven: 1200, amountSpent: 950, status: "pending_settlement", createdBy: "", createdAt: null as never, updatedAt: null as never, employeeId: "3" },
          { id: "3", transactionNumber: "PC-0003", employeeName: "Ahmed Al Rashid", expenseCategory: "Parking", amountGiven: 200, status: "given", createdBy: "", createdAt: null as never, updatedAt: null as never, employeeId: "1" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const columns: ColumnDef<PettyCashTransaction>[] = [
    { accessorKey: "transactionNumber", header: "Ref #", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.transactionNumber}</span>
    )},
    { accessorKey: "employeeName", header: "Employee" },
    { accessorKey: "projectName", header: "Project", cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.projectName || "—"}</span>
    )},
    { accessorKey: "expenseCategory", header: "Category" },
    { accessorKey: "amountGiven", header: "Given", cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.amountGiven)}</span>
    )},
    { accessorKey: "amountSpent", header: "Spent", cell: ({ row }) => (
      <span className="text-sm">{row.original.amountSpent ? formatCurrency(row.original.amountSpent) : "—"}</span>
    )},
    { id: "balance", header: "Return", cell: ({ row }) => {
      const balance = (row.original.amountGiven || 0) - (row.original.amountSpent || 0);
      return (
        <span className={`text-sm font-medium ${balance > 0 ? "text-green-600" : "text-muted-foreground"}`}>
          {row.original.amountSpent ? formatCurrency(Math.max(0, balance)) : "—"}
        </span>
      );
    }},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || "secondary"} className="capitalize text-xs">
        {row.original.status.replace("_", " ")}
      </Badge>
    )},
  ];

  const totalGiven = transactions.reduce((sum, t) => sum + (t.amountGiven || 0), 0);
  const totalSpent = transactions.reduce((sum, t) => sum + (t.amountSpent || 0), 0);
  const pendingSettlement = transactions.filter((t) => ["given", "pending_settlement", "submitted"].includes(t.status)).reduce((sum, t) => sum + (t.amountGiven - (t.amountSpent || 0)), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Petty Cash</h2>
          <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/petty-cash/new">
            <Plus className="h-4 w-4 mr-2" />Assign Cash
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Given", value: formatCurrency(totalGiven), color: "text-blue-600" },
          { label: "Total Spent", value: formatCurrency(totalSpent), color: "text-orange-600" },
          { label: "Pending Settlement", value: formatCurrency(pendingSettlement), color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchKey="employeeName"
        searchPlaceholder="Search by employee..."
        loading={loading}
        emptyMessage="No petty cash transactions."
        emptyIcon={<Wallet className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
