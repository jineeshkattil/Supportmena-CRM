"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Server,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Eye,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getClientServices } from "@/services/renewal-firestore";
import {
  SERVICE_CATEGORY_LABELS,
  BILLING_STATUS_LABELS,
  BILLING_STATUS_COLORS,
  getDaysUntil,
  isOverdue,
} from "@/lib/renewal-utils";
import { formatDate, cn } from "@/lib/utils";
import type {
  ClientService,
  ServiceCategory,
  BillingStatus,
  ServiceStatus,
} from "@/types/renewal";

// ─── Date colour helpers ──────────────────────────────────────────────────────

function renewalDateColor(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return "text-red-600 font-medium";
  if (days < 30) return "text-red-500 font-medium";
  if (days < 60) return "text-orange-500 font-medium";
  return "text-green-600";
}

function billingDateColor(dateStr: string): string {
  if (isOverdue(dateStr)) return "text-red-600 font-medium";
  const days = getDaysUntil(dateStr);
  if (days <= 7) return "text-orange-500 font-medium";
  return "text-foreground";
}

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

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<ClientService>[] = [
  {
    accessorKey: "serviceCode",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.serviceCode}
      </span>
    ),
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
    accessorKey: "serviceCategory",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs font-normal">
        {SERVICE_CATEGORY_LABELS[row.original.serviceCategory] ??
          row.original.serviceCategory}
      </Badge>
    ),
  },
  {
    accessorKey: "actualRenewalDate",
    header: "Renewal Date",
    cell: ({ row }) => (
      <span className={cn("text-xs", renewalDateColor(row.original.actualRenewalDate))}>
        {formatDate(row.original.actualRenewalDate)}
      </span>
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
    accessorKey: "internalReminderDate",
    header: "Reminder Date",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.internalReminderDate)}
      </span>
    ),
  },
  {
    accessorKey: "billingStatus",
    header: "Billing",
    cell: ({ row }) => {
      const s = row.original.billingStatus;
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            BILLING_STATUS_COLORS[s]
          )}
        >
          {BILLING_STATUS_LABELS[s] ?? s}
        </span>
      );
    },
  },
  {
    accessorKey: "serviceStatus",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.serviceStatus;
      const colors: Record<string, string> = {
        active: "bg-green-100 text-green-700",
        renewed: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-gray-200 text-gray-600",
        expired: "bg-red-100 text-red-700",
      };
      const labels: Record<string, string> = {
        active: "Active",
        renewed: "Renewed",
        cancelled: "Cancelled",
        expired: "Expired",
      };
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            colors[s] ?? "bg-gray-100 text-gray-600"
          )}
        >
          {labels[s] ?? s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/renewals/services/${row.original.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href={`/renewals/services/${row.original.id}?edit=true`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientServicesPage() {
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [billingFilter, setBillingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getClientServices();
        setServices(data);
      } catch {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.serviceStatus === "active").length;
  const billingCompleted = services.filter(
    (s) => s.billingStatus === "billing_completed"
  ).length;
  const overdueServices = services.filter((s) => s.billingStatus === "overdue").length;

  // Client-side filtering
  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.serviceName.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      s.serviceCode.toLowerCase().includes(q);
    const matchCategory =
      categoryFilter === "all" || s.serviceCategory === categoryFilter;
    const matchBilling =
      billingFilter === "all" || s.billingStatus === billingFilter;
    const matchStatus =
      statusFilter === "all" || s.serviceStatus === statusFilter;
    const matchDateFrom = !dateFrom || s.actualRenewalDate >= dateFrom;
    const matchDateTo = !dateTo || s.actualRenewalDate <= dateTo;
    return (
      matchSearch &&
      matchCategory &&
      matchBilling &&
      matchStatus &&
      matchDateFrom &&
      matchDateTo
    );
  });

  const SERVICE_CATEGORIES: ServiceCategory[] = [
    "domain",
    "website_hosting",
    "email_hosting",
    "ssl",
    "vps_server",
    "cloud",
    "software",
    "maintenance",
    "other",
  ];

  const BILLING_STATUSES: BillingStatus[] = [
    "not_due",
    "reminder_sent",
    "billing_due",
    "billing_completed",
    "overdue",
    "skipped",
  ];

  const SERVICE_STATUSES: ServiceStatus[] = [
    "active",
    "renewed",
    "cancelled",
    "expired",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Client Services</h2>
          <p className="text-sm text-muted-foreground">
            Manage all client service subscriptions and renewals
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/renewals/services/new">
            <Plus className="h-4 w-4 mr-2" />
            New Service
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Services"
          value={totalServices}
          icon={Server}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Active Services"
          value={activeServices}
          icon={Activity}
          colorClass="text-green-600"
          bgClass="bg-green-50"
          loading={loading}
        />
        <StatCard
          title="Billing Completed"
          value={billingCompleted}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          loading={loading}
        />
        <StatCard
          title="Overdue"
          value={overdueServices}
          icon={AlertTriangle}
          colorClass="text-red-600"
          bgClass="bg-red-50"
          loading={loading}
        />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Client or service name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {SERVICE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Billing Status</Label>
            <Select value={billingFilter} onValueChange={setBillingFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {BILLING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {BILLING_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Service Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {SERVICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Renewal Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Renewal Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {(search || categoryFilter !== "all" || billingFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {services.length} services
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setBillingFilter("all");
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="clientService"
        searchPlaceholder="Search services..."
        loading={loading}
        emptyMessage="No services found."
        emptyIcon={<Server className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
