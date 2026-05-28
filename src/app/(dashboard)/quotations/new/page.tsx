"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2, Package, User } from "lucide-react";
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Client, InventoryItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_VAT, RESOURCE_TYPES } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { addDays } from "date-fns";

interface LineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  vatPct: number;
  inventoryItemId?: string;
  availableStock?: number;
}

interface ResourceItem {
  id: string;
  resourceType: string;
  description: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
}

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  quotationDate: z.string(),
  validUntil: z.string(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
});
type FormData = z.infer<typeof schema>;

let lineCounter = 0;
let resourceCounter = 0;

export default function NewQuotationPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: `li-${++lineCounter}`, itemName: "", description: "", quantity: 1, unitPrice: 0, costPrice: 0, discount: 0, vatPct: DEFAULT_VAT },
  ]);
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quotationDate: format(new Date(), "yyyy-MM-dd"),
      validUntil: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      discount: 0,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const [clientSnap, invSnap] = await Promise.all([
          getDocs(query(collection(db, "clients"), orderBy("companyName"))),
          getDocs(query(collection(db, "inventory"), orderBy("itemName"))),
        ]);
        setClients(clientSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
        setInventoryItems(invSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as InventoryItem));
      } catch {
        setClients([
          { id: "1", clientCode: "CL-0001", companyName: "Al Noor Technologies", clientType: "company", status: "active", createdAt: null as never, updatedAt: null as never },
          { id: "2", clientCode: "CL-0002", companyName: "Gulf Smart Systems", clientType: "company", status: "active", createdAt: null as never, updatedAt: null as never },
        ]);
      }
    }
    load();
  }, []);

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `li-${++lineCounter}`, itemName: "", description: "", quantity: 1, unitPrice: 0, costPrice: 0, discount: 0, vatPct: DEFAULT_VAT },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addResourceItem = () => {
    setResourceItems((prev) => [
      ...prev,
      { id: `ri-${++resourceCounter}`, resourceType: "Technician", description: "", quantity: 1, unitCost: 0, sellingPrice: 0 },
    ]);
  };

  const updateResource = (id: string, field: keyof ResourceItem, value: string | number) => {
    setResourceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeResource = (id: string) => {
    setResourceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const selectInventoryItem = (lineId: string, invItem: InventoryItem) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              itemName: invItem.itemName,
              description: `${invItem.brand || ""} ${invItem.model || ""}`.trim(),
              unitPrice: invItem.sellingPrice,
              costPrice: invItem.unitCost,
              inventoryItemId: invItem.id,
              availableStock: invItem.availableStock,
              vatPct: DEFAULT_VAT,
            }
          : item
      )
    );
  };

  const discount = watch("discount") || 0;

  const materialSubtotal = lineItems.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discountAmt = (lineTotal * item.discount) / 100;
    return sum + lineTotal - discountAmt;
  }, 0);

  const resourceSubtotal = resourceItems.reduce((sum, r) => sum + r.quantity * r.sellingPrice, 0);
  const subtotal = materialSubtotal + resourceSubtotal;
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * DEFAULT_VAT) / 100;
  const grandTotal = afterDiscount + vatAmount;

  const materialCostTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const resourceCostTotal = resourceItems.reduce((sum, r) => sum + r.quantity * r.unitCost, 0);
  const totalCost = materialCostTotal + resourceCostTotal;
  const grossProfit = grandTotal - totalCost;
  const marginPct = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;

  const onSubmit = async (data: FormData) => {
    const clientName = clients.find((c) => c.id === data.clientId)?.companyName || "";
    if (!clientName) { toast.error("Select a client"); return; }

    setSaving(true);
    try {
      const counter = Math.floor(Math.random() * 9000) + 1000;
      await addDoc(collection(db, "quotations"), {
        quotationNumber: `QT-${counter}`,
        clientId: data.clientId,
        clientName,
        quotationDate: data.quotationDate,
        validUntil: data.validUntil,
        items: lineItems.map((i) => ({
          id: i.id, itemType: i.inventoryItemId ? "inventory" : "custom",
          inventoryItemId: i.inventoryItemId, itemName: i.itemName,
          description: i.description, quantity: i.quantity, unitPrice: i.unitPrice,
          costPrice: i.costPrice, discount: i.discount, vatPercentage: i.vatPct,
          total: i.quantity * i.unitPrice * (1 - i.discount / 100),
        })),
        resourceItems: resourceItems.map((r) => ({
          id: r.id, resourceType: r.resourceType, description: r.description,
          quantity: r.quantity, unitCost: r.unitCost, sellingPrice: r.sellingPrice,
          total: r.quantity * r.sellingPrice,
        })),
        subtotal,
        materialTotal: materialSubtotal,
        resourceCostTotal: resourceSubtotal,
        discount: discountAmount,
        vatAmount,
        grandTotal,
        estimatedProfit: grossProfit,
        marginPercentage: marginPct,
        notes: data.notes,
        terms: data.terms || "Payment due within 30 days. Prices valid for the quotation validity period.",
        status: "draft",
        createdBy: profile?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Quotation created successfully");
      router.push("/quotations");
    } catch {
      toast.error("Failed to create quotation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/quotations"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-lg font-semibold">New Quotation</h2>
            <p className="text-sm text-muted-foreground">Create a new quotation</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Client & Dates */}
            <Card>
              <CardHeader><CardTitle className="text-base">Quotation Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select onValueChange={(v) => setValue("clientId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Date</Label>
                    <Input type="date" {...register("quotationDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" {...register("validUntil")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Products & Services</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Inventory quick-pick */}
                {inventoryItems.length > 0 && (
                  <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />Quick pick from inventory
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {inventoryItems.slice(0, 8).map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => {
                            const emptyLine = lineItems.find((l) => !l.itemName);
                            if (emptyLine) {
                              selectInventoryItem(emptyLine.id, inv);
                            } else {
                              const newId = `li-${++lineCounter}`;
                              setLineItems((prev) => [...prev, { id: newId, itemName: inv.itemName, description: `${inv.brand || ""} ${inv.model || ""}`.trim(), quantity: 1, unitPrice: inv.sellingPrice, costPrice: inv.unitCost, discount: 0, vatPct: DEFAULT_VAT, inventoryItemId: inv.id, availableStock: inv.availableStock }]);
                            }
                          }}
                          className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-primary/10 hover:border-primary transition-colors"
                        >
                          {inv.itemName.length > 25 ? inv.itemName.slice(0, 25) + "..." : inv.itemName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Disc %</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1" />
                </div>
                <Separator />

                {lineItems.map((item) => {
                  const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
                  const stockWarning = item.availableStock !== undefined && item.quantity > item.availableStock;
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-start">
                        <div className="col-span-4">
                          <Input
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) => updateLine(item.id, "itemName", e.target.value)}
                            className="text-sm"
                          />
                          {item.inventoryItemId && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Package className="h-2.5 w-2.5" />
                              Stock: {item.availableStock} avail.
                              {stockWarning && <span className="text-orange-500 font-medium ml-1">⚠ Insufficient</span>}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLine(item.id, "quantity", parseFloat(e.target.value) || 1)}
                            className="text-sm text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLine(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="text-sm text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => updateLine(item.id, "discount", parseFloat(e.target.value) || 0)}
                            className="text-sm text-right"
                          />
                        </div>
                        <div className="col-span-1 pt-2 text-sm font-medium text-right">
                          {lineTotal.toFixed(0)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) => updateLine(item.id, "description", e.target.value)}
                        className="text-xs text-muted-foreground col-span-12"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Resource/Labour */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Labour & Resources</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addResourceItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Resource
                </Button>
              </CardHeader>
              <CardContent>
                {resourceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No resource costs added. Click &quot;Add Resource&quot; to include labour costs.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {resourceItems.map((r) => {
                      const total = r.quantity * r.sellingPrice;
                      return (
                        <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3">
                            <Select
                              defaultValue={r.resourceType}
                              onValueChange={(v) => updateResource(r.id, "resourceType", v)}
                            >
                              <SelectTrigger className="text-sm h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESOURCE_TYPES.map((rt) => (
                                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="Description"
                              value={r.description}
                              onChange={(e) => updateResource(r.id, "description", e.target.value)}
                              className="text-sm h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              placeholder="Qty/Days"
                              value={r.quantity}
                              onChange={(e) => updateResource(r.id, "quantity", parseFloat(e.target.value) || 1)}
                              className="text-sm h-8 text-right"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              placeholder="Sell price"
                              value={r.sellingPrice}
                              onChange={(e) => updateResource(r.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                              className="text-sm h-8 text-right"
                            />
                          </div>
                          <div className="col-span-1 text-sm font-medium text-right">
                            {total.toFixed(0)}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeResource(r.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea rows={2} placeholder="Internal notes (not shown on PDF)..." {...register("notes")} />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea rows={3} placeholder="Payment terms, warranty, validity..." {...register("terms")} defaultValue="Payment due within 30 days. Prices valid for the quotation validity period. All prices are in AED and inclusive of installation unless otherwise stated." />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Summary Panel */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Quotation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials</span>
                      <span>{formatCurrency(materialSubtotal)}</span>
                    </div>
                    {resourceSubtotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resources</span>
                        <span>{formatCurrency(resourceSubtotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Discount */}
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-7 w-20 text-xs text-right"
                      {...register("discount")}
                    />
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>- Discount</span>
                      <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT ({DEFAULT_VAT}%)</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-base">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>

                  <Separator />

                  {/* Internal margin — not shown on PDF */}
                  <div className="space-y-1.5 text-xs bg-muted/30 rounded-lg p-3">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Internal — Not on PDF</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost Total</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Profit</span>
                      <span className={grossProfit >= 0 ? "text-green-600 font-medium" : "text-red-600"}>
                        {formatCurrency(grossProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin</span>
                      <span className={`font-medium ${marginPct >= 20 ? "text-green-600" : marginPct >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                        {marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save as Draft"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleSubmit(async (data) => {
                  // Send for approval
                })}>
                  Send for Approval
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
