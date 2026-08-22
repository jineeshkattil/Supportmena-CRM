"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number; expenses: number }>;
}

const DEMO_DATA = MONTHS.slice(0, 7).map((month) => ({
  month,
  revenue: 45000 + Math.random() * 30000,
  expenses: 25000 + Math.random() * 15000,
}));

const PRIMARY = "hsl(217 91% 60%)";
const EXPENSE = "hsl(0 84% 60%)";

export function RevenueChart({ data = DEMO_DATA }: RevenueChartProps) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">Last 7 months</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</span>
            </div>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {(totalRevenue / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: EXPENSE }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Expenses</span>
            </div>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {(totalExpenses / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.25} />
                <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={EXPENSE} stopOpacity={0.15} />
                <stop offset="95%" stopColor={EXPENSE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "hsl(220 13% 91%)", strokeWidth: 1 }}
              formatter={(val: number, name: string) => [
                `AED ${val.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`,
                name === "revenue" ? "Revenue" : "Expenses",
              ]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(220 13% 91%)",
                fontSize: "12px",
                boxShadow: "0 4px 16px -2px rgb(0 0 0 / 0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={PRIMARY}
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={EXPENSE}
              strokeWidth={2}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
