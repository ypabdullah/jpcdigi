
import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  Bar,
  Line,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#FF7E47"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40
}: ChartProps) {
  return (
    <ChartContainer
      config={{ [categories[0]]: { color: colors[0] } }}
    >
      <RechartsBarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={index} />
        <YAxis width={yAxisWidth} tickFormatter={valueFormatter} />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {payload[0].payload[index]}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {valueFormatter(Number(payload[0].value))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i] || colors[0]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["#FF7E47"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40
}: ChartProps) {
  return (
    <ChartContainer
      config={{ [categories[0]]: { color: colors[0] } }}
    >
      <RechartsLineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={index} />
        <YAxis width={yAxisWidth} tickFormatter={valueFormatter} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {payload[0].payload[index]}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {valueFormatter(Number(payload[0].value))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i] || colors[0]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}
