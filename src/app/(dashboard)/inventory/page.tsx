"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Eye, Pencil, AlertTriangle } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "inventory"), orderBy("createdAt", "desc")));
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InventoryItem));
      } catch {
        setItems([
          { id: "1", itemCode: "INV-001", itemName: "Hikvision DS-2CD2143G2-I 4MP Dome Camera", categoryName: "CCTV Cameras", brand: "Hikvision", model: "DS-2CD2143G2-I", sku: "HK-DS2143", currentStock: 25, reservedStock: 5, availableStock: 20, minimumStockLevel: 10, unitCost: 280, sellingPrice: 420, status: "active", createdAt: null as never, updatedAt: null as never },
          { id: "2", itemCode: "INV-002", itemName: "Dahua 8 Channel NVR", categoryName: "DVR/NVR", brand: "Dahua", model: "NVR2108HS-I2", sku: "DH-NVR2108", currentStock: 8, reservedStock: 2, availableStock: 6, minimumStockLevel: 5, unitCost: 650, sellingPrice: 950, status: "active", createdAt: null as never, updatedAt: null as never },
          { id: "3", itemCode: "INV-003", itemName: "Cat6 Cable (305m Box)", categoryName: "Cables", brand: "Panduit", sku: "CAT6-305M", currentStock: 3, reservedStock: 1, availableStock: 2, minimumStockLevel: 5, unitCost: 180, sellingPrice: 280, status: "active", createdAt: null as never, updatedAt: null as never },
          { id: "4", itemCode: "INV-004", itemName: "TP-Link 24-Port Managed Switch", categoryName: "Switches", brand: "TP-Link", model: "TL-SG2224P", sku: "TP-SG2224P", currentStock: 0, reservedStock: 0, availableStock: 0, minimumStockLevel: 3, unitCost: 1200, sellingPrice: 1800, status: "active", createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const getStockBadge = (item: InventoryItem) => {
    if (item.availableStock === 0) return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    if (item.availableStock <= item.minimumStockLevel) return <Badge variant="warning" className="text-xs">Low Stock</Badge>;
    return <Badge variant="success" className="text-xs">In Stock</Badge>;
  };

  const columns: ColumnDef<InventoryItem>[] = [
    { accessorKey: "itemCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.itemCode}</span>
    )},
    { accessorKey: "itemName", header: "Item", cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.itemName}</p>
        <p className="text-xs text-muted-foreground">{row.original.brand} {row.original.model && `· ${row.original.model}`}</p>
      </div>
    )},
    { accessorKey: "categoryName", header: "Category" },
    { accessorKey: "currentStock", header: "Stock", cell: ({ row }) => (
      <div className="text-sm">
        <div className="flex items-center gap-1.5">
          {row.original.availableStock <= row.original.minimumStockLevel && (
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          )}
          <span className="font-medium">{row.original.availableStock}</span>
          <span className="text-muted-foreground text-xs">avail.</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {row.original.currentStock} | Reserved: {row.original.reservedStock}
        </p>
      </div>
    )},
    { accessorKey: "unitCost", header: "Cost", cell: ({ row }) => (
      <span className="text-sm">{formatCurrency(row.original.unitCost)}</span>
    )},
    { accessorKey: "sellingPrice", header: "Sell Price", cell: ({ row }) => (
      <span className="text-sm font-medium">{formatCurrency(row.original.sellingPrice)}</span>
    )},
    { id: "stockStatus", header: "Status", cell: ({ row }) => getStockBadge(row.original) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/inventory/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <Link href={`/inventory/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    )},
  ];

  const totalValue = items.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0);
  const lowStockCount = items.filter((i) => i.availableStock <= i.minimumStockLevel && i.availableStock > 0).length;
  const outOfStockCount = items.filter((i) => i.availableStock === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Inventory</h2>
          <p className="text-sm text-muted-foreground">{items.length} items in stock</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/inventory/new">
            <Plus className="h-4 w-4 mr-2" />Add Item
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: items.length.toString() },
          { label: "Inventory Value", value: formatCurrency(totalValue) },
          { label: "Low Stock", value: lowStockCount.toString(), alert: lowStockCount > 0 },
          { label: "Out of Stock", value: outOfStockCount.toString(), alert: outOfStockCount > 0 },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 bg-card ${s.alert ? "border-orange-200" : ""}`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.alert ? "text-orange-600" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchKey="itemName"
        searchPlaceholder="Search inventory..."
        loading={loading}
        emptyMessage="No inventory items found."
        emptyIcon={<Package className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
