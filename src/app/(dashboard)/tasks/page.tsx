"use client";

import { useState, useEffect } from "react";
import { Plus, CheckSquare, Eye, AlertCircle } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/constants";
import Link from "next/link";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "tasks"), orderBy("createdAt", "desc")));
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
      } catch {
        setTasks([
          { id: "1", taskTitle: "Install cameras on floor 3", projectName: "CCTV - Al Noor HQ", assignedToName: "Ahmed Al Rashid", priority: "high", dueDate: "2024-07-18", status: "in_progress", description: "Install 8 dome cameras on the 3rd floor", createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "2", taskTitle: "Configure NVR and test recording", projectName: "CCTV - Al Noor HQ", assignedToName: "Ahmed Al Rashid", priority: "high", dueDate: "2024-07-19", status: "pending", createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "3", taskTitle: "Run Cat6 cabling in server room", projectName: "Network Setup - Gulf Mart", assignedToName: "Mohammed Khalil", priority: "medium", dueDate: "2024-07-20", status: "assigned", createdBy: "", createdAt: null as never, updatedAt: null as never },
          { id: "4", taskTitle: "Monthly inspection - Skyline Tower", projectName: "AMC - Skyline Tower", assignedToName: "Ahmed Al Rashid", priority: "low", dueDate: "2024-07-30", status: "pending", createdBy: "", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const getStatusStyle = (status: string) => TASK_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";

  const columns: ColumnDef<Task>[] = [
    { accessorKey: "taskTitle", header: "Task", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.taskTitle}</p>
        {row.original.projectName && (
          <p className="text-xs text-muted-foreground">{row.original.projectName}</p>
        )}
      </div>
    )},
    { accessorKey: "assignedToName", header: "Assigned To", cell: ({ row }) => (
      <span className="text-sm">{row.original.assignedToName || "—"}</span>
    )},
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PRIORITY_COLORS[row.original.priority]}`}>
        {row.original.priority === "urgent" && <AlertCircle className="h-3 w-3 mr-1" />}
        {row.original.priority}
      </span>
    )},
    { accessorKey: "dueDate", header: "Due Date", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.dueDate)}</span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(row.original.status)}`}>
        {row.original.status.replace("_", " ")}
      </span>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
        <Link href={`/tasks/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
      </Button>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />New Task
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TASK_STATUSES.slice(0, 5).map((s) => (
          <div key={s.value} className="rounded-xl border p-3 bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{tasks.filter((t) => t.status === s.value).length}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        searchKey="taskTitle"
        searchPlaceholder="Search tasks..."
        loading={loading}
        emptyMessage="No tasks found."
        emptyIcon={<CheckSquare className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
