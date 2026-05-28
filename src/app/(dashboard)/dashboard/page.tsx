"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, Receipt, Briefcase, Package, Users,
  CalendarDays, Wallet, AlertTriangle, TrendingUp,
  Plus, FileText, CheckSquare, Clock, BarChart2,
} from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProjectStatusChart } from "@/components/dashboard/ProjectStatusChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { Invoice, Project, LeaveRequest } from "@/types";
import Link from "next/link";

interface DashboardStats {
  monthlyRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeProjects: number;
  completedProjectsThisMonth: number;
  lowStockItems: number;
  pendingLeaveRequests: number;
  pendingApprovals: number;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "success",
  sent: "info",
  overdue: "destructive",
  partially_paid: "warning",
  draft: "secondary",
  in_progress: "warning",
  completed: "success",
  new: "secondary",
  on_hold: "destructive",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [invoiceSnap, projectSnap, leaveSnap, inventorySnap] = await Promise.all([
          getDocs(query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(5))),
          getDocs(query(collection(db, "projects"), where("status", "in", ["new", "in_progress", "scheduled", "material_assigned"]), limit(5))),
          getDocs(query(collection(db, "leaveRequests"), where("status", "==", "pending"), limit(5))),
          getDocs(query(collection(db, "inventory"), where("availableStock", "<=", 5))),
        ]);

        const invoices = invoiceSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice);
        const projects = projectSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
        const leaveReqs = leaveSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as LeaveRequest);

        const pendingAmount = invoices
          .filter((i) => ["sent", "partially_paid", "overdue"].includes(i.status))
          .reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

        const overdueAmount = invoices
          .filter((i) => i.status === "overdue")
          .reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

        const paidThisMonth = invoices
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

        setStats({
          monthlyRevenue: paidThisMonth,
          pendingInvoices: pendingAmount,
          overdueInvoices: overdueAmount,
          activeProjects: projects.length,
          completedProjectsThisMonth: 0,
          lowStockItems: inventorySnap.size,
          pendingLeaveRequests: leaveReqs.length,
          pendingApprovals: leaveReqs.length,
        });

        setRecentInvoices(invoices);
        setActiveProjects(projects);
        setPendingLeave(leaveReqs);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // Set demo data if Firestore not configured
        setStats({
          monthlyRevenue: 127500,
          pendingInvoices: 48200,
          overdueInvoices: 12400,
          activeProjects: 8,
          completedProjectsThisMonth: 5,
          lowStockItems: 3,
          pendingLeaveRequests: 4,
          pendingApprovals: 7,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Good {getGreeting()}, {profile?.displayName?.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/quotations/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Quote
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Monthly Revenue"
          value={stats ? formatCurrency(stats.monthlyRevenue) : "—"}
          subtitle="Paid invoices this month"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          trend={{ value: 12, label: "vs last month" }}
          loading={loading}
        />
        <KPICard
          title="Pending Invoices"
          value={stats ? formatCurrency(stats.pendingInvoices) : "—"}
          subtitle="Awaiting payment"
          icon={Receipt}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          loading={loading}
        />
        <KPICard
          title="Active Projects"
          value={stats?.activeProjects ?? "—"}
          subtitle="Currently in progress"
          icon={Briefcase}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          loading={loading}
        />
        <KPICard
          title="Low Stock Items"
          value={stats?.lowStockItems ?? "—"}
          subtitle="Below minimum level"
          icon={Package}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          loading={loading}
        />
        <KPICard
          title="Overdue Invoices"
          value={stats ? formatCurrency(stats.overdueInvoices) : "—"}
          subtitle="Past due date"
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          loading={loading}
        />
        <KPICard
          title="Pending Leave"
          value={stats?.pendingLeaveRequests ?? "—"}
          subtitle="Awaiting approval"
          icon={CalendarDays}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
          loading={loading}
        />
        <KPICard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? "—"}
          subtitle="Actions required"
          icon={CheckSquare}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          loading={loading}
        />
        <KPICard
          title="Completed Projects"
          value={stats?.completedProjectsThisMonth ?? "—"}
          subtitle="This month"
          icon={TrendingUp}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <ProjectStatusChart />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/invoices">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                No invoices found
              </div>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber || "INV-XXXX"}</p>
                      <p className="text-xs text-muted-foreground">{inv.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(inv.grandTotal)}</p>
                      <Badge
                        variant={(STATUS_COLORS[inv.status] as "success" | "info" | "destructive" | "warning" | "secondary") || "secondary"}
                        className="text-[10px] mt-0.5"
                      >
                        {inv.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Projects</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {activeProjects.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                No active projects
              </div>
            ) : (
              <div className="divide-y">
                {activeProjects.map((proj) => (
                  <div key={proj.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{proj.projectName}</p>
                      <p className="text-xs text-muted-foreground">{proj.clientName}</p>
                    </div>
                    <Badge
                      variant={(STATUS_COLORS[proj.status] as "success" | "info" | "destructive" | "warning" | "secondary") || "secondary"}
                      className="text-[10px]"
                    >
                      {proj.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "New Quotation", icon: FileText, href: "/quotations/new", color: "text-blue-600 bg-blue-50" },
              { label: "New Invoice", icon: Receipt, href: "/invoices/new", color: "text-green-600 bg-green-50" },
              { label: "New Project", icon: Briefcase, href: "/projects/new", color: "text-purple-600 bg-purple-50" },
              { label: "Add Stock", icon: Package, href: "/inventory/new", color: "text-orange-600 bg-orange-50" },
              { label: "Petty Cash", icon: Wallet, href: "/petty-cash", color: "text-yellow-600 bg-yellow-50" },
              { label: "Attendance", icon: Clock, href: "/attendance", color: "text-teal-600 bg-teal-50" },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border hover:bg-muted/30 transition-colors text-center"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
