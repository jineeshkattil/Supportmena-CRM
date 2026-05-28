"use client";

import { BarChart2, TrendingUp, Users, Package, Briefcase, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const REPORTS = [
  {
    category: "Finance",
    icon: Receipt,
    color: "text-green-600",
    bg: "bg-green-50",
    reports: [
      { title: "Revenue Report", desc: "Monthly revenue breakdown", href: "/reports/revenue" },
      { title: "Outstanding Invoices", desc: "Pending and overdue invoices", href: "/reports/outstanding-invoices" },
      { title: "Payment Report", desc: "Payment history and methods", href: "/reports/payments" },
      { title: "Expense Report", desc: "Expense breakdown by category", href: "/reports/expenses" },
      { title: "VAT Report", desc: "Tax liability and VAT summary", href: "/reports/vat" },
      { title: "Petty Cash Report", desc: "Petty cash settlements", href: "/reports/petty-cash" },
    ],
  },
  {
    category: "Operations",
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50",
    reports: [
      { title: "Project Status Report", desc: "All projects by status", href: "/reports/projects" },
      { title: "Project Profitability", desc: "Revenue vs cost per project", href: "/reports/project-profitability" },
      { title: "Technician Productivity", desc: "Tasks completed per technician", href: "/reports/technician" },
      { title: "Task Completion Report", desc: "Task completion rates", href: "/reports/tasks" },
      { title: "AMC Performance", desc: "AMC contract service compliance", href: "/reports/amc" },
    ],
  },
  {
    category: "HR",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
    reports: [
      { title: "Employee List", desc: "All employees with details", href: "/reports/employees" },
      { title: "Leave Balance Report", desc: "Leave entitlement and usage", href: "/reports/leave-balance" },
      { title: "Attendance Report", desc: "Daily/monthly attendance", href: "/reports/attendance" },
      { title: "Expiring Documents", desc: "Visa, passport, ID expiries", href: "/reports/documents" },
    ],
  },
  {
    category: "Inventory",
    icon: Package,
    color: "text-orange-600",
    bg: "bg-orange-50",
    reports: [
      { title: "Stock Summary", desc: "Current stock levels", href: "/reports/stock" },
      { title: "Stock Movement", desc: "All inventory movements", href: "/reports/stock-movement" },
      { title: "Low Stock Report", desc: "Items below minimum level", href: "/reports/low-stock" },
      { title: "Inventory Valuation", desc: "Total inventory value", href: "/reports/valuation" },
      { title: "Material Usage by Project", desc: "Materials issued per project", href: "/reports/material-usage" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">Business intelligence and operational reports</p>
      </div>

      {REPORTS.map((section) => (
        <div key={section.category}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-6 w-6 rounded-md flex items-center justify-center ${section.bg}`}>
              <section.icon className={`h-3.5 w-3.5 ${section.color}`} />
            </div>
            <h3 className="font-semibold text-sm">{section.category} Reports</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.reports.map((report) => (
              <Card key={report.href} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
                    </div>
                    <BarChart2 className={`h-4 w-4 mt-0.5 ${section.color} opacity-60`} />
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 text-xs px-2 text-primary"
                  >
                    <Link href={report.href}>View Report →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
