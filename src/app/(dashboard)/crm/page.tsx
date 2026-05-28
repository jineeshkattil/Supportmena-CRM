"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Building2, Eye, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Client } from "@/types";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "success" | "secondary" | "warning"> = {
  active: "success",
  inactive: "secondary",
  prospect: "warning",
};

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const snap = await getDocs(query(collection(db, "clients"), orderBy("createdAt", "desc")));
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
    } catch {
      // Demo data
      setClients([
        { id: "1", clientCode: "CL-0001", companyName: "Al Noor Technologies", clientType: "company", status: "active", phone: "+971 50 123 4567", email: "info@alnoor.ae", createdAt: null as never, updatedAt: null as never },
        { id: "2", clientCode: "CL-0002", companyName: "Gulf Smart Systems", clientType: "company", status: "active", phone: "+971 55 987 6543", email: "info@gulfsmarts.ae", createdAt: null as never, updatedAt: null as never },
        { id: "3", clientCode: "CL-0003", companyName: "Dubai Mall Management", clientType: "government", status: "prospect", phone: "+971 4 123 4567", email: "projects@dubaimall.ae", createdAt: null as never, updatedAt: null as never },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Client deleted");
    } catch {
      toast.error("Failed to delete client");
    }
  };

  const columns: ColumnDef<Client>[] = [
    { accessorKey: "clientCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.clientCode}</span>
    )},
    { accessorKey: "companyName", header: "Company Name", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{row.original.companyName}</p>
          <p className="text-xs text-muted-foreground capitalize">{row.original.clientType}</p>
        </div>
      </div>
    )},
    { accessorKey: "phone", header: "Contact", cell: ({ row }) => (
      <div className="space-y-0.5">
        {row.original.phone && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /> {row.original.phone}
          </div>
        )}
        {row.original.email && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> {row.original.email}
          </div>
        )}
      </div>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || "secondary"} className="capitalize">
        {row.original.status}
      </Badge>
    )},
    { accessorKey: "createdAt", header: "Added", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    )},
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/crm/${row.original.id}`}><Eye className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={`/crm/${row.original.id}?edit=true`}><Pencil className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">CRM / Clients</h2>
          <p className="text-sm text-muted-foreground">{clients.length} clients in your database</p>
        </div>
        <Button asChild>
          <Link href="/crm/new">
            <Plus className="h-4 w-4 mr-2" />New Client
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Clients", value: clients.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: clients.filter((c) => c.status === "active").length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Prospects", value: clients.filter((c) => c.status === "prospect").length, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 flex items-center gap-3 ${s.bg}/30`}>
            <Users className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={clients}
        searchKey="companyName"
        searchPlaceholder="Search clients..."
        loading={loading}
        emptyMessage="No clients found. Add your first client."
        emptyIcon={<Users className="h-8 w-8 opacity-30" />}
      />
    </div>
  );
}
