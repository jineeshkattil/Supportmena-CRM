"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  Truck,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

const DEMO: InventoryItem = {
  id: "demo",
  itemCode: "INV-001",
  itemName: "Hikvision DS-2CD2143G2-I 4MP Dome Camera",
  categoryName: "CCTV Cameras",
  brand: "Hikvision",
  model: "DS-2CD2143G2-I",
  sku: "HK-DS2143",
  barcode: "8901234567890",
  serialNumberRequired: true,
  supplierName: "Smart Vision Trading LLC",
  unitCost: 280,
  sellingPrice: 420,
  currentStock: 25,
  reservedStock: 5,
  availableStock: 20,
  minimumStockLevel: 10,
  warrantyPeriod: "2 years",
  status: "active",
  description:
    "4 MP indoor IR fixed dome network camera with EXIR 2.0, 30 m IR range, H.265+ compression.",
  createdAt: null as never,
  updatedAt: null as never,
};

export default function InventoryDetailPage() {
  const { id } = useParams() as { id: string };
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "inventory", id));
        if (snap.exists()) {
          setItem({ id: snap.id, ...snap.data() } as InventoryItem);
        } else {
          setItem({ ...DEMO, id });
        }
      } catch {
        setItem({ ...DEMO, id });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 col-span-2" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!item) {
    return <p className="text-muted-foreground">Item not found.</p>;
  }

  const isLowStock =
    item.availableStock <= item.minimumStockLevel && item.availableStock > 0;
  const isOutOfStock = item.availableStock === 0;
  const margin =
    item.sellingPrice > 0
      ? ((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100
      : 0;
  const stockValue = item.currentStock * item.unitCost;

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{item.itemName}</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {item.itemCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/inventory/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/30">
            <Package className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground mt-2">
              {item.categoryName || "Uncategorized"}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">Item Details</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {item.status}
                </Badge>
                {isOutOfStock && (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
                {isLowStock && <Badge variant="warning">Low Stock</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {item.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium">{item.brand}</span>
                </div>
              )}
              {item.model && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium font-mono">{item.model}</span>
                </div>
              )}
              {item.sku && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-mono">{item.sku}</span>
                </div>
              )}
              {item.barcode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barcode</span>
                  <span className="font-mono">{item.barcode}</span>
                </div>
              )}
              {item.categoryName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{item.categoryName}</span>
                </div>
              )}
              {item.serialNumberRequired && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serialized</span>
                  <Badge variant="info" className="text-xs">
                    Yes
                  </Badge>
                </div>
              )}
            </div>
            {item.description && (
              <>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={
            isLowStock || isOutOfStock ? "border-orange-200 bg-orange-50/30" : ""
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Levels
              {(isLowStock || isOutOfStock) && (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className="text-xl font-bold">{item.currentStock}</p>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Reserved</p>
                <p className="text-xl font-bold text-amber-600">
                  {item.reservedStock}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Available</p>
                <p
                  className={`text-xl font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"}`}
                >
                  {item.availableStock}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Min Level</p>
                <p className="text-xl font-bold">{item.minimumStockLevel}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stock Value</span>
              <span className="font-semibold">
                {formatCurrency(stockValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Cost</span>
              <span className="font-medium">
                {formatCurrency(item.unitCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling Price</span>
              <span className="font-medium">
                {formatCurrency(item.sellingPrice)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit / Unit</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(item.sellingPrice - item.unitCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margin</span>
              <span className="font-semibold text-green-600">
                {margin.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {item.supplierName && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">{item.supplierName}</p>
              {item.supplierId && (
                <Link
                  href={`/suppliers/${item.supplierId}`}
                  className="text-xs text-primary hover:underline"
                >
                  View supplier
                </Link>
              )}
            </CardContent>
          </Card>
        )}
        {item.warrantyPeriod && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Warranty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{item.warrantyPeriod}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
