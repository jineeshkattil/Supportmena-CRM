"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, timeAgo } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MODULE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  crm: "CRM / Clients",
  quotations: "Quotations",
  invoices: "Invoices",
  projects: "Projects",
  tasks: "Tasks",
  amc: "AMC Management",
  inventory: "Inventory",
  purchase: "Purchase",
  suppliers: "Suppliers",
  hrms: "HRMS",
  attendance: "Attendance",
  leave: "Leave Management",
  "petty-cash": "Petty Cash",
  expenses: "Expenses",
  reports: "Reports",
  settings: "Settings",
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const segments = pathname.split("/").filter(Boolean);
  const moduleKey = segments[0] || "dashboard";
  const moduleTitle = MODULE_TITLES[moduleKey] || "SupportMENA OS";
  const subSegment = segments[1];
  const subTitle = subSegment
    ? subSegment === "new"
      ? "New"
      : subSegment.length > 16
      ? "Details"
      : subSegment.charAt(0).toUpperCase() + subSegment.slice(1)
    : null;

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", profile.id),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    });
    return unsub;
  }, [profile]);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden -ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb-style title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Link
            href={`/${moduleKey}`}
            className={cn(
              "font-medium tracking-tight transition-colors truncate",
              subTitle
                ? "text-muted-foreground hover:text-foreground"
                : "text-foreground"
            )}
          >
            {moduleTitle}
          </Link>
          {subTitle && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="font-medium text-foreground tracking-tight truncate">
                {subTitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center relative w-72">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          data-global-search
          placeholder="Search anything..."
          className="pl-8 pr-14 h-8 bg-muted/40 border-border/60 text-[13px] hover:bg-muted/60"
        />
        <kbd className="absolute right-2 inline-flex items-center rounded border border-border bg-background px-1.5 h-5 text-[10px] font-medium text-muted-foreground tracking-wider pointer-events-none">
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="info" className="text-[10px]">{unreadCount} new</Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2.5">
                <div className="flex items-start gap-2 w-full">
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <div className={!n.isRead ? "" : "pl-3.5"}>
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-xs text-primary justify-center font-medium">
                View all notifications
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      {profile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 pr-2 transition-all hover:bg-muted/60 ring-1 ring-transparent hover:ring-border">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-[13px] font-medium leading-none tracking-tight">{profile.displayName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ROLE_LABELS[profile.role]}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{profile.displayName}</span>
                <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={signOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
