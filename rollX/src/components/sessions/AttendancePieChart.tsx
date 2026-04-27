"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck } from "lucide-react";

const COLORS = {
  present: "#22c55e",
  absent: "#ef4444", 
};

interface ChartData {
  present: number;
  absent: number;
}

interface RenderCustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  value: number;
}

// Custom label component to show numbers on the chart slices
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  value,
}: RenderCustomizedLabelProps) => {
  // Do not render a label if the value is 0 to avoid clutter
  if (value === 0) return null;

  // Position the label slightly inside the outer edge for better aesthetics
  const radius = outerRadius * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="16"
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

export function AttendancePieChart({ data }: { data: ChartData }) {
  const chartData = [
    { name: "Present", value: data.present },
    { name: "Absent", value: data.absent },
  ];

  const total = data.present + data.absent;
  const percentage =
    total > 0 ? ((data.present / total) * 100).toFixed(1) : "0.0";

  return (
    <Card className="shadow-sm h-full flex flex-col animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Session Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col md:flex-row items-center justify-around gap-6 p-6">
        <div className="w-full h-64 md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel as any}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={data.present > 0 && data.absent > 0 ? 5 : 0} 
              >
                <Cell key={`cell-present`} fill={COLORS.present} />
                <Cell key={`cell-absent`} fill={COLORS.absent} />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend iconType="square" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center md:text-left space-y-2">
          <p className="text-6xl font-bold">{percentage}%</p>
          <p className="text-muted-foreground font-medium">Attendance Rate</p>
          <div className="pt-4 text-sm flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
            <UserCheck className="h-4 w-4 text-green-500" />
            <span>
              <span className="font-bold text-foreground">{data.present}</span>{" "}
              of <span className="font-bold text-foreground">{total}</span>{" "}
              members were present.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
