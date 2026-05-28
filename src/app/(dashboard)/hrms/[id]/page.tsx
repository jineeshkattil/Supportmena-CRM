"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  FileText,
  CreditCard,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  formatDate,
  getDaysUntilExpiry,
  getExpiryStatus,
  getInitials,
} from "@/lib/utils";

const STATUS_VARIANTS: Record<
  string,
  "success" | "secondary" | "warning" | "destructive"
> = {
  active: "success",
  inactive: "secondary",
  on_leave: "warning",
  terminated: "destructive",
};

const DEMO: Employee = {
  id: "demo",
  employeeCode: "EMP-001",
  fullName: "Ahmed Al Rashid",
  gender: "male",
  dateOfBirth: "1990-04-12",
  nationality: "UAE",
  maritalStatus: "Married",
  phone: "+971 50 111 2222",
  email: "ahmed@supportmena.com",
  address: "Al Barsha, Dubai, UAE",
  departmentName: "IT",
  designationName: "Senior Technician",
  employmentType: "full_time",
  joiningDate: "2022-01-15",
  workLocation: "Dubai HQ",
  status: "active",
  basicSalary: 6500,
  allowances: 1500,
  bankName: "Emirates NBD",
  iban: "AE07 0331 2345 6789 0123 456",
  passportNumber: "A1234567",
  passportExpiry: "2028-08-12",
  visaNumber: "V-202301",
  visaExpiry: "2025-06-30",
  emiratesIdNumber: "784-1990-1234567-1",
  emiratesIdExpiry: "2026-03-21",
  labourCardNumber: "LC-887766",
  labourCardExpiry: "2025-12-01",
  createdAt: null as never,
  updatedAt: null as never,
};

function DocumentRow({
  label,
  number,
  expiry,
}: {
  label: string;
  number?: string;
  expiry?: string;
}) {
  if (!number && !expiry) return null;
  const daysLeft = getDaysUntilExpiry(expiry);
  const status = getExpiryStatus(daysLeft);
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {number && (
          <p className="text-xs text-muted-foreground font-mono">{number}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm">{formatDate(expiry)}</p>
        <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string };
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "employees", id));
        if (snap.exists()) {
          setEmployee({ id: snap.id, ...snap.data() } as Employee);
        } else {
          setEmployee({ ...DEMO, id });
        }
      } catch {
        setEmployee({ ...DEMO, id });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return <p className="text-muted-foreground">Employee not found.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link href="/hrms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{employee.fullName}</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {employee.employeeCode}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/hrms/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              {employee.profileImage && (
                <AvatarImage src={employee.profileImage} alt={employee.fullName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(employee.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-semibold">{employee.fullName}</h3>
                <Badge
                  variant={STATUS_VARIANTS[employee.status] || "secondary"}
                  className="capitalize"
                >
                  {employee.status.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {employee.employmentType.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {employee.departmentName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {employee.departmentName}
                  </div>
                )}
                {employee.designationName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {employee.designationName}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(employee.joiningDate)}
                </div>
                {employee.nationality && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">Nationality:</span>
                    {employee.nationality}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.email}</span>
            </div>
            {employee.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{employee.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joining Date</span>
              <span>{formatDate(employee.joiningDate)}</span>
            </div>
            {employee.probationEndDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Probation End</span>
                <span>{formatDate(employee.probationEndDate)}</span>
              </div>
            )}
            {employee.workLocation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Location</span>
                <span>{employee.workLocation}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">
                {employee.employmentType.replace("_", " ")}
              </span>
            </div>
            {employee.basicSalary !== undefined && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span>AED {employee.basicSalary.toLocaleString()}</span>
                </div>
                {employee.allowances !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances</span>
                    <span>AED {employee.allowances.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentRow
            label="Passport"
            number={employee.passportNumber}
            expiry={employee.passportExpiry}
          />
          <DocumentRow
            label="Visa"
            number={employee.visaNumber}
            expiry={employee.visaExpiry}
          />
          <DocumentRow
            label="Emirates ID"
            number={employee.emiratesIdNumber}
            expiry={employee.emiratesIdExpiry}
          />
          <DocumentRow
            label="Labour Card"
            number={employee.labourCardNumber}
            expiry={employee.labourCardExpiry}
          />
          {employee.drivingLicenseNumber && (
            <DocumentRow
              label="Driving License"
              number={employee.drivingLicenseNumber}
              expiry={employee.drivingLicenseExpiry}
            />
          )}
          {employee.insuranceExpiry && (
            <DocumentRow label="Insurance" expiry={employee.insuranceExpiry} />
          )}
        </CardContent>
      </Card>

      {(employee.bankName || employee.iban) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {employee.bankName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span>{employee.bankName}</span>
              </div>
            )}
            {employee.iban && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-mono">{employee.iban}</span>
              </div>
            )}
            {employee.accountNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono">{employee.accountNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
