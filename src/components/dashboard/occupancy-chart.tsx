"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface OccupancyChartProps {
  occupied: number;
  vacant: number;
  total: number;
}

export default function OccupancyChart({ occupied, vacant, total }: OccupancyChartProps) {
  const data = [
    { name: "Occupied", value: occupied },
    { name: "Vacant", value: vacant },
  ];

  const COLORS = ["#4f46e5", "#e5e7eb"];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-4">
        <p className="text-3xl font-bold text-gray-900">{total > 0 ? Math.round((occupied / total) * 100) : 0}%</p>
        <p className="text-sm text-gray-500">Occupancy Rate</p>
      </div>
    </div>
  );
}
