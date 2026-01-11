import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cardsData } from "../constants/cardsData";
import { useTheme } from "../context/ThemeContext";

const CardsSection = () => {
  const navigate = useNavigate();
  const { darkMode, colors } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {cardsData.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.05 }}
            className={`cursor-pointer flex items-center justify-between p-4 rounded-xl shadow-md transition`}
            style={{
              background: darkMode ? `linear-gradient(135deg, ${colors.primaryGradient[0]}, ${colors.primaryGradient[1]})` : colors.cardBg,
              borderLeft: `4px solid ${colors.cardColors[card.color]}`,
              color: darkMode ? "white" : "black",
            }}
            onClick={() => navigate(card.link)}
          >
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-white/70" : "text-gray-600"}`}>
                {card.title}
              </p>
              <p style={{ color: colors.cardColors[card.color] }} className="text-2xl font-bold">
                {card.count}
              </p>
            </div>
            <div className="text-3xl">
              <Icon />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CardsSection;
