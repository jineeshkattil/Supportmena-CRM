"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const schema = z.object({
  itemName: z.string().min(2, "Item name required"),
  categoryName: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  unitCost: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  currentStock: z.coerce.number().min(0).default(0),
  minimumStockLevel: z.coerce.number().min(0).default(5),
  warrantyPeriod: z.string().optional(),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentStock: 0, minimumStockLevel: 5, unitCost: 0, sellingPrice: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const num = Math.floor(Math.random() * 9000) + 1000;
      await addDoc(collection(db, "inventory"), {
        ...data,
        itemCode: `INV-${num}`,
        reservedStock: 0,
        availableStock: data.currentStock,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Item added to inventory");
      router.push("/inventory");
    } catch {
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/inventory"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-lg font-semibold">Add Inventory Item</h2>
          <p className="text-sm text-muted-foreground">Add a new item to inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Item Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input placeholder="Hikvision 4MP Dome Camera" {...register("itemName")} />
              {errors.itemName && <p className="text-xs text-destructive">{errors.itemName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="CCTV Cameras" {...register("categoryName")} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input placeholder="Hikvision" {...register("brand")} />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input placeholder="DS-2CD2143G2-I" {...register("model")} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input placeholder="HK-DS2143" {...register("sku")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Item description..." {...register("description")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pricing & Stock</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Cost (AED) *</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register("unitCost")} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (AED) *</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register("sellingPrice")} />
              </div>
              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input type="number" min="0" placeholder="0" {...register("currentStock")} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stock Level</Label>
                <Input type="number" min="0" placeholder="5" {...register("minimumStockLevel")} />
              </div>
              <div className="space-y-2">
                <Label>Warranty Period</Label>
                <Input placeholder="1 year" {...register("warrantyPeriod")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline"><Link href="/inventory">Cancel</Link></Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
