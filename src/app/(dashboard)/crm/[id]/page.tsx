"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function ClientDetailPage() {
  const { id } = useParams() as { id: string };
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "clients", id));
        if (snap.exists()) setClient({ id: snap.id, ...snap.data() } as Client);
      } catch {
        setClient({ id, clientCode: "CL-0001", companyName: "Al Noor Technologies", clientType: "company", email: "info@alnoor.ae", phone: "+971 50 123 4567", billingAddress: "Business Bay, Dubai", status: "active", createdAt: null as never, updatedAt: null as never });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!client) return <p className="text-muted-foreground">Client not found.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon"><Link href="/crm"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{client.companyName}</h2>
            <p className="text-sm text-muted-foreground">{client.clientCode}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/crm/${id}?edit=true`}><Edit className="h-4 w-4 mr-1.5" />Edit</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Client Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{client.companyName}</span>
            <Badge variant="secondary" className="capitalize">{client.clientType}</Badge>
            <Badge variant={client.status === "active" ? "success" : "secondary"} className="capitalize">{client.status}</Badge>
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />{client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />{client.phone}
            </div>
          )}
          {client.billingAddress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />{client.billingAddress}
            </div>
          )}
          {client.trn && <p className="text-sm text-muted-foreground">TRN: {client.trn}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Quotations", value: "—", href: `/quotations?client=${id}` },
          { label: "Invoices", value: "—", href: `/invoices?client=${id}` },
          { label: "Projects", value: "—", href: `/projects?client=${id}` },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border p-3 hover:bg-muted/30 transition-colors">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
