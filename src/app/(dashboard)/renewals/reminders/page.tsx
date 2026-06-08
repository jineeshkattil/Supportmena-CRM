"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Moon,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format, addDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/DataTable";

import { useAuth } from "@/contexts/AuthContext";
import {
  getReminders,
  updateReminder,
  updateClientService,
  getRenewalEvents,
  createReminder,
  updateRenewalEvent,
} from "@/services/renewal-firestore";
import {
  REMINDER_TYPE_LABELS,
  REMINDER_PRIORITY_COLORS,
  BILLING_STATUS_COLORS,
  BILLING_STATUS_LABELS,
  getDaysUntil,
  isOverdue,
  getReminderType,
  buildReminderMessage,
} from "@/lib/renewal-utils";
import { formatDate, cn } from "@/lib/utils";
import type { Reminder, RenewalEvent } from "@/types/renewal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function billingDateColor(dateStr: string): string {
  if (isOverdue(dateStr)) return "text-red-600 font-medium";
  const days = getDaysUntil(dateStr);
  if (days <= 7) return "text-orange-500 font-medium";
  return "text-foreground";
}

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2 shrink-0", bgClass)}>
            <Icon className={cn("h-4 w-4", colorClass)} />
          </div>
          <div className="min-w-0">
            {loading ? (
              <>
                <Skeleton className="h-6 w-10 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <p className={cn("text-xl font-bold", colorClass)}>{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{title}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReminders();
      setReminders(data);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ─── Tab filters ────────────────────────────────────────────────────────────

  const allReminders = reminders;
  const todayReminders = reminders.filter((r) => r.reminderDate === TODAY && r.status !== "completed");
  const upcomingReminders = reminders.filter(
    (r) =>
      r.status === "pending" &&
      r.reminderDate > TODAY
  );
  const overdueReminders = reminders.filter(
    (r) =>
      r.status !== "completed" &&
      r.status !== "snoozed" &&
      isOverdue(r.billingDueDate)
  );
  const completedReminders = reminders.filter((r) => r.status === "completed");

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalReminders = reminders.length;
  const todayCount = todayReminders.length;
  const overdueCount = overdueReminders.length;
  const completedCount = completedReminders.length;

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleMarkCompleted = async (reminder: Reminder) => {
    setActionLoading(reminder.id);
    try {
      await updateReminder(reminder.id, { status: "completed" });
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, status: "completed" } : r))
      );
      toast.success("Reminder marked as completed");
    } catch {
      toast.error("Failed to update reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkBillingDone = async (reminder: Reminder) => {
    setActionLoading(`billing-${reminder.id}`);
    try {
      await updateReminder(reminder.id, { status: "completed" });
      await updateClientService(reminder.clientServiceId, {
        billingStatus: "billing_completed",
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, status: "completed" } : r))
      );
      toast.success("Billing marked as done and reminder completed");
    } catch {
      toast.error("Failed to update billing status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnooze = async (reminder: Reminder) => {
    setActionLoading(`snooze-${reminder.id}`);
    try {
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      await updateReminder(reminder.id, {
        status: "snoozed",
        snoozeUntil: tomorrow,
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminder.id ? { ...r, status: "snoozed", snoozeUntil: tomorrow } : r
        )
      );
      toast.success(`Reminder snoozed until ${formatDate(tomorrow)}`);
    } catch {
      toast.error("Failed to snooze reminder");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Run reminder check ──────────────────────────────────────────────────────

  const handleRunCheck = async () => {
    if (!profile?.id) {
      toast.error("You must be logged in");
      return;
    }
    setRunningCheck(true);
    let created = 0;
    try {
      const events = await getRenewalEvents();
      const existingReminders = await getReminders();
      const existingEventIds = new Set(existingReminders.map((r) => r.renewalEventId));

      const today = new Date().toISOString().slice(0, 10);

      for (const event of events) {
        if (
          event.status === "renewed" ||
          event.status === "cancelled" ||
          event.status === "skipped"
        )
          continue;

        const isTodayReminder = event.internalReminderDate === today;
        const isBillingDueToday = event.billingDueDate === today;
        const isBillingOverdue =
          isOverdue(event.billingDueDate) && event.status !== "billing_completed";

        if (!isTodayReminder && !isBillingDueToday && !isBillingOverdue) continue;
        if (existingEventIds.has(event.id)) continue;

        const { type, priority } = getReminderType(
          event.internalReminderDate,
          event.billingDueDate,
          event.actualRenewalDate
        );
        const message = buildReminderMessage(
          event.clientName,
          event.serviceName,
          event.actualRenewalDate,
          event.billingDueDate,
          type
        );

        await createReminder({
          renewalEventId: event.id,
          clientServiceId: event.clientServiceId,
          clientId: event.clientId,
          clientName: event.clientName,
          serviceName: event.serviceName,
          providerName: event.providerName,
          serviceCategory: event.serviceCategory,
          reminderType: type,
          reminderDate: today,
          billingDueDate: event.billingDueDate,
          actualRenewalDate: event.actualRenewalDate,
          message,
          priority,
          status: "pending",
        });

        // Update event status
        if (isTodayReminder && event.status === "upcoming") {
          await updateRenewalEvent(event.id, { status: "reminder_sent" });
        } else if (isBillingDueToday) {
          await updateRenewalEvent(event.id, { status: "billing_due" });
        } else if (isBillingOverdue) {
          await updateRenewalEvent(event.id, { status: "overdue" });
        }

        created++;
      }

      toast.success(
        created === 0
          ? "No new reminders to create"
          : `${created} reminder${created !== 1 ? "s" : ""} created`
      );
      fetchReminders();
    } catch {
      toast.error("Failed to run reminder check");
    } finally {
      setRunningCheck(false);
    }
  };

  // ─── Columns ────────────────────────────────────────────────────────────────

  const buildColumns = (): ColumnDef<Reminder>[] => [
    {
      accessorKey: "reminderType",
      header: "Type",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              REMINDER_PRIORITY_COLORS[r.priority]
            )}
          >
            {REMINDER_TYPE_LABELS[r.reminderType] ?? r.reminderType}
          </span>
        );
      },
    },
    {
      id: "clientService",
      accessorKey: "clientName",
      header: "Client / Service",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.clientName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.serviceName}
            {row.original.providerName ? ` · ${row.original.providerName}` : ""}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "billingDueDate",
      header: "Billing Due",
      cell: ({ row }) => (
        <span className={cn("text-xs", billingDateColor(row.original.billingDueDate))}>
          {formatDate(row.original.billingDueDate)}
        </span>
      ),
    },
    {
      accessorKey: "actualRenewalDate",
      header: "Renewal Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.actualRenewalDate)}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const p = row.original.priority;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
              REMINDER_PRIORITY_COLORS[p]
            )}
          >
            {p}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const statusColors: Record<string, string> = {
          pending: "bg-blue-100 text-blue-700",
          sent: "bg-indigo-100 text-indigo-700",
          snoozed: "bg-gray-200 text-gray-600",
          completed: "bg-green-100 text-green-700",
        };
        const statusLabels: Record<string, string> = {
          pending: "Pending",
          sent: "Sent",
          snoozed: "Snoozed",
          completed: "Completed",
        };
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              statusColors[s] ?? "bg-gray-100 text-gray-600"
            )}
          >
            {statusLabels[s] ?? s}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original;
        const isCompleted = r.status === "completed";
        const loadingCompleted = actionLoading === r.id;
        const loadingBilling = actionLoading === `billing-${r.id}`;
        const loadingSnooze = actionLoading === `snooze-${r.id}`;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handleMarkCompleted(r)}
              disabled={isCompleted || !!actionLoading}
            >
              {loadingCompleted ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handleMarkBillingDone(r)}
              disabled={isCompleted || !!actionLoading}
            >
              {loadingBilling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
              )}
              Billing Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handleSnooze(r)}
              disabled={isCompleted || r.status === "snoozed" || !!actionLoading}
            >
              {loadingSnooze ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Moon className="h-3 w-3 mr-1" />
              )}
              Snooze
            </Button>
          </div>
        );
      },
    },
  ];

  const columns = buildColumns();

  // ─── Tab content ────────────────────────────────────────────────────────────

  function ReminderTable({
    data,
    emptyMessage,
  }: {
    data: Reminder[];
    emptyMessage: string;
  }) {
    return (
      <DataTable
        columns={columns}
        data={data}
        searchKey="clientService"
        searchPlaceholder="Search reminders..."
        loading={loading}
        emptyMessage={emptyMessage}
        emptyIcon={<Bell className="h-8 w-8 opacity-30" />}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reminders</h2>
          <p className="text-sm text-muted-foreground">
            Manage billing reminders and renewal alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleRunCheck}
            disabled={runningCheck}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {runningCheck ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Run Reminder Check
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Reminders"
          value={totalReminders}
          icon={Bell}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Due Today"
          value={todayCount}
          icon={Clock}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          loading={loading}
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          colorClass="text-red-600"
          bgClass="bg-red-50"
          loading={loading}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          colorClass="text-green-600"
          bgClass="bg-green-50"
          loading={loading}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All
            {totalReminders > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                {totalReminders}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="today">
            Today
            {todayCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
                {todayCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            {overdueCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">
                {overdueCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ReminderTable data={allReminders} emptyMessage="No reminders found. Run a reminder check to generate them." />
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <ReminderTable data={todayReminders} emptyMessage="No reminders due today." />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <ReminderTable data={upcomingReminders} emptyMessage="No upcoming reminders." />
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <ReminderTable data={overdueReminders} emptyMessage="No overdue reminders." />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <ReminderTable data={completedReminders} emptyMessage="No completed reminders yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
