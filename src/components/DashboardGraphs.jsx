import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useTheme } from "../context/ThemeContext";

const DashboardGraphs = () => {
  const { darkMode, colors, themeStyles } = useTheme();

  const lineData = [
    { date: "2025-12-25", count: 5 },
    { date: "2025-12-26", count: 12 },
    { date: "2025-12-27", count: 9 },
    { date: "2025-12-28", count: 15 },
  ];

  const barData = [
    { category: "Need to Send", value: 26 },
    { category: "Sent / Pending", value: 21 },
    { category: "Cancelled", value: 4 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={themeStyles.card}>
        <h3 className={`${colors.text} font-semibold mb-2`}>Quotations Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" stroke={darkMode ? "white" : "#4b5563"} />
            <YAxis stroke={darkMode ? "white" : "#4b5563"} />
            <CartesianGrid stroke={darkMode ? "#374151" : "#e5e7eb"} strokeDasharray="3 3" />
            <Tooltip contentStyle={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: darkMode ? "white" : "black", borderRadius: 8 }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={colors.cardColors.blue}
              strokeWidth={3}
              dot={{ r: 4, fill: colors.cardColors.blue }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={themeStyles.card}>
        <h3 className={`${colors.text} font-semibold mb-2`}>Quotations Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid stroke={darkMode ? "#374151" : "#e5e7eb"} strokeDasharray="3 3" />
            <XAxis dataKey="category" stroke={darkMode ? "white" : "#4b5563"} />
            <YAxis stroke={darkMode ? "white" : "#4b5563"} />
            <Tooltip contentStyle={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: darkMode ? "white" : "black", borderRadius: 8 }} />
            <Bar dataKey="value" fill={colors.cardColors.green} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardGraphs;
