"use client";

import { useState, useEffect, useMemo } from "react";
import { History, RefreshCw, Loader2, Search, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getRenewalAuditLogs } from "@/services/renewal-firestore";
import { cn, formatDate } from "@/lib/utils";
import type { RenewalAuditLog } from "@/types/renewal";
import { Timestamp } from "firebase/firestore";

// ─── Colour map for entity types ────────────────────────────────────────────

const ENTITY_TYPE_COLORS: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  service: "bg-indigo-100 text-indigo-700",
  provider: "bg-violet-100 text-violet-700",
  renewal_event: "bg-amber-100 text-amber-700",
  reminder: "bg-orange-100 text-orange-700",
  settings: "bg-gray-100 text-gray-700",
  document: "bg-teal-100 text-teal-700",
  extraction: "bg-cyan-100 text-cyan-700",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-emerald-100 text-emerald-700",
  reject: "bg-red-100 text-red-700",
  renew: "bg-indigo-100 text-indigo-700",
  import: "bg-purple-100 text-purple-700",
  export: "bg-gray-100 text-gray-700",
};

function getEntityColor(entityType: string): string {
  const key = entityType.toLowerCase().replace(/[^a-z_]/g, "");
  return ENTITY_TYPE_COLORS[key] ?? "bg-muted text-foreground/70";
}

function getActionColor(action: string): string {
  const key = action.toLowerCase().split("_")[0];
  return ACTION_COLORS[key] ?? "bg-muted text-foreground/70";
}

function formatTimestamp(ts: Timestamp | undefined | null): string {
  if (!ts) return "—";
  try {
    const d = ts.toDate();
    return d.toLocaleString("en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: ColumnDef<RenewalAuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => (
      <span className="text-[12px] text-muted-foreground whitespace-nowrap tabular-nums">
        {formatTimestamp(row.original.timestamp)}
      </span>
    ),
    sortingFn: (a, b) => {
      const at = a.original.timestamp?.toMillis() ?? 0;
      const bt = b.original.timestamp?.toMillis() ?? 0;
      return at - bt;
    },
  },
  {
    id: "user",
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => (
      <div>
        <p className="text-[13px] font-medium whitespace-nowrap">
          {row.original.userName || "System"}
        </p>
        {row.original.userId && row.original.userId !== row.original.userName && (
          <p className="text-[11px] text-muted-foreground font-mono">
            {row.original.userId.slice(0, 10)}…
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
          getActionColor(row.original.action)
        )}
      >
        {row.original.action}
      </span>
    ),
  },
  {
    accessorKey: "entityType",
    header: "Entity Type",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
          getEntityColor(row.original.entityType)
        )}
      >
        {row.original.entityType}
      </span>
    ),
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ row }) => (
      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
        {row.original.entityId ? row.original.entityId.slice(0, 12) + "…" : "—"}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="text-[13px] text-muted-foreground max-w-[320px] truncate">
        {row.original.description || "—"}
      </p>
    ),
  },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RenewalAuditPage() {
  const [logs, setLogs] = useState<RenewalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRenewalAuditLogs();
      setLogs(data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique entity types from loaded logs
  const entityTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.entityType).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  // Client-side filter (search + entity type)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((log) => {
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        (log.userName ?? "").toLowerCase().includes(q) ||
        (log.description ?? "").toLowerCase().includes(q) ||
        (log.entityType ?? "").toLowerCase().includes(q);
      const matchType =
        entityTypeFilter === "all" || log.entityType === entityTypeFilter;
      return matchSearch && matchType;
    });
  }, [logs, search, entityTypeFilter]);

  const hasActiveFilter = search || entityTypeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setEntityTypeFilter("all");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewal Audit Logs</h2>
          <p className="text-sm text-muted-foreground">
            Full history of all actions performed within the Renewals module
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

      {/* Stats row */}
      {!loading && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{logs.length}</span> total entries
          </span>
          {hasActiveFilter && (
            <span>
              <span className="font-medium text-foreground">{filtered.length}</span> matching filters
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by action, user, or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Entity Type</Label>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilter && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {logs.length} results
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Empty / loading state before table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-4 w-24 shrink-0" />
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No audit logs yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Actions performed in the renewals module will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={hasActiveFilter ? "No logs match the current filters." : "No audit logs found."}
          emptyIcon={<History className="h-8 w-8 opacity-30" />}
        />
      )}
    </div>
  );
}
