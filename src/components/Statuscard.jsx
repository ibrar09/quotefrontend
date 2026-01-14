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

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔍 [DASHBOARD] Fetching stats from:', `${API_BASE_URL}/api/dashboard/stats`);
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
        console.log('✅ [DASHBOARD] Stats response:', res.data);
        if (res.data.success) {
          setStats(res.data.data);
          console.log('✅ [DASHBOARD] Stats set:', res.data.data);
        }
      } catch (err) {
        console.error("❌ [DASHBOARD] Failed to fetch stats:", err);
        console.error("❌ [DASHBOARD] Error details:", err.response?.data || err.message);
      }
    };
    fetchStats();
  }, []);

  const handleCardClick = (card) => {
    if (card.key === "need_to_send") return navigate("/quotations/list?status=DRAFT");
    if (card.key === "sent") return navigate("/quotations/list?status=SENT");
    if (card.key === "completed") return navigate("/quotations/list?status=COMPLETED");
    if (card.key === "payment_complete") return navigate("/quotations/list?status=APPROVED");
    if (card.key === "invoices_ready") return navigate("/quotations/list?status=APPROVED");
    if (card.key === "payments_pending") return navigate("/quotations/list?status=APPROVED");
    navigate(card.link);
  };

  const getCount = (key) => {
    if (!stats) return "...";
    if (key === "need_to_send") return stats.counts.need_to_send;
    if (key === "sent") return stats.counts.sent;
    if (key === "completed") return stats.counts.completed;
    if (key === "payment_complete") return stats.counts.paid_count || 0;
    if (key === "invoices_ready") return stats.counts.approved; // Approved jobs ready for invoice
    if (key === "payments_pending") return stats.counts.approved; // Same logic for now
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
