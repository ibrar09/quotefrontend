// src/layouts/DashboardLayout.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const DashboardLayout = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/quotations/new-quotation") return "New Quotation";
    if (path.startsWith("/quotations")) return "Quotations";
    if (path.startsWith("/work")) return "Work Orders";
    if (path.startsWith("/finance")) return "Finance & Invoicing";
    if (path.startsWith("/master-data")) return "Master Data (AOR)";
    if (path.startsWith("/rate-card")) return "Price List / Rate Card";
    return "";
  };

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-500 ${darkMode
        ? "bg-gradient-to-b from-[#111827] to-[#1f1f2e] text-white"
        : "bg-[#f9fafb] text-gray-900"
        }`}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        darkMode={darkMode}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          pageTitle={getPageTitle()}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
