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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  departmentName: z.string().optional(),
  designationName: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  joiningDate: z.string(),
  workLocation: z.string().optional(),
  basicSalary: z.coerce.number().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  visaNumber: z.string().optional(),
  visaExpiry: z.string().optional(),
  emiratesIdNumber: z.string().optional(),
  emiratesIdExpiry: z.string().optional(),
  labourCardNumber: z.string().optional(),
  labourCardExpiry: z.string().optional(),
  insuranceExpiry: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employmentType: "full_time", gender: "male" },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const counter = Math.floor(Math.random() * 900) + 100;
      await addDoc(collection(db, "employees"), {
        ...data,
        employeeCode: `EMP-${counter}`,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Employee created successfully");
      router.push("/hrms");
    } catch {
      toast.error("Failed to create employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/hrms"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-lg font-semibold">New Employee</h2>
          <p className="text-sm text-muted-foreground">Add a new employee to HRMS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal">
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="salary">Salary & Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Full Name *</Label>
                    <Input placeholder="Ahmed Al Rashid" {...register("fullName")} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="ahmed@company.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input placeholder="+971 50 123 4567" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select defaultValue="male" onValueChange={(v) => setValue("gender", v as "male" | "female" | "other")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" {...register("dateOfBirth")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input placeholder="UAE" {...register("nationality")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input placeholder="IT / Operations" {...register("departmentName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input placeholder="Senior Technician" {...register("designationName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type *</Label>
                    <Select defaultValue="full_time" onValueChange={(v) => setValue("employmentType", v as "full_time" | "part_time" | "contract" | "intern")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Date *</Label>
                    <Input type="date" {...register("joiningDate")} />
                    {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Work Location</Label>
                    <Input placeholder="Dubai / Abu Dhabi / Sharjah" {...register("workLocation")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle className="text-base">Legal Documents</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Passport Number", key: "passportNumber" },
                    { label: "Passport Expiry", key: "passportExpiry", type: "date" },
                    { label: "Visa Number", key: "visaNumber" },
                    { label: "Visa Expiry", key: "visaExpiry", type: "date" },
                    { label: "Emirates ID", key: "emiratesIdNumber" },
                    { label: "Emirates ID Expiry", key: "emiratesIdExpiry", type: "date" },
                    { label: "Labour Card Number", key: "labourCardNumber" },
                    { label: "Labour Card Expiry", key: "labourCardExpiry", type: "date" },
                    { label: "Insurance Expiry", key: "insuranceExpiry", type: "date" },
                  ].map(({ label, key, type = "text" }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input type={type} {...register(key as keyof FormData)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader><CardTitle className="text-base">Salary & Bank Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Basic Salary (AED)</Label>
                    <Input type="number" placeholder="5000" {...register("basicSalary")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end mt-4">
          <Button asChild variant="outline"><Link href="/hrms">Cancel</Link></Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Create Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
