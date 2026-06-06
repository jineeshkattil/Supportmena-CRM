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
  Receipt,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Invoice } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatCurrencyExact, formatDate } from "@/lib/utils";
import { INVOICE_STATUSES } from "@/lib/constants";

const DEMO: Invoice = {
  id: "demo",
  invoiceNumber: "INV-0001",
  clientId: "1",
  clientName: "Al Noor Technologies",
  invoiceDate: "2024-07-01",
  dueDate: "2024-07-31",
  invoiceType: "tax_invoice",
  relatedQuotationId: "1",
  items: [
    {
      id: "i1",
      itemName: "Hikvision 4MP Dome Camera",
      description: "Indoor IP camera with night vision",
      quantity: 8,
      unitPrice: 420,
      discount: 0,
      vatPercentage: 5,
      total: 3360,
    },
    {
      id: "i2",
      itemName: "Dahua 8 Channel NVR",
      quantity: 1,
      unitPrice: 950,
      discount: 0,
      vatPercentage: 5,
      total: 950,
    },
    {
      id: "i3",
      itemName: "Installation & Configuration",
      description: "On-site labour and commissioning",
      quantity: 2,
      unitPrice: 900,
      discount: 0,
      vatPercentage: 5,
      total: 1800,
    },
  ],
  subtotal: 6110,
  discount: 0,
  vatAmount: 305.5,
  grandTotal: 6415.5,
  paidAmount: 3000,
  balanceAmount: 3415.5,
  status: "partially_paid",
  notes: "Thank you for your business.",
  terms: "Payment due within 30 days. Late payments incur 2% per month.",
  createdBy: "system",
  createdAt: null as never,
  updatedAt: null as never,
};

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "invoices", id));
        if (snap.exists()) {
          setInvoice({ id: snap.id, ...snap.data() } as Invoice);
        } else {
          setInvoice({ ...DEMO, id });
        }
      } catch {
        setInvoice({ ...DEMO, id });
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-muted-foreground">Invoice not found.</p>;
  }

  const statusInfo =
    INVOICE_STATUSES.find((s) => s.value === invoice.status) ||
    INVOICE_STATUSES[0];

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold font-mono">
                {invoice.invoiceNumber}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusInfo.color}`}
              >
                {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                {invoice.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.clientName} · {formatDate(invoice.invoiceDate)} ·{" "}
              <span className="capitalize">
                {invoice.invoiceType.replace("_", " ")}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isPaid && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Mark as Paid
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/invoices/${id}?edit=true`}>
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
            <p className="font-semibold">{invoice.clientName}</p>
            <Link
              href={`/crm/${invoice.clientId}`}
              className="text-xs text-primary hover:underline"
            >
              View client
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Invoice Date
            </div>
            <p className="font-semibold">{formatDate(invoice.invoiceDate)}</p>
            <p
              className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
            >
              Due {formatDate(invoice.dueDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" /> Balance
            </div>
            <p
              className={`text-xl font-bold ${invoice.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {formatCurrency(invoice.balanceAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(invoice.grandTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No items on this invoice.
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
                    <th className="text-right font-medium py-2 px-3">VAT %</th>
                    <th className="text-right font-medium py-2 pl-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{it.itemName}</p>
                        {it.description && (
                          <p className="text-xs text-muted-foreground">
                            {it.description}
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
                      <td className="py-2.5 px-3 text-right">
                        {it.vatPercentage}%
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {invoice.relatedQuotationId && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Related Documents
                </p>
                <Link
                  href={`/quotations/${invoice.relatedQuotationId}`}
                  className="text-sm text-primary hover:underline"
                >
                  View source quotation
                </Link>
              </CardContent>
            </Card>
          )}
          {invoice.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}
          {invoice.terms && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.terms}
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
              <span>{formatCurrencyExact(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>- {formatCurrencyExact(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCurrencyExact(invoice.vatAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Grand Total</span>
              <span>{formatCurrencyExact(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>{formatCurrencyExact(invoice.paidAmount)}</span>
            </div>
            <Separator />
            <div
              className={`flex justify-between font-semibold ${invoice.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}
            >
              <span>Balance Due</span>
              <span>{formatCurrencyExact(invoice.balanceAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
