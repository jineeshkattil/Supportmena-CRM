"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/types";
import { PROJECT_TYPES } from "@/lib/constants";
import Link from "next/link";

const schema = z.object({
  projectName: z.string().min(3, "Project name required"),
  projectType: z.string().min(1),
  clientId: z.string().min(1, "Select a client"),
  siteAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  projectValue: z.coerce.number().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: "cctv" },
  });

  useEffect(() => {
    getDocs(query(collection(db, "clients"), orderBy("companyName")))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client)))
      .catch(() => setClients([
        { id: "1", clientCode: "CL-0001", companyName: "Al Noor Technologies", clientType: "company", status: "active", createdAt: null as never, updatedAt: null as never },
      ]));
  }, []);

  const onSubmit = async (data: FormData) => {
    const clientName = clients.find((c) => c.id === data.clientId)?.companyName || "";
    setSaving(true);
    try {
      const num = Math.floor(Math.random() * 900) + 100;
      await addDoc(collection(db, "projects"), {
        projectCode: `PRJ-${num}`,
        projectName: data.projectName,
        projectType: data.projectType,
        clientId: data.clientId,
        clientName,
        siteAddress: data.siteAddress,
        contactPerson: data.contactPerson,
        startDate: data.startDate,
        expectedEndDate: data.expectedEndDate,
        projectValue: data.projectValue,
        notes: data.notes,
        status: "new",
        assignedTechnicians: [],
        projectManagerId: profile?.id,
        projectManagerName: profile?.displayName,
        createdBy: profile?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Project created");
      router.push("/projects");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-lg font-semibold">New Project</h2>
          <p className="text-sm text-muted-foreground">Create a new project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="CCTV Installation - Client Name HQ" {...register("projectName")} />
              {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type *</Label>
                <Select defaultValue="cctv" onValueChange={(v) => setValue("projectType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
            </div>
            <div className="space-y-2">
              <Label>Site Address</Label>
              <Input placeholder="Building, Area, City" {...register("siteAddress")} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person on Site</Label>
              <Input placeholder="Name and phone" {...register("contactPerson")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>Expected End Date</Label>
                <Input type="date" {...register("expectedEndDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project Value (AED)</Label>
              <Input type="number" placeholder="0.00" {...register("projectValue")} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={3} placeholder="Scope of work, special instructions..." {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline"><Link href="/projects">Cancel</Link></Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
