import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function AnalyticsChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="p-6 bg-[#F6EFE5] rounded-lg shadow-md shadow-black/10 border border-[#CDB494]/30 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-[#CDB494]/30 pb-3">
        <h2 className="text-lg font-bold text-[#7F2F07] tracking-wide italic">
          Weekly Consistency Trend
        </h2>
        <span className="text-xs italic text-[#6B5B47]">Last 7 Days</span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              stroke="#6B5B47"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6B5B47"
              fontSize={12}
              allowDecimals={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#251712",
                borderColor: "#CDB494",
                borderRadius: "8px",
                color: "#F6EFE5",
                fontSize: "12px",
              }}
              cursor={{ fill: "rgba(127, 47, 7, 0.1)" }}
            />
            <Bar dataKey="completed" fill="#C98928" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;
