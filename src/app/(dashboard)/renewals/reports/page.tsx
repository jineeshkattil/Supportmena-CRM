"use client";

import { useState, useEffect, useMemo, type ReactNode, type ElementType } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  Server,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getClientServices,
  getRenewalClients,
  getServiceProviders,
} from "@/services/renewal-firestore";
import {
  SERVICE_CATEGORY_LABELS,
  BILLING_STATUS_LABELS,
  BILLING_STATUS_COLORS,
  PROVIDER_CATEGORY_LABELS,
  getDaysUntil,
  isOverdue,
  isUpcomingWithin,
} from "@/lib/renewal-utils";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type {
  ClientService,
  RenewalClient,
  ServiceProvider,
  ServiceCategory,
  BillingStatus,
} from "@/types/renewal";

// ─── Constants ─────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "domain", "website_hosting", "email_hosting", "ssl",
  "vps_server", "cloud", "software", "maintenance", "other",
];

const BILLING_STATUSES: BillingStatus[] = [
  "not_due", "reminder_sent", "billing_due",
  "billing_completed", "overdue", "skipped",
];

const PIE_COLORS = [
  "#6366f1", "#0ea5e9", "#f59e0b", "#10b981",
  "#ef4444", "#8b5cf6", "#f97316", "#14b8a6",
];

// ─── Helper Components ─────────────────────────────────────────────────────

function SummaryKPI({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2 shrink-0", bgClass)}>
            <Icon className={cn("h-4 w-4", colorClass)} />
          </div>
          <div className="min-w-0">
            <p className={cn("text-xl font-bold truncate", colorClass)}>{value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        BILLING_STATUS_COLORS[status]
      )}
    >
      {BILLING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DaysChip({ dateStr, isRenewal }: { dateStr: string; isRenewal?: boolean }) {
  const days = getDaysUntil(dateStr);
  if (days < 0)
    return (
      <span className="text-[11px] font-medium text-red-600">
        {Math.abs(days)}d overdue
      </span>
    );
  if (days === 0)
    return <span className="text-[11px] font-medium text-orange-600">Today</span>;
  if (days <= 7)
    return (
      <span className="text-[11px] font-medium text-orange-500">
        {days}d left
      </span>
    );
  if (days <= 30)
    return (
      <span className="text-[11px] font-medium text-yellow-600">
        {days}d left
      </span>
    );
  return (
    <span className="text-[11px] text-muted-foreground">{days}d left</span>
  );
}

function SectionHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="px-4 py-2 bg-muted/40 border-b border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {children}
      </p>
    </div>
  );
}

// ─── Group services by month ────────────────────────────────────────────────

function groupByMonth(services: ClientService[], dateKey: keyof ClientService) {
  const groups: Record<string, ClientService[]> = {};
  for (const svc of services) {
    const raw = svc[dateKey] as string;
    if (!raw) continue;
    const key = raw.slice(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = [];
    groups[key].push(svc);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function monthLabel(ym: string): string {
  try {
    return format(parseISO(`${ym}-01`), "MMMM yyyy");
  } catch {
    return ym;
  }
}

// ─── Tab: Upcoming Renewals ─────────────────────────────────────────────────

function UpcomingRenewalsTab({ services }: { services: ClientService[] }) {
  const [rangeDays, setRangeDays] = useState("90");
  const [clientFilter, setClientFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const uniqueClients = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) map[s.clientId] = s.clientName;
    return Object.entries(map).sort(([, a], [, b]) => a.localeCompare(b));
  }, [services]);

  const filtered = useMemo(() => {
    const days = parseInt(rangeDays, 10);
    return services.filter((s) => {
      const dUntil = getDaysUntil(s.actualRenewalDate);
      const inRange = dUntil >= 0 && dUntil <= days;
      const matchClient = clientFilter === "all" || s.clientId === clientFilter;
      const matchCat = categoryFilter === "all" || s.serviceCategory === categoryFilter;
      return inRange && matchClient && matchCat;
    });
  }, [services, rangeDays, clientFilter, categoryFilter]);

  const grouped = groupByMonth(filtered, "actualRenewalDate");
  const totalValue = filtered.reduce((sum, s) => sum + (s.providerCost ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Time Range</Label>
            <Select value={rangeDays} onValueChange={setRangeDays}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Next 30 Days</SelectItem>
                <SelectItem value="45">Next 45 Days</SelectItem>
                <SelectItem value="60">Next 60 Days</SelectItem>
                <SelectItem value="90">Next 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Client</Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {uniqueClients.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Service Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> services
          </span>
          <span className="text-muted-foreground">
            Estimated value:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(totalValue, "AED")}
            </span>
          </span>
        </div>
      </div>

      {/* Grouped table */}
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No upcoming renewals in the selected period.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {grouped.map(([ym, group]) => (
            <div key={ym}>
              <SectionHeader>{monthLabel(ym)} — {group.length} service{group.length !== 1 ? "s" : ""}</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/20">
                    <tr>
                      {["Client", "Service", "Provider", "Renewal Date", "Billing Due", "Billing Status", "Cost"].map((h) => (
                        <th key={h} className="h-9 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.map((svc) => (
                      <tr key={svc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[13px] whitespace-nowrap">{svc.clientName}</td>
                        <td className="px-4 py-2.5 text-[13px]">
                          <div>
                            <p className="font-medium whitespace-nowrap">{svc.serviceName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {SERVICE_CATEGORY_LABELS[svc.serviceCategory] ?? svc.serviceCategory}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-muted-foreground">{svc.providerName}</td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{formatDate(svc.actualRenewalDate)}</span>
                            <DaysChip dateStr={svc.actualRenewalDate} isRenewal />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{formatDate(svc.billingDueDate)}</span>
                            {isOverdue(svc.billingDueDate) && svc.billingStatus !== "billing_completed" && (
                              <span className="text-[11px] text-red-600 font-medium">Overdue</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <BillingStatusBadge status={svc.billingStatus} />
                        </td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-medium">
                          {svc.providerCost ? formatCurrency(svc.providerCost, svc.currency) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Billing Summary ───────────────────────────────────────────────────

function BillingSummaryTab({ services }: { services: ClientService[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return services;
    return services.filter((s) => s.billingStatus === statusFilter);
  }, [services, statusFilter]);

  const grouped = groupByMonth(filtered, "billingDueDate");
  const grandTotal = filtered.reduce((sum, s) => sum + (s.providerCost ?? 0), 0);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of services) {
      counts[s.billingStatus] = (counts[s.billingStatus] ?? 0) + 1;
    }
    return counts;
  }, [services]);

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BILLING_STATUSES.map((bs) => (
          <button
            key={bs}
            onClick={() => setStatusFilter(statusFilter === bs ? "all" : bs)}
            className={cn(
              "text-left rounded-xl border p-3 transition-all",
              statusFilter === bs
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:bg-muted/30"
            )}
          >
            <p className="text-lg font-bold">{statusCounts[bs] ?? 0}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {BILLING_STATUS_LABELS[bs]}
            </p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> records
          {statusFilter !== "all" && (
            <> &mdash; filtered by <span className="font-medium">{BILLING_STATUS_LABELS[statusFilter as BillingStatus]}</span></>
          )}
        </p>
        {statusFilter !== "all" && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStatusFilter("all")}>
            Clear filter
          </Button>
        )}
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No billing records match the current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {grouped.map(([ym, group]) => {
            const monthTotal = group.reduce((sum, s) => sum + (s.providerCost ?? 0), 0);
            return (
              <div key={ym}>
                <SectionHeader>
                  {monthLabel(ym)} — {group.length} record{group.length !== 1 ? "s" : ""} · {formatCurrency(monthTotal, "AED")}
                </SectionHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/20">
                      <tr>
                        {["Client", "Service", "Billing Due Date", "Billing Status", "Cost (AED)"].map((h) => (
                          <th key={h} className="h-9 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.map((svc) => (
                        <tr key={svc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-[13px] whitespace-nowrap">{svc.clientName}</td>
                          <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{svc.serviceName}</td>
                          <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{formatDate(svc.billingDueDate)}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <BillingStatusBadge status={svc.billingStatus} />
                          </td>
                          <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-medium">
                            {svc.providerCost != null ? svc.providerCost.toLocaleString("en-AE") : "—"}
                          </td>
                        </tr>
                      ))}
                      {/* Subtotal row */}
                      <tr className="bg-muted/30 font-semibold">
                        <td colSpan={4} className="px-4 py-2 text-[12px] text-right text-muted-foreground">
                          Month subtotal
                        </td>
                        <td className="px-4 py-2 text-[13px] whitespace-nowrap">
                          {monthTotal.toLocaleString("en-AE")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {/* Grand total */}
          <div className="border-t border-border bg-muted/50 px-4 py-3 flex justify-end">
            <p className="text-sm font-semibold">
              Grand Total: <span className="text-primary ml-1">{formatCurrency(grandTotal, "AED")}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: By Client ─────────────────────────────────────────────────────────

function ByClientTab({ services }: { services: ClientService[] }) {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const clientGroups = useMemo(() => {
    const map: Record<string, { name: string; services: ClientService[] }> = {};
    for (const svc of services) {
      if (!map[svc.clientId]) map[svc.clientId] = { name: svc.clientName, services: [] };
      map[svc.clientId].services.push(svc);
    }
    return Object.entries(map)
      .map(([id, { name, services: svcs }]) => {
        const upcomingCount = svcs.filter((s) => isUpcomingWithin(s.actualRenewalDate, 90)).length;
        const totalValue = svcs.reduce((sum, s) => sum + (s.providerCost ?? 0), 0);
        return { id, name, services: svcs, upcomingCount, totalValue };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  const toggleClient = (id: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <SummaryKPI
          label="Total Clients"
          value={clientGroups.length}
          icon={Users}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryKPI
          label="Total Services"
          value={services.length}
          icon={Server}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryKPI
          label="Total Est. Value"
          value={formatCurrency(services.reduce((s, x) => s + (x.providerCost ?? 0), 0), "AED")}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {clientGroups.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No clients found.</div>
        ) : (
          clientGroups.map((client) => {
            const isOpen = expandedClients.has(client.id);
            return (
              <div key={client.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => toggleClient(client.id)}
                >
                  <span className="text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{client.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground shrink-0">
                    <span>
                      <span className="font-medium text-foreground">{client.services.length}</span> services
                    </span>
                    <span>
                      <span className="font-medium text-orange-600">{client.upcomingCount}</span> upcoming (90d)
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(client.totalValue, "AED")}
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-muted/10 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/20">
                        <tr>
                          {["Service", "Category", "Provider", "Renewal Date", "Billing Status", "Cost"].map((h) => (
                            <th key={h} className="h-8 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {client.services.map((svc) => (
                          <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-[13px] whitespace-nowrap">{svc.serviceName}</td>
                            <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-muted-foreground">
                              {SERVICE_CATEGORY_LABELS[svc.serviceCategory] ?? svc.serviceCategory}
                            </td>
                            <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-muted-foreground">{svc.providerName}</td>
                            <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">
                              <div className="flex flex-col">
                                <span>{formatDate(svc.actualRenewalDate)}</span>
                                <DaysChip dateStr={svc.actualRenewalDate} />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <BillingStatusBadge status={svc.billingStatus} />
                            </td>
                            <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-medium">
                              {svc.providerCost ? formatCurrency(svc.providerCost, svc.currency) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Tab: By Provider ───────────────────────────────────────────────────────

function ByProviderTab({
  services,
  providers,
}: {
  services: ClientService[];
  providers: ServiceProvider[];
}) {
  const providerGroups = useMemo(() => {
    const map: Record<string, { name: string; category: string; services: ClientService[] }> = {};
    for (const svc of services) {
      if (!map[svc.providerId]) {
        const prov = providers.find((p) => p.id === svc.providerId);
        map[svc.providerId] = {
          name: svc.providerName,
          category: prov ? PROVIDER_CATEGORY_LABELS[prov.category] : "Other",
          services: [],
        };
      }
      map[svc.providerId].services.push(svc);
    }
    return Object.entries(map)
      .map(([id, { name, category, services: svcs }]) => ({
        id,
        name,
        category,
        count: svcs.length,
        totalCost: svcs.reduce((sum, s) => sum + (s.providerCost ?? 0), 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [services, providers]);

  const chartData = providerGroups.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    services: p.count,
    cost: p.totalCost,
  }));

  const pieData = providerGroups.map((p) => ({
    name: p.name,
    value: p.count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Services per Provider</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${v} services`, "Count"]}
                  />
                  <Bar dataKey="services" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribution by Provider</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Provider", "Category", "Total Services", "Total Estimated Cost"].map((h) => (
                  <th key={h} className="h-10 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {providerGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                    No provider data available.
                  </td>
                </tr>
              ) : (
                providerGroups.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[13px] whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">
                      <Badge variant="outline" className="text-xs font-normal">{p.category}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-medium">{p.count}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-medium">
                      {formatCurrency(p.totalCost, "AED")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Overdue & Critical ────────────────────────────────────────────────

function OverdueCriticalTab({ services }: { services: ClientService[] }) {
  const today = new Date().toISOString().slice(0, 10);

  const overdueItems = useMemo(
    () =>
      services
        .filter(
          (s) =>
            isOverdue(s.billingDueDate) &&
            s.billingStatus !== "billing_completed" &&
            s.billingStatus !== "skipped"
        )
        .map((s) => ({ ...s, daysOverdue: Math.abs(getDaysUntil(s.billingDueDate)) }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [services]
  );

  const criticalItems = useMemo(
    () =>
      services
        .filter(
          (s) =>
            isUpcomingWithin(s.actualRenewalDate, 7) &&
            s.billingStatus !== "billing_completed"
        )
        .map((s) => ({ ...s, daysUntilRenewal: getDaysUntil(s.actualRenewalDate) }))
        .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal),
    [services]
  );

  const TableSection = ({
    title,
    icon: Icon,
    iconColor,
    rowBg,
    items,
    emptyMsg,
    renderExtra,
  }: {
    title: string;
    icon: ElementType;
    iconColor: string;
    rowBg: string;
    items: (ClientService & { daysOverdue?: number; daysUntilRenewal?: number })[];
    emptyMsg: string;
    renderExtra: (item: ClientService & { daysOverdue?: number; daysUntilRenewal?: number }) => ReactNode | null;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">{emptyMsg}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {["Client", "Service", "Provider", "Renewal Date", "Billing Due", "Status", "Days"].map((h) => (
                    <th key={h} className="h-9 px-4 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((svc) => (
                  <tr key={svc.id} className={cn("transition-colors hover:opacity-90", rowBg)}>
                    <td className="px-4 py-2.5 font-medium text-[13px] whitespace-nowrap">{svc.clientName}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{svc.serviceName}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-muted-foreground">{svc.providerName}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{formatDate(svc.actualRenewalDate)}</td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{formatDate(svc.billingDueDate)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <BillingStatusBadge status={svc.billingStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-[13px] whitespace-nowrap font-semibold">
                      {renderExtra(svc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <TableSection
        title="Overdue Billing"
        icon={AlertTriangle}
        iconColor="text-red-500"
        rowBg="bg-red-50/40"
        items={overdueItems}
        emptyMsg="No overdue billing items."
        renderExtra={(item) => (
          <span className="text-red-600">
            {item.daysOverdue}d overdue
          </span>
        )}
      />
      <TableSection
        title="Critical Renewals (within 7 days)"
        icon={TrendingUp}
        iconColor="text-orange-500"
        rowBg="bg-orange-50/40"
        items={criticalItems}
        emptyMsg="No critical renewals within 7 days."
        renderExtra={(item) => (
          <span className="text-orange-600">
            {item.daysUntilRenewal === 0 ? "Today" : `${item.daysUntilRenewal}d left`}
          </span>
        )}
      />
    </div>
  );
}

// ─── Renewals per month bar chart ───────────────────────────────────────────

function RenewalsBarChart({ services }: { services: ClientService[] }) {
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(addMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      const label = format(monthStart, "MMM yy");
      const count = services.filter((s) => {
        const d = s.actualRenewalDate;
        return d >= format(monthStart, "yyyy-MM-dd") && d <= format(monthEnd, "yyyy-MM-dd");
      }).length;
      return { month: label, renewals: count };
    });
  }, [services]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Renewals Over Next 6 Months</CardTitle>
        <CardDescription>Count of services renewing each month</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`${v}`, "Renewals"]}
            />
            <Bar dataKey="renewals" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RenewalReportsPage() {
  const [services, setServices] = useState<ClientService[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcs, provs] = await Promise.all([
        getClientServices(),
        getServiceProviders(),
      ]);
      setServices(svcs);
      setProviders(provs);
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const overdueBillingCount = useMemo(
    () =>
      services.filter(
        (s) =>
          isOverdue(s.billingDueDate) &&
          s.billingStatus !== "billing_completed" &&
          s.billingStatus !== "skipped"
      ).length,
    [services]
  );

  const criticalCount = useMemo(
    () =>
      services.filter(
        (s) =>
          isUpcomingWithin(s.actualRenewalDate, 7) &&
          s.billingStatus !== "billing_completed"
      ).length,
    [services]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewal Reports</h2>
          <p className="text-sm text-muted-foreground">
            Analytics and summaries for service renewals and billing
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* Overview KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryKPI
            label="Total Services"
            value={services.length}
            icon={Server}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <SummaryKPI
            label="Active Clients"
            value={new Set(services.map((s) => s.clientId)).size}
            icon={Users}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
          />
          <SummaryKPI
            label="Overdue Billing"
            value={overdueBillingCount}
            icon={AlertTriangle}
            colorClass="text-red-600"
            bgClass="bg-red-50"
          />
          <SummaryKPI
            label="Critical Renewals"
            value={criticalCount}
            icon={TrendingUp}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
          />
        </div>
      )}

      {/* Monthly bar chart overview */}
      {!loading && <RenewalsBarChart services={services} />}

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="flex w-full overflow-x-auto sm:w-auto sm:inline-flex">
          <TabsTrigger value="upcoming">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="by-client">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            By Client
          </TabsTrigger>
          <TabsTrigger value="by-provider">
            <Server className="h-3.5 w-3.5 mr-1.5" />
            By Provider
          </TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Overdue &amp; Critical
            {(overdueBillingCount + criticalCount) > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {overdueBillingCount + criticalCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <UpcomingRenewalsTab services={services} />
          )}
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <BillingSummaryTab services={services} />
          )}
        </TabsContent>

        <TabsContent value="by-client" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <ByClientTab services={services} />
          )}
        </TabsContent>

        <TabsContent value="by-provider" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <ByProviderTab services={services} providers={providers} />
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <OverdueCriticalTab services={services} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
