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
      <Card>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-9 w-9 bg-muted rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-muted rounded" />
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
      ? "text-muted-foreground"
      : trend?.value && trend.value > 0
      ? "text-green-600"
      : "text-red-500";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
                </span>
              </div>
            )}
          </div>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
