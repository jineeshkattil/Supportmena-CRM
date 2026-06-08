"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileWarning,
  RefreshCw,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getDashboardStats,
  getRenewalEvents,
  seedSampleData,
} from "@/services/renewal-firestore";
import {
  getDaysUntil,
  isOverdue,
  isUpcomingWithin,
  RENEWAL_EVENT_STATUS_LABELS,
  RENEWAL_EVENT_STATUS_COLORS,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { RenewalEvent } from "@/types/renewal";
import { cn } from "@/lib/utils";

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass?: string;
  loading?: boolean;
}) {
  return (
    <Card className={cn("border", borderClass)}>
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

function DaysUntilBadge({ dateStr }: { dateStr: string }) {
  const days = getDaysUntil(dateStr);
  if (days < 0)
    return (
      <Badge variant="destructive" className="text-[10px]">
        {Math.abs(days)}d overdue
      </Badge>
    );
  if (days === 0)
    return (
      <Badge variant="warning" className="text-[10px]">
        Today
      </Badge>
    );
  if (days <= 7)
    return (
      <Badge variant="warning" className="text-[10px]">
        {days}d left
      </Badge>
    );
  return (
    <Badge variant="info" className="text-[10px]">
      {days}d left
    </Badge>
  );
}

function EventCard({
  event,
  tint,
}: {
  event: RenewalEvent;
  tint?: "red" | "orange" | "blue";
}) {
  const tintClass =
    tint === "red"
      ? "border-red-200 bg-red-50/50"
      : tint === "orange"
      ? "border-orange-200 bg-orange-50/50"
      : "border-border bg-card";

  return (
    <div className={cn("rounded-lg border p-3 space-y-1.5", tintClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{event.clientName}</p>
          <p className="text-xs text-muted-foreground truncate">{event.serviceName}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DaysUntilBadge dateStr={event.actualRenewalDate} />
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              RENEWAL_EVENT_STATUS_COLORS[event.status]
            )}
          >
            {RENEWAL_EVENT_STATUS_LABELS[event.status]}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>
          <span className="font-medium">Billing Due:</span>{" "}
          {formatDate(event.billingDueDate)}
        </span>
        <span>
          <span className="font-medium">Renewal:</span>{" "}
          {formatDate(event.actualRenewalDate)}
        </span>
        {event.serviceCategory && (
          <span className="capitalize">
            {SERVICE_CATEGORY_LABELS[event.serviceCategory] ?? event.serviceCategory}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  icon: Icon,
  iconColor,
  events,
  tint,
  emptyText,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  events: RenewalEvent[];
  tint?: "red" | "orange" | "blue";
  emptyText: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({events.length})</span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 pl-6">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} tint={tint} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RenewalsPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<RenewalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, ev] = await Promise.all([getDashboardStats(), getRenewalEvents()]);
      setStats(s);
      setEvents(ev);
    } catch {
      toast.error("Failed to load renewal data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    if (!profile?.id) return;
    setSeeding(true);
    try {
      await seedSampleData(profile.id);
      toast.success("Sample data loaded successfully");
      fetchData();
    } catch {
      toast.error("Failed to load sample data");
    } finally {
      setSeeding(false);
    }
  };

  // Derived event lists
  const remindersToday = events.filter((e) => e.internalReminderDate === today);
  const overdueEvents = events.filter(
    (e) =>
      isOverdue(e.billingDueDate) &&
      e.status !== "billing_completed" &&
      e.status !== "skipped" &&
      e.status !== "cancelled"
  );
  const criticalEvents = events.filter(
    (e) =>
      isUpcomingWithin(e.actualRenewalDate, 7) &&
      e.status !== "billing_completed"
  );
  const upcomingThisWeek = events.filter((e) =>
    isUpcomingWithin(e.internalReminderDate, 7)
  );

  const showSeedButton =
    !loading && (stats?.totalServices === 0 || events.length === 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewal Reminders</h2>
          <p className="text-sm text-muted-foreground">
            Track service renewals and billing deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showSeedButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              {seeding ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              )}
              Load Sample Data
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard
          title="Reminders Today"
          value={stats?.remindersToday ?? 0}
          icon={Bell}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          loading={loading}
        />
        <StatCard
          title="Upcoming (7 days)"
          value={stats?.upcoming7 ?? 0}
          icon={Clock}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Upcoming (30 days)"
          value={stats?.upcoming30 ?? 0}
          icon={Calendar}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          loading={loading}
        />
        <StatCard
          title="Billing Due This Week"
          value={stats?.billingDueThisWeek ?? 0}
          icon={AlertTriangle}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
          loading={loading}
        />
        <StatCard
          title="Renewals This Month"
          value={stats?.renewalsThisMonth ?? 0}
          icon={CheckCircle2}
          colorClass="text-green-600"
          bgClass="bg-green-50"
          loading={loading}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          colorClass="text-red-600"
          bgClass="bg-red-50"
          borderClass={(stats?.overdue ?? 0) > 0 ? "border-red-200" : undefined}
          loading={loading}
        />
        <StatCard
          title="Critical Renewals"
          value={stats?.critical ?? 0}
          icon={TrendingUp}
          colorClass="text-red-700"
          bgClass="bg-red-100"
          borderClass={(stats?.critical ?? 0) > 0 ? "border-red-300" : undefined}
          loading={loading}
        />
        <StatCard
          title="Pending Documents"
          value={stats?.pendingDocuments ?? 0}
          icon={FileWarning}
          colorClass="text-yellow-700"
          bgClass="bg-yellow-50"
          loading={loading}
        />
      </div>

      {/* Detail Sections */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <SectionBlock
            title="Reminders Due Today"
            icon={Bell}
            iconColor="text-amber-500"
            events={remindersToday}
            tint="orange"
            emptyText="No reminders due today."
          />
          <SectionBlock
            title="Overdue Billing"
            icon={AlertTriangle}
            iconColor="text-red-500"
            events={overdueEvents}
            tint="red"
            emptyText="No overdue billing items."
          />
          <SectionBlock
            title="Critical Renewals"
            icon={TrendingUp}
            iconColor="text-red-600"
            events={criticalEvents}
            tint="red"
            emptyText="No critical renewals within 7 days."
          />
          <SectionBlock
            title="Upcoming This Week"
            icon={Calendar}
            iconColor="text-blue-500"
            events={upcomingThisWeek}
            tint="blue"
            emptyText="No upcoming reminders this week."
          />

          {events.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No renewal events yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Load sample data or add clients and services to get started.
                  </p>
                </div>
                {showSeedButton && (
                  <Button
                    size="sm"
                    onClick={handleSeed}
                    disabled={seeding}
                    className="mt-1"
                  >
                    {seeding ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Load Sample Data
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
