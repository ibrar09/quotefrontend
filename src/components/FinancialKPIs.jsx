import React from 'react';
import { FileText, Tag, BarChart2, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const KPICard = ({ title, value, subtext, icon: Icon, color, iconBg }) => {
    const { darkMode } = useTheme();

    return (
        <div className={`
            p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group
            ${darkMode
                ? "bg-[#1f1f2e] border-gray-700/50"
                : "bg-white border-gray-100"
            }
        `}>
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 
                    ${darkMode ? "bg-opacity-10" : iconBg}
                `}>
                    <Icon className={`w-6 h-6 ${darkMode ? "text-gray-100" : color}`} />
                </div>
                {subtext && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg border 
                        ${darkMode
                            ? "bg-gray-800/50 text-gray-400 border-gray-700"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                        }
                    `}>
                        {subtext}
                    </span>
                )}
            </div>

            <div>
                <h3 className={`text-2xl font-bold mb-1 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {value}
                </h3>
                <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {title}
                </p>
            </div>
        </div>
    );
};

const FinancialKPIs = ({ data }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title="Total VAT Collected"
                value={`SAR ${Number(data.totalVAT).toLocaleString()}`}
                subtext="Tax Liability (15%)"
                icon={FileText}
                color="text-teal-600"
                iconBg="bg-teal-50"
            />
            <KPICard
                title="Total Discounts"
                value={`SAR ${Number(data.totalDiscount).toLocaleString()}`}
                subtext="Approved Jobs"
                icon={Tag}
                color="text-pink-600"
                iconBg="bg-pink-50"
            />
            <KPICard
                title="Total Paid"
                value={`SAR ${Number(data.totalPaid).toLocaleString()}`}
                subtext="Cash Collected"
                icon={BarChart2}
                color="text-cyan-600"
                iconBg="bg-cyan-50"
            />
            <KPICard
                title="Outstanding Balance"
                value={`SAR ${Number(data.outstandingAmount).toLocaleString()}`}
                subtext="Revenue - Paid"
                icon={Clock}
                color="text-amber-600"
                iconBg="bg-amber-50"
            />
        </div>
    );
};

export default FinancialKPIs;
