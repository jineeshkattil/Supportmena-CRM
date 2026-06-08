"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Globe,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Server,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/tables/DataTable";
import {
  getServiceProviders,
  updateServiceProvider,
} from "@/services/renewal-firestore";
import {
  PROVIDER_CATEGORY_LABELS,
} from "@/lib/renewal-utils";
import { formatDate } from "@/lib/utils";
import type { ServiceProvider, ProviderCategory } from "@/types/renewal";

const CATEGORY_COLORS: Record<ProviderCategory, string> = {
  domain: "info",
  hosting: "purple",
  email: "success",
  ssl: "warning",
  cloud: "default",
  software: "orange",
  other: "secondary",
} as const;

export default function ServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await getServiceProviders();
      setProviders(data);
    } catch {
      toast.error("Failed to load service providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleStatus = async (provider: ServiceProvider) => {
    const newStatus = provider.status === "active" ? "inactive" : "active";
    try {
      await updateServiceProvider(provider.id, { status: newStatus });
      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, status: newStatus } : p
        )
      );
      toast.success(
        `Provider ${newStatus === "active" ? "activated" : "deactivated"}`
      );
    } catch {
      toast.error("Failed to update provider status");
    }
  };

  const filteredProviders =
    categoryFilter === "all"
      ? providers
      : providers.filter((p) => p.category === categoryFilter);

  const columns: ColumnDef<ServiceProvider>[] = [
    {
      accessorKey: "providerCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.providerCode}
        </span>
      ),
    },
    {
      accessorKey: "providerName",
      header: "Provider",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Server className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {row.original.providerName}
            </p>
            {row.original.accountEmail && (
              <p className="text-xs text-muted-foreground truncate">
                {row.original.accountEmail}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = row.original.category;
        const color =
          CATEGORY_COLORS[cat] as
            | "info"
            | "purple"
            | "success"
            | "warning"
            | "default"
            | "orange"
            | "secondary";
        return (
          <Badge variant={color}>
            {PROVIDER_CATEGORY_LABELS[cat] ?? cat}
          </Badge>
        );
      },
    },
    {
      accessorKey: "websiteUrl",
      header: "Website",
      cell: ({ row }) =>
        row.original.websiteUrl ? (
          <a
            href={row.original.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">
              {row.original.websiteUrl.replace(/^https?:\/\//, "")}
            </span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "success" : "secondary"}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/renewals/providers/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/renewals/providers/${row.original.id}?edit=true`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={
              row.original.status === "active"
                ? "Deactivate provider"
                : "Activate provider"
            }
            onClick={() => handleToggleStatus(row.original)}
          >
            {row.original.status === "active" ? (
              <ToggleRight className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const totalProviders = providers.length;
  const activeProviders = providers.filter((p) => p.status === "active").length;

  // Category distribution for the 3rd stat
  const categoryCount = providers.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

  const categoryOptions = Object.entries(PROVIDER_CATEGORY_LABELS) as [
    ProviderCategory,
    string,
  ][];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Service Providers</h2>
          <p className="text-sm text-muted-foreground">
            {totalProviders} provider{totalProviders !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/renewals/providers/new">
            <Plus className="h-4 w-4 mr-2" />
            New Provider
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Providers",
            value: totalProviders,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active",
            value: activeProviders,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: topCategory
              ? `Top: ${PROVIDER_CATEGORY_LABELS[topCategory[0] as ProviderCategory]}`
              : "Categories",
            value: topCategory ? topCategory[1] : 0,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3 flex items-center gap-3 bg-card"
          >
            <div className={`rounded-lg p-1.5 ${s.bg}`}>
              <Server className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter + Table */}
      <DataTable
        columns={columns}
        data={filteredProviders}
        searchKey="providerName"
        searchPlaceholder="Search providers..."
        loading={loading}
        emptyMessage="No service providers found. Add your first provider."
        emptyIcon={<Server className="h-8 w-8 opacity-30" />}
        toolbar={
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
