"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#6b7280"];

interface StatusData {
  name: string;
  value: number;
  color?: string;
}

const DEMO_DATA: StatusData[] = [
  { name: "In Progress", value: 8 },
  { name: "New", value: 5 },
  { name: "On Hold", value: 2 },
  { name: "Completed", value: 12 },
  { name: "Scheduled", value: 4 },
  { name: "Closed", value: 6 },
];

export function ProjectStatusChart({ data = DEMO_DATA }: { data?: StatusData[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Project Status</CardTitle>
        <p className="text-[11px] text-muted-foreground">Across all teams</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} projects`, ""]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid hsl(220 13% 91%)",
                  fontSize: "12px",
                  boxShadow: "0 4px 16px -2px rgb(0 0 0 / 0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{total}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Total</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
              <span className="font-medium tabular-nums text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
