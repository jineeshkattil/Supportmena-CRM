"use client";

import { useState, useEffect } from "react";
import { Plus, CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";
import { collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { LeaveRequest } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { LEAVE_TYPES } from "@/lib/constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
  cancelled: "secondary",
};

export default function LeavePage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [processing, setProcessing] = useState(false);

  const canApprove = profile?.role && ["super_admin", "management", "hr_admin"].includes(profile.role);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "leaveRequests"), orderBy("createdAt", "desc")));
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LeaveRequest));
      } catch {
        setRequests([
          { id: "1", employeeId: "1", employeeName: "Ahmed Al Rashid", leaveType: "annual", startDate: "2024-07-15", endDate: "2024-07-19", totalDays: 5, reason: "Annual vacation", status: "pending", createdAt: null as never, updatedAt: null as never },
          { id: "2", employeeId: "2", employeeName: "Sarah Johnson", leaveType: "sick", startDate: "2024-07-08", endDate: "2024-07-09", totalDays: 2, reason: "Medical leave", status: "approved", approverName: "Admin", createdAt: null as never, updatedAt: null as never },
          { id: "3", employeeId: "3", employeeName: "Mohammed Khalil", leaveType: "emergency", startDate: "2024-07-12", endDate: "2024-07-12", totalDays: 1, reason: "Family emergency", status: "approved", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handleApproval = async (action: "approved" | "rejected") => {
    if (!selected) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "leaveRequests", selected.id), {
        status: action,
        approverId: profile?.id,
        approverName: profile?.displayName,
        approvalComments,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, status: action, approvalComments } : r
        )
      );
      toast.success(`Leave request ${action}`);
      setSelected(null);
      setApprovalComments("");
    } catch {
      toast.error("Failed to update leave request");
    } finally {
      setProcessing(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => LEAVE_TYPES.find((t) => t.value === type)?.label || type;

  const columns: ColumnDef<LeaveRequest>[] = [
    { accessorKey: "employeeName", header: "Employee", cell: ({ row }) => (
      <p className="font-medium">{row.original.employeeName}</p>
    )},
    { accessorKey: "leaveType", header: "Type", cell: ({ row }) => (
      <Badge variant="info" className="text-xs capitalize">
        {getLeaveTypeLabel(row.original.leaveType)}
      </Badge>
    )},
    { accessorKey: "startDate", header: "Period", cell: ({ row }) => (
      <div className="text-sm">
        <p>{formatDate(row.original.startDate)}</p>
        {row.original.startDate !== row.original.endDate && (
          <p className="text-xs text-muted-foreground">to {formatDate(row.original.endDate)}</p>
        )}
      </div>
    )},
    { accessorKey: "totalDays", header: "Days", cell: ({ row }) => (
      <Badge variant="secondary">{row.original.totalDays}d</Badge>
    )},
    { accessorKey: "reason", header: "Reason", cell: ({ row }) => (
      <p className="text-sm text-muted-foreground truncate max-w-[180px]">{row.original.reason}</p>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || "secondary"} className="capitalize">
        {row.original.status}
      </Badge>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {canApprove && row.original.status === "pending" && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(row.original)}>
            Review
          </Button>
        )}
      </div>
    )},
  ];

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Leave Management</h2>
          <p className="text-sm text-muted-foreground">{pendingCount} pending approval</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/leave/new">
            <Plus className="h-4 w-4 mr-2" />Apply Leave
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: requests.filter((r) => r.status === "pending").length, icon: Clock, color: "text-yellow-600" },
          { label: "Approved", value: requests.filter((r) => r.status === "approved").length, icon: CheckCircle, color: "text-green-600" },
          { label: "Rejected", value: requests.filter((r) => r.status === "rejected").length, icon: XCircle, color: "text-red-600" },
          { label: "Total", value: requests.length, icon: CalendarDays, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 bg-card">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-lg font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={requests}
        searchKey="employeeName"
        searchPlaceholder="Search by employee..."
        loading={loading}
        emptyMessage="No leave requests found."
        emptyIcon={<CalendarDays className="h-8 w-8 opacity-30" />}
      />

      {/* Approval Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium">{selected.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{getLeaveTypeLabel(selected.leaveType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span>{formatDate(selected.startDate)} – {formatDate(selected.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{selected.totalDays} day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="text-right max-w-[200px]">{selected.reason}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea
                  placeholder="Add your comments..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleApproval("rejected")} disabled={processing}>
              <XCircle className="h-4 w-4 mr-1" />Reject
            </Button>
            <Button onClick={() => handleApproval("approved")} disabled={processing}>
              <CheckCircle className="h-4 w-4 mr-1" />Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
