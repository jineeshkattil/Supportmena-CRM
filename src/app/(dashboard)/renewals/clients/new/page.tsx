"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createRenewalClient } from "@/services/renewal-firestore";

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional(),
  billingEmail: z
    .string()
    .email("Invalid billing email")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormData = z.infer<typeof schema>;

export default function NewRenewalClientPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const statusValue = watch("status");

  const onSubmit = async (data: FormData) => {
    if (!profile?.id) {
      toast.error("You must be logged in");
      return;
    }
    setSaving(true);
    try {
      await createRenewalClient(
        {
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone,
          billingEmail: data.billingEmail || undefined,
          notes: data.notes,
          status: data.status,
        },
        profile.id
      );
      toast.success("Client created successfully");
      router.push("/renewals/clients");
    } catch {
      toast.error("Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/renewals/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">New Renewal Client</h2>
          <p className="text-sm text-muted-foreground">
            Add a new client for renewal tracking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Company Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="ERC International LLC"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  placeholder="Ahmed Al Rashid"
                  {...register("contactPerson")}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  placeholder="+971 50 123 4567"
                  {...register("contactPhone")}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  placeholder="contact@company.ae"
                  {...register("contactEmail")}
                />
                {errors.contactEmail && (
                  <p className="text-xs text-destructive">
                    {errors.contactEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Billing Email</Label>
                <Input
                  type="email"
                  placeholder="billing@company.ae"
                  {...register("billingEmail")}
                />
                {errors.billingEmail && (
                  <p className="text-xs text-destructive">
                    {errors.billingEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusValue}
                  onValueChange={(v) =>
                    setValue("status", v as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Internal notes about this client..."
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline">
            <Link href="/renewals/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
