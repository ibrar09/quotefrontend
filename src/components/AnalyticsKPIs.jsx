import React from 'react';
import { DollarSign, Briefcase, TrendingUp, Activity } from 'lucide-react';

const KPICard = ({ title, value, subtext, icon: Icon, gradient }) => (
    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${gradient} text-white group`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                {subtext && (
                    <p className="text-xs font-medium mt-3 px-2 py-1 bg-white/20 rounded-lg inline-block backdrop-blur-sm border border-white/10">
                        {subtext}
                    </p>
                )}
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const AnalyticsKPIs = ({ data }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title="Total Revenue"
                value={`SAR ${Number(data.totalRevenue).toLocaleString()}`}
                subtext="+12.5% vs last month"
                icon={DollarSign}
                gradient="from-blue-600 to-blue-400"
            />
            <KPICard
                title="Win Rate"
                value={`${data.winRate}%`}
                subtext="Conversion Strength"
                icon={TrendingUp}
                gradient="from-emerald-500 to-emerald-300"
            />
            <KPICard
                title="Active Jobs"
                value={data.activeJobs}
                subtext="Projects In Pipeline"
                icon={Activity}
                gradient="from-violet-600 to-violet-400"
            />
            <KPICard
                title="Total Quotes"
                value={data.totalQuotes}
                subtext="Lifetime Generated"
                icon={Briefcase}
                gradient="from-amber-500 to-amber-300"
            />
        </div>
    );
};

export default AnalyticsKPIs;
