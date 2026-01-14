import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { ExternalLink, Clock, Building2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentActivityTable = () => {
  const { darkMode, colors } = useTheme();
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
        if (res.data.success) {
          setActivities(res.data.data.recent || []);
        }
      } catch (err) {
        console.error("Failed to fetch activities", err);
      }
    };
    fetchStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return colors.cardColors.green;
      case 'APPROVED': return colors.cardColors.green;
      case 'SENT': return colors.cardColors.blue;
      case 'REVISED': return colors.cardColors.blue;
      case 'DRAFT': return colors.cardColors.orange;
      case 'CANCELLED': return colors.cardColors.red;
      case 'REJECTED': return colors.cardColors.red;
      default: return colors.cardColors.gray;
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-8 overflow-hidden rounded-3xl shadow-2xl border-0" style={{
      background: darkMode ? "linear-gradient(135deg, rgba(31, 41, 55, 0.4), rgba(17, 24, 39, 0.6))" : "white",
      backdropFilter: "blur(20px)"
    }}>
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 border-b" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.8)" }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.cardColors.blue}15` }}>
            <Clock size={20} style={{ color: colors.cardColors.blue }} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
            Recent Activities
          </h3>
        </div>
        <button
          onClick={() => navigate('/quotations/list')}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105"
          style={{
            backgroundColor: `${colors.cardColors.blue}15`,
            color: colors.cardColors.blue
          }}
        >
          View All
          <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Activities List */}
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: "rgba(107, 114, 128, 0.1)" }}>
              <FileText size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No recent activity</p>
            <p className="text-xs text-gray-500 mt-2">Updates will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="group relative flex items-center justify-between p-3 md:p-5 rounded-2xl transition-all duration-300 cursor-pointer border hover:shadow-lg gap-2 md:gap-4"
                style={{
                  backgroundColor: darkMode ? "rgba(31, 41, 55, 0.3)" : "rgba(249, 250, 251, 0.5)",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(229, 231, 235, 0.5)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(31, 41, 55, 0.5)" : "rgba(249, 250, 251, 1)";
                  e.currentTarget.style.borderColor = colors.cardColors.blue + "40";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(31, 41, 55, 0.3)" : "rgba(249, 250, 251, 0.5)";
                  e.currentTarget.style.borderColor = darkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(229, 231, 235, 0.5)";
                }}
                onClick={() => navigate(`/quotations/list?search=${encodeURIComponent(activity.quote_no)}`)}
              >
                {/* Left Side - Quote Info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Index Badge */}
                  <div
                    className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl font-black text-[10px] md:text-xs shrink-0"
                    style={{
                      backgroundColor: `${getStatusColor(activity.status)}15`,
                      color: getStatusColor(activity.status)
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Quote Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-xs md:text-sm truncate" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
                        {activity.quote_no}
                      </span>
                      <span
                        className="px-1.5 py-0.5 md:px-2.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: `${getStatusColor(activity.status)}20`,
                          color: getStatusColor(activity.status)
                        }}
                      >
                        {activity.status}
                      </span>
                      {/* MR Number Badge */}
                      {activity.mr_no && activity.mr_no !== 'N/A' && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 font-mono">
                          {activity.mr_no}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <Building2 size={12} />
                      <span className="font-semibold truncate max-w-[120px]">{activity.brand}</span>
                      {activity.work_description && (
                        <span className="truncate max-w-[200px] opacity-70 border-l pl-2 ml-1 border-gray-500">
                          {activity.work_description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Time & Amount */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {/* Amount Display */}
                    {Number(activity.grand_total) > 0 && (
                      <div className="text-xs md:text-sm font-bold mb-0.5 text-emerald-500">
                        {new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(activity.grand_total)}
                      </div>
                    )}
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}>
                      {formatTime(activity.updatedAt)}
                    </div>
                  </div>

                  <button
                    className="p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    style={{
                      backgroundColor: `${colors.cardColors.blue}10`,
                      color: colors.cardColors.blue
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/quotations/list?search=${encodeURIComponent(activity.quote_no)}`);
                    }}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityTable;
