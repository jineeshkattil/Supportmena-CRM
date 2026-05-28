"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, Plus, X } from "lucide-react";
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

  const moduleKey = pathname.split("/")[1] || "dashboard";
  const pageTitle = MODULE_TITLES[moduleKey] || "SupportMENA OS";

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
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <h1 className="font-semibold text-base text-foreground">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center relative w-64">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-8 h-8 bg-muted/50 border-0 text-sm"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                <div className="flex items-start gap-2 w-full">
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <div className={!n.isRead ? "" : "pl-3.5"}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
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
              <DropdownMenuItem className="text-center text-sm text-primary justify-center">
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
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{profile.displayName}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
