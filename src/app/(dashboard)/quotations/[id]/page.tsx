"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Trash2,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Quotation } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTATION_STATUSES } from "@/lib/constants";

const DEMO: Quotation = {
  id: "demo",
  quotationNumber: "QT-0001",
  clientId: "1",
  clientName: "Al Noor Technologies",
  quotationDate: "2024-07-01",
  validUntil: "2024-07-31",
  items: [
    {
      id: "i1",
      itemType: "inventory",
      itemName: "Hikvision 4MP Dome Camera",
      description: "Indoor IP camera with night vision",
      sku: "HK-DS2143",
      quantity: 8,
      unitPrice: 420,
      discount: 0,
      vatPercentage: 5,
      total: 3360,
    },
    {
      id: "i2",
      itemType: "inventory",
      itemName: "Dahua 8 Channel NVR",
      sku: "DH-NVR2108",
      quantity: 1,
      unitPrice: 950,
      discount: 0,
      vatPercentage: 5,
      total: 950,
    },
    {
      id: "i3",
      itemType: "inventory",
      itemName: "Cat6 Cable (305m Box)",
      sku: "CAT6-305M",
      quantity: 2,
      unitPrice: 280,
      discount: 5,
      vatPercentage: 5,
      total: 532,
    },
  ],
  resourceItems: [
    {
      id: "r1",
      resourceType: "Senior Technician",
      description: "Installation & configuration",
      quantity: 2,
      unitCost: 600,
      sellingPrice: 900,
      total: 1800,
    },
    {
      id: "r2",
      resourceType: "Site Survey",
      quantity: 1,
      unitCost: 200,
      sellingPrice: 350,
      total: 350,
    },
  ],
  subtotal: 6992,
  materialTotal: 4842,
  resourceCostTotal: 2150,
  discount: 28,
  vatAmount: 348,
  grandTotal: 7312,
  estimatedProfit: 1480,
  marginPercentage: 21.2,
  status: "sent",
  notes: "All prices in AED. Installation expected to take 2 working days.",
  terms: "50% advance, 50% on completion. Validity 30 days.",
  createdBy: "system",
  createdAt: null as never,
  updatedAt: null as never,
};

export default function QuotationDetailPage() {
  const { id } = useParams() as { id: string };
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "quotations", id));
        if (snap.exists()) {
          setQuotation({ id: snap.id, ...snap.data() } as Quotation);
        } else {
          setQuotation({ ...DEMO, id });
        }
      } catch {
        setQuotation({ ...DEMO, id });
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
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!quotation) {
    return <p className="text-muted-foreground">Quotation not found.</p>;
  }

  const statusInfo =
    QUOTATION_STATUSES.find((s) => s.value === quotation.status) ||
    QUOTATION_STATUSES[0];

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/quotations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold font-mono">
                {quotation.quotationNumber}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusInfo.color}`}
              >
                {quotation.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {quotation.clientName} · {formatDate(quotation.quotationDate)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/quotations/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
          <Button variant="outline" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Client
            </div>
            <p className="font-semibold">{quotation.clientName}</p>
            <Link
              href={`/crm/${quotation.clientId}`}
              className="text-xs text-primary hover:underline"
            >
              View client
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Quotation Date
            </div>
            <p className="font-semibold">{formatDate(quotation.quotationDate)}</p>
            <p className="text-xs text-muted-foreground">
              Valid until {formatDate(quotation.validUntil)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Grand Total
            </div>
            <p className="text-xl font-bold">
              {formatCurrency(quotation.grandTotal)}
            </p>
            {quotation.marginPercentage !== undefined && (
              <p className="text-xs text-green-600">
                {quotation.marginPercentage.toFixed(1)}% margin
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Material / Items</CardTitle>
        </CardHeader>
        <CardContent>
          {quotation.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No items in this quotation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left font-medium py-2 pr-3">Item</th>
                    <th className="text-right font-medium py-2 px-3">Qty</th>
                    <th className="text-right font-medium py-2 px-3">
                      Unit Price
                    </th>
                    <th className="text-right font-medium py-2 px-3">Disc %</th>
                    <th className="text-right font-medium py-2 pl-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{it.itemName}</p>
                        {it.sku && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {it.sku}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {it.discount || 0}%
                      </td>
                      <td className="py-2.5 pl-3 text-right font-medium">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {quotation.resourceItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resources / Labour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left font-medium py-2 pr-3">Resource</th>
                    <th className="text-right font-medium py-2 px-3">Qty</th>
                    <th className="text-right font-medium py-2 px-3">
                      Unit Cost
                    </th>
                    <th className="text-right font-medium py-2 px-3">
                      Sell Price
                    </th>
                    <th className="text-right font-medium py-2 pl-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.resourceItems.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{r.resourceType}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground">
                            {r.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">{r.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(r.unitCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(r.sellingPrice)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-medium">
                        {formatCurrency(r.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {quotation.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {quotation.notes}
                </p>
              </CardContent>
            </Card>
          )}
          {quotation.terms && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {quotation.terms}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials</span>
              <span>{formatCurrency(quotation.materialTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resources</span>
              <span>{formatCurrency(quotation.resourceCostTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>- {formatCurrency(quotation.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (5%)</span>
              <span>{formatCurrency(quotation.vatAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Grand Total</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
            {quotation.estimatedProfit !== undefined && (
              <div className="mt-2 rounded-lg bg-green-50 p-2 border border-green-100">
                <div className="flex justify-between text-xs">
                  <span className="text-green-700">Estimated Profit</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(quotation.estimatedProfit)}
                  </span>
                </div>
                {quotation.marginPercentage !== undefined && (
                  <div className="flex justify-between text-xs mt-0.5">
                    <span className="text-green-700">Margin</span>
                    <span className="font-semibold text-green-700">
                      {quotation.marginPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
