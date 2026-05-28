"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard, Eye } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Expense } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "expenses"), orderBy("createdAt", "desc")));
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense));
      } catch {
        setExpenses([
          { id: "1", expenseNumber: "EXP-001", description: "Office Rent - July 2024", category: "Rent", amount: 15000, vatAmount: 750, totalAmount: 15750, expenseDate: "2024-07-01", status: "paid", paymentMethod: "bank_transfer", createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "2", expenseNumber: "EXP-002", description: "Etisalat Business Plan", category: "Telecom", amount: 2500, vatAmount: 125, totalAmount: 2625, expenseDate: "2024-07-05", status: "approved", createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "3", expenseNumber: "EXP-003", description: "Vehicle fuel - July", category: "Fuel", amount: 800, totalAmount: 800, expenseDate: "2024-07-10", status: "pending", createdBy: "", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    approved: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-700",
  };

  const columns: ColumnDef<Expense>[] = [
    { accessorKey: "expenseNumber", header: "Ref #", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.expenseNumber}</span>
    )},
    { accessorKey: "description", header: "Description", cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.description}</p>
        <p className="text-xs text-muted-foreground">{row.original.category}</p>
      </div>
    )},
    { accessorKey: "expenseDate", header: "Date", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.expenseDate)}</span>
    )},
    { accessorKey: "totalAmount", header: "Amount", cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.totalAmount)}</span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[row.original.status] || "bg-gray-100 text-gray-700"}`}>
        {row.original.status}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
        <Link href={`/expenses/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
      </Button>
    )},
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">{expenses.length} expenses</p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="h-4 w-4 mr-2" />Add Expense
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Expenses", value: formatCurrency(totalExpenses) },
          { label: "Pending Approval", value: expenses.filter((e) => e.status === "pending").length.toString() },
          { label: "Paid", value: expenses.filter((e) => e.status === "paid").length.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        searchKey="description"
        searchPlaceholder="Search expenses..."
        loading={loading}
        emptyMessage="No expenses found."
        emptyIcon={<CreditCard className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
