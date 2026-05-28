"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
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
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{entry.name}</span>
              <span className="font-medium ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground text-lg">{total}</span> total projects
        </div>
      </CardContent>
    </Card>
  );
}
