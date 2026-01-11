// src/components/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Sidebar = ({ darkMode = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      route: "/",
    },
    {
      id: "quotations",
      label: "Quotations",
      icon: "📝",
      subItems: [
        {
          id: "quotation-tracker",
          label: "📋 Quotation Tracker",
          route: "/quotations/list",
          count: 0,
          color: "blue",
        },
        {
          id: "intake-tracker",
          label: "📥 Intake Tracker",
          route: "/quotations/intakes",
          count: 0,
          color: "yellow",
        },
        {
          id: "new-intake",
          label: "➕ New Intake Entry",
          route: "/quotations/new",
          count: 0,
          color: "green",
        },
      ],
    },
    {
      id: "work-orders",
      label: "Work Orders",
      icon: "🔨",
      subItems: [
        {
          id: "work-tracker",
          label: "Work Tracker",
          route: "/work/list",
          count: 0,
          color: "orange",
        }
      ],
    },
    // {
    //   id: "finance",
    //   label: "Finance & Invoicing",
    //   icon: "💰",
    //   route: "/finance",
    // },
    {
      id: "master-data",
      label: "Master Data (AOR)",
      icon: "🗄️",
      subItems: [
        { id: "md-view", label: "Dashboard View", route: "/master-data", color: "blue" },
        { id: "md-sync", label: "Sync / Upload", route: "/admin/data-sync", color: "indigo" },
      ]
    },
    {
      id: "rate-card",
      label: "Price List / Rate Card",
      icon: "💲",
      subItems: [
        { id: "pl-view", label: "Rate Card View", route: "/rate-card", color: "green" },
        { id: "pl-sync", label: "Sync / Upload", route: "/admin/data-sync", color: "indigo" },
      ]
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleMainClick = (item) => {
    if (item.subItems) {
      setOpenSubMenu(openSubMenu === item.id ? null : item.id);
    } else if (item.route) {
      navigate(item.route);
      setOpenSubMenu(null);
    }
  };

  const handleSubClick = (route) => {
    navigate(route);
  };

  const isActiveRoute = (route) => location.pathname === route;

  const getBadgeClass = (color) => {
    switch (color) {
      case "red":
        return "bg-red-100 text-red-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "orange":
        return "bg-orange-100 text-orange-600";
      case "indigo":
        return "bg-indigo-100 text-indigo-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300
      ${isOpen ? "w-64" : "w-20"}
      ${darkMode
          ? "bg-gradient-to-b from-[#6a0dad] to-[#9b4dcc] text-white"
          : "bg-white text-gray-800"
        } shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        {isOpen && <span className="text-lg font-bold">Maaj</span>}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-white/20"
        >
          {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              {/* Main item */}
              <div
                onClick={() => handleMainClick(item)}
                className={`flex items-center p-3 mx-2 rounded-xl cursor-pointer transition
                ${isActiveRoute(item.route)
                    ? "bg-blue-600 text-white shadow"
                    : "hover:bg-white/20"
                  }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {isOpen && <span className="flex-1 text-sm">{item.label}</span>}
                {item.subItems && isOpen && (
                  <FaChevronRight
                    size={12}
                    className={`transition-transform ${openSubMenu === item.id ? "rotate-90" : ""
                      }`}
                  />
                )}
              </div>

              {/* Sub menu */}
              {isOpen && item.subItems && openSubMenu === item.id && (
                <ul className="ml-10 mt-1 space-y-1">
                  {item.subItems.map((sub) => (
                    <li key={sub.id}>
                      <div
                        onClick={() => handleSubClick(sub.route)}
                        className={`flex items-center justify-between px-3 py-1 text-xs rounded-md cursor-pointer
                        ${isActiveRoute(sub.route)
                            ? "bg-white/30 font-semibold"
                            : "hover:bg-white/20"
                          }`}
                      >
                        <span>{sub.label}</span>
                        {sub.count > 0 && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${getBadgeClass(
                              sub.color
                            )}`}
                          >
                            {sub.count}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            AD
          </div>
          {isOpen && (
            <div>
              <p className="text-sm font-semibold">Admin User</p>
              <p className="text-xs text-gray-300">FM Manager</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
