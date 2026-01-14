import React, { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Define reusable colors
  const colors = {
    primaryGradient: darkMode ? ["#4c1a57", "#00a8aa"] : ["#ffffff", "#f3f4f6"],
    cardColors: {
      red: darkMode ? "#f87171" : "#ef4444",
      blue: darkMode ? "#60a5fa" : "#3b82f6",
      green: darkMode ? "#34d399" : "#10b981",
      orange: darkMode ? "#fbbf24" : "#f59e0b",
      purple: darkMode ? "#a78bfa" : "#8b5cf6",
      gray: darkMode ? "#9ca3af" : "#6b7280",
      yellow: darkMode ? "#facc15" : "#eab308",
      teal: darkMode ? "#2dd4bf" : "#14b8a6",
    },
    text: darkMode ? "text-white" : "text-gray-800",
    textSecondary: darkMode ? "text-gray-400" : "text-gray-500",
    cardBg: darkMode ? "#1f1f2e" : "#ffffff",
    pageBg: darkMode ? "#111827" : "#f9fafb", // Slightly off-white for page background
    inputBg: darkMode ? "#111827" : "#ffffff",
    tableHeader: darkMode ? "#374151" : "#f3f4f6",
    borderColor: darkMode ? "border-gray-700" : "border-gray-200",
  };

  const themeStyles = {
    container: `transition-colors duration-500 ${darkMode ? "bg-[#111827] text-white" : "bg-[#f9fafb] text-gray-800"}`,
    card: `rounded-lg shadow-md p-4 transition-colors duration-300 ${darkMode ? "bg-[#1f1f2e] text-white" : "bg-white text-gray-800 border border-gray-100"}`,
    input: `w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
      }`,
    button: `px-4 py-2 rounded-lg font-medium transition-all duration-300 transform active:scale-95 ${darkMode ? "bg-[#00a8aa] hover:bg-[#008f91] text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
      }`,
    tableHeader: `uppercase text-xs font-semibold tracking-wide ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`,
    tableRow: `border-b transition-colors duration-200 ${darkMode ? "border-gray-700 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"}`,
    iconColor: darkMode ? "text-white" : "text-gray-600",
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, colors, themeStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
