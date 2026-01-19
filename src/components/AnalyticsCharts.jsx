import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

import { useTheme } from '../context/ThemeContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label, formatter }) => {
    const { darkMode } = useTheme();
    if (active && payload && payload.length) {
        return (
            <div className={`p-4 rounded-xl shadow-xl border backdrop-blur-md 
                ${darkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/90 border-white/20"}
            `}>
                {label && <p className={`text-sm font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{label}</p>}
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className={`capitalize ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{entry.name}:</span>
                        <span className={`font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                            {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const RevenueTrendChart = ({ data }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`p-6 rounded-2xl shadow-lg border h-96 transition-all hover:shadow-xl group
            ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-100"}
        `}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Revenue Trend</h3>
                    <p className={`text-xs font-medium mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Last 6 Months Performance</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold 
                    ${darkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-600"}
                `}>
                    Growth Analysis
                </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" strokeOpacity={0.1} />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const StatusPieChart = ({ data }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`p-6 rounded-2xl shadow-lg border h-96 transition-all hover:shadow-xl
            ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-100"}
        `}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>Job Status Distribution</h3>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        cornerRadius={6}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const BrandPerformanceChart = ({ data }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`p-6 rounded-2xl shadow-lg border h-96 transition-all hover:shadow-xl
            ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-100"}
        `}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>Top Brands by Revenue</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart layout="vertical" data={data} barSize={24} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="brand"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip formatter={(val) => [`${(val / 1000).toFixed(1)}k`, 'Revenue']} />} cursor={{ fill: '#f8fafc', fillOpacity: 0.1, radius: 8 }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const WorkTypeChart = ({ data }) => {
    const { darkMode } = useTheme();
    const height = Math.max(350, data.length * 50);

    return (
        <div className={`p-6 rounded-2xl shadow-lg border h-96 overflow-y-auto transition-all hover:shadow-xl custom-scrollbar dark:custom-scrollbar-dark
            ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-100"}
        `}>
            <h3 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>Revenue & Volume by Work Type</h3>
            <div style={{ height: `${height}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" strokeOpacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="type"
                            width={120}
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <Tooltip
                            content={<CustomTooltip formatter={(val, name) => [
                                name === 'total' ? `${(val / 1000).toFixed(1)}k` : val,
                                name === 'total' ? 'Revenue' : 'Volume'
                            ]} />}
                            cursor={{ fill: '#f8fafc', fillOpacity: 0.1, radius: 4 }}
                        />
                        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Revenue" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const LeaderboardCard = ({ title, data, icon: Icon, color = "bg-blue-500" }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`p-6 rounded-2xl shadow-lg border h-96 overflow-y-auto transition-all hover:shadow-xl custom-scrollbar dark:custom-scrollbar-dark
            ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-100"}
        `}>
            <div className={`flex items-center gap-3 mb-6 sticky top-0 z-10 pb-2 border-b
                ${darkMode ? "bg-[#1f1f2e] border-gray-800" : "bg-white border-gray-50"}
            `}>
                <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                    {Icon ? <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} /> : <div className="w-5 h-5" />}
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{title}</h3>
            </div>

            <div className="space-y-4">
                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <div key={index} className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                            <div className="flex items-center gap-4">
                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    {index + 1}
                                    {index < 3 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white dark:bg-gray-800 rounded-full border-2 border-yellow-400" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.completed_by || item.approved_by || item.city || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Rank #{index + 1}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-lg font-bold text-gray-900 dark:text-gray-100">{item.count}</span>
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jobs</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/30 rounded-full flex items-center justify-center mb-2">
                            <div className="w-6 h-6 border-b-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                        </div>
                        <p className="text-sm font-medium">No data available yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};
