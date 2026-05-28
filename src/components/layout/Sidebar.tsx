"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase,
  CheckSquare, RefreshCw, Package, ShoppingCart, Truck,
  UserCircle, Clock, CalendarDays, Wallet, CreditCard,
  BarChart2, Settings, ChevronDown, LogOut, User,
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
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col bg-navy-900">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-navy-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">SupportMENA OS</p>
          <p className="text-navy-400 text-[10px]">Operations Platform</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-5">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !profile || canViewModule(profile.role, item.module)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
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
                            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-primary/20 text-primary font-medium"
                              : "text-navy-300 hover:bg-navy-800 hover:text-white"
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active ? "text-primary" : "text-navy-400"
                              )}
                            />
                          )}
                          {item.label}
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
        <div className="border-t border-navy-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.displayName}</p>
              <p className="text-navy-400 text-[11px] truncate">
                {ROLE_LABELS[profile.role]}
              </p>
            </div>
            <button
              onClick={signOut}
              className="text-navy-400 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
