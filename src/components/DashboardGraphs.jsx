import React, { useEffect, useState } from "react";
import { ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";

const DashboardGraphs = () => {
  const { darkMode, colors, themeStyles } = useTheme();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔍 [GRAPHS] Fetching stats from:', `${API_BASE_URL}/api/dashboard/stats`);
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
        console.log('✅ [GRAPHS] Stats response:', res.data);
        if (res.data.success) {
          setStats(res.data.data);
          console.log('✅ [GRAPHS] Stats set:', res.data.data);
        }
      } catch (err) {
        console.error("❌ [GRAPHS] Failed to fetch stats:", err);
        console.error("❌ [GRAPHS] Error details:", err.response?.data || err.message);
      }
    };
    fetchStats();
  }, []);

  const barData = stats ? [
    { name: "Draft", value: stats.counts.need_to_send, color: colors.cardColors.orange },
    { name: "Sent", value: stats.counts.sent, color: colors.cardColors.blue },
    { name: "Approved", value: stats.counts.approved, color: colors.cardColors.yellow },
    { name: "Completed", value: stats.counts.completed, color: colors.cardColors.green },
    { name: "Cancelled", value: stats.counts.rejected, color: colors.cardColors.red },
  ] : [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Financial Summary Cards (Replaces Trend Graph) */}
      <div className="grid grid-cols-2 gap-2 md:gap-6">
        <div className={`${themeStyles.card} flex flex-col justify-between p-3 md:p-6 border-l-4 md:border-l-8 border-green-500`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Total Payment Paid</p>
              <h4 className="text-xl md:text-3xl font-black text-green-500">{stats ? formatCurrency(stats.financials.total_paid) : '...'}</h4>
            </div>
            <div className="bg-green-500/10 p-1.5 md:p-2 rounded-xl text-green-500"><TrendingUp size={16} className="md:w-6 md:h-6" /></div>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">Total collected amount from all paid invoices.</p>
        </div>

        <div className={`${themeStyles.card} flex flex-col justify-between p-3 md:p-6 border-l-4 md:border-l-8 border-red-500`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Amount Remaining</p>
              <h4 className="text-xl md:text-3xl font-black text-red-500">{stats ? formatCurrency(stats.financials.remaining) : '...'}</h4>
            </div>
            <div className="bg-red-500/10 p-1.5 md:p-2 rounded-xl text-red-500"><AlertCircle size={16} className="md:w-6 md:h-6" /></div>
          </div>
          <p className="mt-4 text-[10px] font-bold text-gray-400">Outstanding balance from approved quotations.</p>
        </div>

        <div className={`${themeStyles.card} col-span-full p-3 md:p-6 flex items-center justify-between border-l-4 md:border-l-8 border-blue-500`}>
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500"><CreditCard size={32} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500">Collection Progress</p>
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-black">
                  {stats && stats.financials.total_approved > 0
                    ? Math.round((stats.financials.total_paid / stats.financials.total_approved) * 100)
                    : 0}%
                </h4>
                <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${stats && stats.financials.total_approved > 0 ? (stats.financials.total_paid / stats.financials.total_approved) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Status Histogram */}
      <div className={themeStyles.card}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Quotations by Status</h3>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid stroke={darkMode ? "#374151" : "#f3f4f6"} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={darkMode ? "#9ca3af" : "#4b5563"}
              fontSize={10}
              fontWeight="bold"
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: darkMode ? "#1f2937" : "white",
                borderColor: colors.borderColor,
                borderRadius: 12,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: 'none',
                fontWeight: 'bold'
              }}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardGraphs;
