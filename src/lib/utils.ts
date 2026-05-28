import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | Timestamp | undefined | null): string {
  if (!date) return "—";
  try {
    if (date instanceof Timestamp) {
      return format(date.toDate(), "dd MMM yyyy");
    }
    if (typeof date === "string") {
      return format(new Date(date), "dd MMM yyyy");
    }
    return format(date, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | Timestamp | undefined | null): string {
  if (!date) return "—";
  try {
    if (date instanceof Timestamp) {
      return format(date.toDate(), "dd MMM yyyy, HH:mm");
    }
    if (typeof date === "string") {
      return format(new Date(date), "dd MMM yyyy, HH:mm");
    }
    return format(date, "dd MMM yyyy, HH:mm");
  } catch {
    return "—";
  }
}

export function timeAgo(date: Timestamp | Date | string | undefined | null): string {
  if (!date) return "—";
  try {
    const d = date instanceof Timestamp ? date.toDate() : new Date(date as string);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function formatCurrency(
  amount: number | undefined | null,
  currency = "AED"
): string {
  if (amount === undefined || amount === null) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString("en-AE");
}

export function generateCode(prefix: string, num: number, pad = 4): string {
  return `${prefix}${String(num).padStart(pad, "0")}`;
}

export function getDaysUntilExpiry(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(dateStr), new Date());
}

export function getExpiryStatus(daysLeft: number | null): {
  label: string;
  color: string;
} {
  if (daysLeft === null) return { label: "No Date", color: "text-gray-400" };
  if (daysLeft < 0) return { label: "Expired", color: "text-red-600" };
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: "text-red-500" };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: "text-orange-500" };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, color: "text-yellow-600" };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: "text-blue-500" };
  return { label: `${daysLeft}d left`, color: "text-green-600" };
}

export function truncate(str: string, length = 40): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function calculateVAT(amount: number, vatPct = 5): number {
  return (amount * vatPct) / 100;
}

export function calculateTotal(
  items: Array<{ quantity: number; unitPrice: number; discount?: number }>
): number {
  return items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discount = item.discount ? (lineTotal * item.discount) / 100 : 0;
    return sum + lineTotal - discount;
  }, 0);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
