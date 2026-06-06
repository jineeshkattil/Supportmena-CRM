"use client";

import { useState, useEffect } from "react";
import { Plus, UserCircle, Eye, Pencil, AlertTriangle } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate, getInitials, getDaysUntilExpiry } from "@/lib/utils";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  active: "success",
  inactive: "secondary",
  on_leave: "warning",
  terminated: "destructive",
};

export default function HRMSPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const snap = await getDocs(query(collection(db, "employees"), orderBy("createdAt", "desc")));
        setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee));
      } catch {
        setEmployees([
          { id: "1", employeeCode: "EMP-001", fullName: "Ahmed Al Rashid", gender: "male" as const, departmentName: "IT", designationName: "Senior Technician", phone: "+971 50 111 2222", email: "ahmed@supportmena.com", status: "active" as const, employmentType: "full_time" as const, joiningDate: "2022-01-15", visaExpiry: "2025-06-30", createdAt: null as never, updatedAt: null as never },
          { id: "2", employeeCode: "EMP-002", fullName: "Sarah Johnson", gender: "female" as const, departmentName: "Finance", designationName: "Finance Manager", phone: "+971 55 333 4444", email: "sarah@supportmena.com", status: "active" as const, employmentType: "full_time" as const, joiningDate: "2021-03-01", visaExpiry: "2026-02-28", createdAt: null as never, updatedAt: null as never },
          { id: "3", employeeCode: "EMP-003", fullName: "Mohammed Khalil", gender: "male" as const, departmentName: "Operations", designationName: "Project Manager", phone: "+971 52 555 6666", email: "mkhalil@supportmena.com", status: "active" as const, employmentType: "full_time" as const, joiningDate: "2020-06-01", visaExpiry: "2024-08-15", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "employeeCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.employeeCode}</span>
    )},
    { accessorKey: "fullName", header: "Employee", cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(row.original.fullName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{row.original.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </div>
    )},
    { accessorKey: "departmentName", header: "Department" },
    { accessorKey: "designationName", header: "Designation" },
    { accessorKey: "joiningDate", header: "Joined", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.joiningDate)}</span>
    )},
    { accessorKey: "visaExpiry", header: "Visa Expiry", cell: ({ row }) => {
      const days = getDaysUntilExpiry(row.original.visaExpiry);
      const isAlert = days !== null && days <= 90;
      return (
        <div className="flex items-center gap-1.5">
          {isAlert && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
          <span className={`text-xs ${isAlert ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
            {formatDate(row.original.visaExpiry)}
          </span>
        </div>
      );
    }},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || "secondary"} className="capitalize">
        {row.original.status.replace("_", " ")}
      </Badge>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/hrms/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/hrms/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  const activeCount = employees.filter((e) => e.status === "active").length;
  const expiringDocs = employees.filter((e) => {
    const days = getDaysUntilExpiry(e.visaExpiry);
    return days !== null && days <= 90;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">HRMS</h2>
          <p className="text-sm text-muted-foreground">{employees.length} employees</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/hrms/new">
            <Plus className="h-4 w-4 mr-2" />New Employee
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Employees", value: employees.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: activeCount, color: "text-green-600", bg: "bg-green-50" },
          { label: "Documents Expiring", value: expiringDocs, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 flex items-center gap-3 ${s.bg}/30`}>
            <UserCircle className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchKey="fullName"
        searchPlaceholder="Search employees..."
        loading={loading}
        emptyMessage="No employees found."
        emptyIcon={<UserCircle className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
