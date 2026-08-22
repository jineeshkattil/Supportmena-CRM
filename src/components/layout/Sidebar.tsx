"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase,
  CheckSquare, RefreshCw, Package, ShoppingCart, Truck,
  UserCircle, Clock, CalendarDays, Wallet, CreditCard,
  BarChart2, Settings, LogOut, Search,
  Bell, Building2, Globe, Wrench, FileSearch, FileUp, PieChart, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canViewModule } from "@/lib/permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, FileText, Receipt, Briefcase,
  CheckSquare, RefreshCw, Package, ShoppingCart, Truck,
  UserCircle, Clock, CalendarDays, Wallet, CreditCard,
  BarChart2, Settings,
  Bell, Building2, Globe, Wrench, FileSearch, FileUp, PieChart, SlidersHorizontal,
};

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", module: "dashboard" },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/crm", label: "CRM / Clients", icon: "Users", module: "crm" },
      { href: "/quotations", label: "Quotations", icon: "FileText", module: "quotations" },
      { href: "/invoices", label: "Invoices", icon: "Receipt", module: "invoices" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/projects", label: "Projects", icon: "Briefcase", module: "projects" },
      { href: "/tasks", label: "Tasks", icon: "CheckSquare", module: "tasks" },
      { href: "/amc", label: "AMC", icon: "RefreshCw", module: "amc" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/inventory", label: "Inventory", icon: "Package", module: "inventory" },
      { href: "/purchase", label: "Purchase", icon: "ShoppingCart", module: "purchase" },
      { href: "/suppliers", label: "Suppliers", icon: "Truck", module: "suppliers" },
    ],
  },
  {
    title: "HR & Finance",
    items: [
      { href: "/hrms", label: "HRMS", icon: "UserCircle", module: "hrms" },
      { href: "/attendance", label: "Attendance", icon: "Clock", module: "attendance" },
      { href: "/leave", label: "Leave", icon: "CalendarDays", module: "leave" },
      { href: "/petty-cash", label: "Petty Cash", icon: "Wallet", module: "petty_cash" },
      { href: "/expenses", label: "Expenses", icon: "CreditCard", module: "expenses" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: "BarChart2", module: "reports" },
      { href: "/settings", label: "Settings", icon: "Settings", module: "settings" },
    ],
  },
  {
    title: "Renewal Reminders",
    items: [
      { href: "/renewals", label: "Dashboard", icon: "Bell", module: "renewals" },
      { href: "/renewals/clients", label: "Clients", icon: "Building2", module: "renewal_clients" },
      { href: "/renewals/providers", label: "Providers", icon: "Globe", module: "renewal_providers" },
      { href: "/renewals/services", label: "Services", icon: "Wrench", module: "renewal_services" },
      { href: "/renewals/reminders", label: "Reminders", icon: "Bell", module: "renewal_reminders" },
      { href: "/renewals/documents", label: "Documents", icon: "FileUp", module: "renewal_documents" },
      { href: "/renewals/reports", label: "Reports", icon: "PieChart", module: "renewal_reports" },
      { href: "/renewals/audit", label: "Audit Logs", icon: "FileSearch", module: "renewals" },
      { href: "/renewals/settings", label: "Settings", icon: "SlidersHorizontal", module: "renewal_settings" },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex h-full flex-col bg-[hsl(222_47%_8%)] overflow-hidden">
      {/* Subtle gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent"
      />

      {/* Logo */}
      <div className="relative flex h-14 items-center gap-2.5 px-4 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/10">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-[13px] leading-tight tracking-tight">SupportMENA OS</p>
          <p className="text-white/40 text-[10px] tracking-wide">Operations Platform</p>
        </div>
      </div>

      {/* Search hint */}
      <div className="relative px-3 pt-3">
        <button
          type="button"
          className="group flex w-full items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 h-8 text-left transition-colors hover:bg-white/[0.06] hover:border-white/10"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>("[data-global-search]");
            input?.focus();
          }}
        >
          <Search className="h-3.5 w-3.5 text-white/40 group-hover:text-white/60 transition-colors" />
          <span className="text-[12px] text-white/40 group-hover:text-white/60 transition-colors flex-1">Quick search</span>
          <kbd className="hidden md:inline-flex items-center rounded border border-white/10 bg-white/[0.04] px-1.5 h-4 text-[9px] font-medium text-white/50 tracking-wider">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <ScrollArea className="relative flex-1 px-3 py-3">
        <nav className="space-y-5">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) =>
                !profile ||
                canViewModule(profile.role, item.module, profile.pagePermissions)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-md pl-3 pr-2.5 py-1.5 text-[13px] transition-all duration-150 ease-out",
                            active
                              ? "bg-primary/10 text-white font-medium"
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary"
                            />
                          )}
                          {Icon && (
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                active ? "text-primary" : "text-white/40 group-hover:text-white/70"
                              )}
                            />
                          )}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Footer */}
      {profile && (
        <div className="relative border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
            <Avatar className="h-8 w-8 ring-1 ring-white/10">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-medium">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium leading-tight truncate">{profile.displayName}</p>
              <p className="text-white/40 text-[10px] truncate tracking-wide">
                {ROLE_LABELS[profile.role]}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-md p-1.5 text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
