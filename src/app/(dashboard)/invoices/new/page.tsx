"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
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
import { Client } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_VAT } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { addDays } from "date-fns";

interface LineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatPct: number;
}

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  invoiceDate: z.string(),
  dueDate: z.string(),
  invoiceType: z.enum(["tax_invoice", "proforma", "advance", "final", "credit_note"]),
  notes: z.string().optional(),
  terms: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

let counter = 0;

export default function NewInvoicePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: `li-${++counter}`, itemName: "", description: "", quantity: 1, unitPrice: 0, vatPct: DEFAULT_VAT },
  ]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      invoiceType: "tax_invoice",
    },
  });

  useEffect(() => {
    getDocs(query(collection(db, "clients"), orderBy("companyName")))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client)))
      .catch(() => setClients([
        { id: "1", clientCode: "CL-0001", companyName: "Al Noor Technologies", clientType: "company", status: "active", createdAt: null as never, updatedAt: null as never },
      ]));
  }, []);

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = (subtotal * DEFAULT_VAT) / 100;
  const grandTotal = subtotal + vatAmount;

  const onSubmit = async (data: FormData) => {
    const clientName = clients.find((c) => c.id === data.clientId)?.companyName || "";
    setSaving(true);
    try {
      const num = Math.floor(Math.random() * 9000) + 1000;
      await addDoc(collection(db, "invoices"), {
        invoiceNumber: `INV-${num}`,
        clientId: data.clientId,
        clientName,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        invoiceType: data.invoiceType,
        items: lineItems.map((i) => ({
          id: i.id, itemName: i.itemName, description: i.description,
          quantity: i.quantity, unitPrice: i.unitPrice, vatPercentage: i.vatPct,
          total: i.quantity * i.unitPrice,
        })),
        subtotal,
        discount: 0,
        vatAmount,
        grandTotal,
        paidAmount: 0,
        balanceAmount: grandTotal,
        notes: data.notes,
        terms: data.terms,
        status: "draft",
        createdBy: profile?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Invoice created successfully");
      router.push("/invoices");
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-lg font-semibold">New Invoice</h2>
          <p className="text-sm text-muted-foreground">Create a new tax invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Client *</Label>
                <Select onValueChange={(v) => setValue("clientId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Invoice Type</Label>
                <Select defaultValue="tax_invoice" onValueChange={(v) => setValue("invoiceType", v as "tax_invoice" | "proforma" | "advance" | "final" | "credit_note")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                    <SelectItem value="proforma">Proforma Invoice</SelectItem>
                    <SelectItem value="advance">Advance Invoice</SelectItem>
                    <SelectItem value="final">Final Invoice</SelectItem>
                    <SelectItem value="credit_note">Credit Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input type="date" {...register("invoiceDate")} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" {...register("dueDate")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setLineItems((p) => [...p, { id: `li-${++counter}`, itemName: "", description: "", quantity: 1, unitPrice: 0, vatPct: DEFAULT_VAT }])}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-1.5 sm:gap-2 items-start">
                <div className="col-span-5">
                  <Input placeholder="Item / Service description" value={item.itemName} onChange={(e) => updateLine(item.id, "itemName", e.target.value)} className="text-sm" />
                </div>
                <div className="col-span-2">
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateLine(item.id, "quantity", parseFloat(e.target.value) || 1)} className="text-sm text-right" />
                </div>
                <div className="col-span-3">
                  <Input type="number" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateLine(item.id, "unitPrice", parseFloat(e.target.value) || 0)} className="text-sm text-right" />
                </div>
                <div className="col-span-1 pt-2 text-sm font-medium text-right">
                  {(item.quantity * item.unitPrice).toFixed(0)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => lineItems.length > 1 && setLineItems((p) => p.filter((i) => i.id !== item.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT ({DEFAULT_VAT}%)</span><span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Notes for the client..." {...register("notes")} />
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea rows={2} defaultValue="Payment due within 30 days of invoice date." {...register("terms")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline"><Link href="/invoices">Cancel</Link></Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
