"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AttendanceRecord } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-orange-100 text-orange-700",
  half_day: "bg-yellow-100 text-yellow-700",
  on_leave: "bg-blue-100 text-blue-700",
  weekend: "bg-gray-100 text-gray-500",
  holiday: "bg-purple-100 text-purple-700",
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(
          collection(db, "attendance"),
          where("date", "==", today),
          orderBy("createdAt", "desc")
        ));
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceRecord));
      } catch {
        setRecords([
          { id: "1", employeeId: "1", employeeName: "Ahmed Al Rashid", date: today, checkIn: "08:30", checkOut: "17:45", status: "present", createdAt: null as never },
          { id: "2", employeeId: "2", employeeName: "Sarah Johnson", date: today, checkIn: "09:15", status: "late", createdAt: null as never },
          { id: "3", employeeId: "3", employeeName: "Mohammed Khalil", date: today, status: "on_leave", createdAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [today]);

  const columns: ColumnDef<AttendanceRecord>[] = [
    { accessorKey: "employeeName", header: "Employee", cell: ({ row }) => (
      <p className="font-medium">{row.original.employeeName}</p>
    )},
    { accessorKey: "date", header: "Date", cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.date)}</span>
    )},
    { accessorKey: "checkIn", header: "Check In", cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        {row.original.checkIn ? (
          <><CheckCircle className="h-3.5 w-3.5 text-green-500" />{row.original.checkIn}</>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )},
    { accessorKey: "checkOut", header: "Check Out", cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        {row.original.checkOut ? (
          <><Clock className="h-3.5 w-3.5 text-blue-500" />{row.original.checkOut}</>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[row.original.status] || "bg-gray-100 text-gray-700"}`}>
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.notes || "—"}</span>
    )},
  ];

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Attendance</h2>
          <p className="text-sm text-muted-foreground">Today — {formatDate(today)}</p>
        </div>
        <Button asChild>
          <Link href="/attendance/mark">
            <Plus className="h-4 w-4 mr-2" />Mark Attendance
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Present", value: presentCount, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Absent", value: absentCount, icon: XCircle, color: "text-red-600 bg-red-50" },
          { label: "Late", value: lateCount, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
          { label: "On Leave", value: records.filter((r) => r.status === "on_leave").length, icon: Clock, color: "text-blue-600 bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={records}
        searchKey="employeeName"
        searchPlaceholder="Search employees..."
        loading={loading}
        emptyMessage="No attendance records for today."
        emptyIcon={<Clock className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
