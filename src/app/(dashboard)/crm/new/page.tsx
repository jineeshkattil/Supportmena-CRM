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
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const schema = z.object({
  companyName: z.string().min(2, "Company name required"),
  clientType: z.enum(["company", "individual", "government"]),
  trn: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  billingAddress: z.string().optional(),
  siteAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewClientPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { clientType: "company" },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const counter = Math.floor(Math.random() * 9000) + 1000;
      await addDoc(collection(db, "clients"), {
        ...data,
        clientCode: `CL-${counter}`,
        status: "active",
        createdBy: profile?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Client created successfully");
      router.push("/crm");
    } catch (err) {
      toast.error("Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/crm"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">New Client</h2>
          <p className="text-sm text-muted-foreground">Add a new client to your CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input placeholder="Al Noor Technologies" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Client Type *</Label>
                <Select defaultValue="company" onValueChange={(v) => setValue("clientType", v as "company" | "individual" | "government")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="info@company.ae" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+971 50 123 4567" {...register("phone")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TRN</Label>
                <Input placeholder="100123456789001" {...register("trn")} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input placeholder="www.company.ae" {...register("website")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select onValueChange={(v) => setValue("paymentTerms", v)}>
                <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="net15">Net 15</SelectItem>
                  <SelectItem value="net30">Net 30</SelectItem>
                  <SelectItem value="net60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Billing Address</Label>
              <Textarea rows={2} placeholder="P.O. Box, Street, Dubai, UAE" {...register("billingAddress")} />
            </div>
            <div className="space-y-2">
              <Label>Site Address</Label>
              <Textarea rows={2} placeholder="Site/Installation address" {...register("siteAddress")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} placeholder="Internal notes about this client..." {...register("notes")} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline">
            <Link href="/crm">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
