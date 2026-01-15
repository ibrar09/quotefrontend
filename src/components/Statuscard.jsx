import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { cardsData as baseCardsData } from "../constants/cardsData";
import { useTheme } from "../context/ThemeContext";

const CardsSection = () => {
  const navigate = useNavigate();
  const { darkMode, colors } = useTheme();
  const [stats, setStats] = React.useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("❌ [DASHBOARD] Failed to fetch stats:", err);
    }
  };

  React.useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds to keep counts live
    const interval = setInterval(fetchStats, 30000);

    // Also refresh on window focus for immediate updates after returning from another tab
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCardClick = (card) => {
    if (card.key === "need_to_send") return navigate("/quotations/list?status=READY_TO_SEND"); // Default to Ready
    if (card.key === "sent") return navigate("/quotations/list?status=SENT");
    if (card.key === "completed") return navigate("/quotations/list?status=PO_RECEIVED");
    if (card.key === "payment_complete") return navigate("/quotations/list?status=PAID");
    if (card.key === "invoices_ready") return navigate("/quotations/list?status=APPROVED");
    if (card.key === "payments_pending") return navigate("/quotations/list?status=APPROVED");
    navigate(card.link);
  };

  const getCount = (key) => {
    if (!stats) return "...";
    if (key === "need_to_send") return stats.counts.need_to_send;
    if (key === "sent") return stats.counts.sent;
    if (key === "completed") return stats.counts.completed; // Now maps to PO_RECEIVED in backend
    if (key === "payment_complete") return stats.counts.paid_count || 0;
    if (key === "invoices_ready") return stats.counts.approved;
    if (key === "payments_pending") return stats.counts.approved;
    return 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {baseCardsData.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.02 }}
            className={`cursor-pointer flex items-center justify-between p-5 rounded-3xl shadow-xl transition-all border-b-4`}
            style={{
              background: darkMode ? "rgba(31, 41, 55, 0.5)" : "white",
              borderColor: colors.cardColors[card.color] || card.color,
              color: darkMode ? "white" : "black",
              backdropFilter: "blur(10px)"
            }}
            onClick={() => handleCardClick(card)}
          >
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>
                {card.title}
              </p>
              <p className="text-2xl font-black font-mono tracking-tighter" style={{ color: colors.cardColors[card.color] || card.color }}>
                {getCount(card.key)}
              </p>
            </div>
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${colors.cardColors[card.color] || card.color}15` }}>
              <Icon size={24} style={{ color: colors.cardColors[card.color] || card.color }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CardsSection;
