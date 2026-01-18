import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import AnalyticsKPIs from '../components/AnalyticsKPIs';
import FinancialKPIs from '../components/FinancialKPIs';
import { RevenueTrendChart, StatusPieChart, BrandPerformanceChart, WorkTypeChart, LeaderboardCard } from '../components/AnalyticsCharts';
import { RefreshCcw } from 'lucide-react';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/analytics`);

            if (response.data.success) {
                setData(response.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError('Failed to load analytics data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
                <p>Error: {error}</p>
                <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-red-100 rounded hover:bg-red-200">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics Overview</h1>
                    <p className="text-sm text-gray-500">Real-time business intelligence and performance metrics.</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

            {/* KPI Cards */}
            <div className="space-y-6">
                <AnalyticsKPIs data={data.kpis} />
                <h2 className="text-lg font-semibold text-gray-700">Financial Health</h2>
                <FinancialKPIs data={data.financials} />
            </div>

            {/* Charts Grid */}
            {/* Charts Grid - Revenue Trend Only */}
            <div className="grid grid-cols-1 gap-6">
                <RevenueTrendChart data={data.charts.revenueTrend.data.map((val, i) => ({
                    month: data.charts.revenueTrend.labels[i],
                    amount: val
                }))} />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BrandPerformanceChart data={data.charts.brandPerformance} />
                <WorkTypeChart data={data.charts.workTypeDistribution} />
            </div>

            {/* Employee Performance Grid - Completers Only */}
            <div className="grid grid-cols-1 gap-6">
                <LeaderboardCard
                    title="Top Completers (Who completed more work)"
                    data={data.charts.employeePerformance}
                    color="bg-green-500"
                />
            </div>

            {/* City Performance Grid (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeaderboardCard
                    title="Top Cities (Where most work is done)"
                    data={data.charts.cityPerformance}
                    color="bg-orange-500"
                    icon={RefreshCcw}
                />
            </div>

        </div>
    );
};

export default AnalyticsDashboard;
