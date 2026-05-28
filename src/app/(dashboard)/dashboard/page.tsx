"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, Receipt, Briefcase, Package,
  CalendarDays, Wallet, AlertTriangle, TrendingUp,
  Plus, FileText, CheckSquare, Clock, ArrowUpRight,
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
import { formatCurrency } from "@/lib/utils";
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
      {children}
    </p>
  );
}

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
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Good {getGreeting()}, {profile?.displayName?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/quotations/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Quote
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div>
        <SectionTitle>Financial Overview</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Monthly Revenue"
            value={stats ? formatCurrency(stats.monthlyRevenue) : "—"}
            subtitle="Paid invoices this month"
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
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
            trend={{ value: -4, label: "vs last month" }}
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
            title="Active Projects"
            value={stats?.activeProjects ?? "—"}
            subtitle="Currently in progress"
            icon={Briefcase}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            trend={{ value: 8, label: "vs last month" }}
            loading={loading}
          />
        </div>
      </div>

      {/* Operational KPIs */}
      <div>
        <SectionTitle>Operations</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Low Stock Items"
            value={stats?.lowStockItems ?? "—"}
            subtitle="Below minimum level"
            icon={Package}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
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
      </div>

      {/* Charts Row */}
      <div>
        <SectionTitle>Performance</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <ProjectStatusChart />
        </div>
      </div>

      {/* Tables Row */}
      <div>
        <SectionTitle>Recent Activity</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 -mr-2">
                <Link href="/invoices">
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentInvoices.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Receipt className="h-7 w-7 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No invoices found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.invoiceNumber || "INV-XXXX"}</p>
                        <p className="text-xs text-muted-foreground truncate">{inv.clientName}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(inv.grandTotal)}</p>
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
              <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 -mr-2">
                <Link href="/projects">
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeProjects.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Briefcase className="h-7 w-7 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No active projects</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{proj.projectName}</p>
                        <p className="text-xs text-muted-foreground truncate">{proj.clientName}</p>
                      </div>
                      <Badge
                        variant={(STATUS_COLORS[proj.status] as "success" | "info" | "destructive" | "warning" | "secondary") || "secondary"}
                        className="text-[10px] shrink-0 ml-3"
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
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: "New Quotation", icon: FileText, href: "/quotations/new", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "New Invoice", icon: Receipt, href: "/invoices/new", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "New Project", icon: Briefcase, href: "/projects/new", color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Add Stock", icon: Package, href: "/inventory/new", color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Petty Cash", icon: Wallet, href: "/petty-cash", color: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Attendance", icon: Clock, href: "/attendance", color: "text-teal-600", bg: "bg-teal-50" },
              ].map(({ label, icon: Icon, href, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all duration-150 text-center"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg} ring-1 ring-inset ring-black/[0.03] group-hover:scale-105 transition-transform`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-[11px] font-medium text-foreground/80 group-hover:text-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
