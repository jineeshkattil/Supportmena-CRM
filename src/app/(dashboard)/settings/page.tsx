"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Settings, Users, Building2, Tag } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs } from "firebase/firestore";

const companySchema = z.object({
  name: z.string().min(2),
  trn: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().default("AED"),
  vatPercentage: z.coerce.number().min(0).max(100).default(5),
  invoicePrefix: z.string().default("INV"),
  quotationPrefix: z.string().default("QT"),
  poPrefix: z.string().default("PO"),
});
type CompanyForm = z.infer<typeof companySchema>;

export default function SettingsPage() {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "SupportMENA Technologies",
      currency: "AED",
      vatPercentage: 5,
      invoicePrefix: "INV",
      quotationPrefix: "QT",
      poPrefix: "PO",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const docSnap = await getDoc(doc(db, "companySettings", "main"));
        if (docSnap.exists()) {
          reset(docSnap.data() as CompanyForm);
        }
      } catch {}
    }
    loadSettings();

    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile));
      } catch {
        setUsers([
          { id: "1", email: "admin@supportmena.com", displayName: "Super Admin", role: "super_admin", isActive: true, createdAt: null as never, updatedAt: null as never },
          { id: "2", email: "finance@supportmena.com", displayName: "Finance Manager", role: "finance", isActive: true, createdAt: null as never, updatedAt: null as never },
          { id: "3", email: "hr@supportmena.com", displayName: "HR Manager", role: "hr_admin", isActive: true, createdAt: null as never, updatedAt: null as never },
        ]);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [reset]);

  const onSubmit = async (data: CompanyForm) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "companySettings", "main"), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success("Company settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = profile?.role === "super_admin";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage company and system configuration</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="flex w-full overflow-x-auto sm:w-auto sm:inline-flex">
          <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1.5" />Company</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="billing"><Tag className="h-4 w-4 mr-1.5" />Billing Config</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Information</CardTitle>
                <CardDescription>Basic details shown on invoices and quotations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Company Name</Label>
                    <Input {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>TRN Number</Label>
                    <Input placeholder="100123456789001" {...register("trn")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="info@supportmena.ae" {...register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+971 4 123 4567" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input placeholder="www.supportmena.ae" {...register("website")} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address</Label>
                    <Input placeholder="Office address, Dubai, UAE" {...register("address")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input {...register("currency")} />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Percentage (%)</Label>
                    <Input type="number" step="0.01" {...register("vatPercentage")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Settings"}
                </Button>
              </div>
            )}
          </form>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">System Users</CardTitle>
                <CardDescription>{users.length} users registered</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm">
                  <Users className="h-4 w-4 mr-1.5" />Invite User
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      <Badge variant={user.isActive ? "success" : "secondary"} className="text-xs">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Numbering</CardTitle>
                <CardDescription>Configure prefixes for auto-generated numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input {...register("invoicePrefix")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quotation Prefix</Label>
                    <Input {...register("quotationPrefix")} />
                  </div>
                  <div className="space-y-2">
                    <Label>PO Prefix</Label>
                    <Input {...register("poPrefix")} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: INV-0001, QT-0001, PO-0001
                </p>
              </CardContent>
            </Card>
            {isAdmin && (
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Settings"}
                </Button>
              </div>
            )}
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
