import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label?: string };
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    trend?.value === 0 ? Minus : trend?.value && trend.value > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend?.value === 0
      ? "text-muted-foreground bg-muted"
      : trend?.value && trend.value > 0
      ? "text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-100"
      : "text-red-700 bg-red-50 ring-1 ring-inset ring-red-100";

  return (
    <Card className="group relative overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold mt-2 tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    trendColor
                  )}
                >
                  <TrendIcon className="h-2.5 w-2.5" />
                  {Math.abs(trend.value)}%
                </span>
                {trend.label && (
                  <span className="text-[10px] text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.03]",
              iconBg
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
