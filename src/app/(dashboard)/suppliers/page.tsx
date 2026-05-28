"use client";

import { useState, useEffect } from "react";
import { Plus, Truck, Eye, Pencil } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Supplier } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "suppliers"), orderBy("createdAt", "desc")));
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Supplier));
      } catch {
        setSuppliers([
          { id: "1", supplierCode: "SUP-001", companyName: "Hikvision UAE", contactPerson: "David Chen", email: "sales@hikvision.ae", phone: "+971 4 234 5678", status: "active", productCategories: ["CCTV Cameras", "DVR/NVR"], createdAt: null as never, updatedAt: null as never },
          { id: "2", supplierCode: "SUP-002", companyName: "TP-Link ME", contactPerson: "Ahmad Siddiqui", email: "info@tplink.me", phone: "+971 4 345 6789", status: "active", productCategories: ["Switches", "Routers", "Access Points"], createdAt: null as never, updatedAt: null as never },
          { id: "3", supplierCode: "SUP-003", companyName: "Panduit Gulf", email: "orders@panduit.ae", phone: "+971 4 456 7890", status: "active", productCategories: ["Cables", "Accessories"], createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: "supplierCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.supplierCode}</span>
    )},
    { accessorKey: "companyName", header: "Supplier", cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.companyName}</p>
        {row.original.contactPerson && (
          <p className="text-xs text-muted-foreground">{row.original.contactPerson}</p>
        )}
      </div>
    )},
    { accessorKey: "email", header: "Contact", cell: ({ row }) => (
      <div className="text-sm">
        <p className="text-muted-foreground">{row.original.email}</p>
        <p className="text-xs text-muted-foreground">{row.original.phone}</p>
      </div>
    )},
    { accessorKey: "productCategories", header: "Categories", cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {(row.original.productCategories || []).slice(0, 2).map((cat) => (
          <span key={cat} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{cat}</span>
        ))}
      </div>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "success" : "secondary"} className="capitalize">
        {row.original.status}
      </Badge>
    )},
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/suppliers/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/suppliers/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Suppliers</h2>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers/new">
            <Plus className="h-4 w-4 mr-2" />Add Supplier
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="companyName"
        searchPlaceholder="Search suppliers..."
        loading={loading}
        emptyMessage="No suppliers found."
        emptyIcon={<Truck className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
