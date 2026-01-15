import React, { useState } from "react";
import { FaUserCircle, FaSearch, FaSun, FaMoon, FaBars, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

const TopBar = ({ pageTitle, onMenuClick }) => {
  const { darkMode, toggleTheme, themeStyles } = useTheme(); // get global theme
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/quotations/list?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div
      className={`flex items-center justify-between shadow-md px-6 py-3 border-b transition-colors duration-500
        ${darkMode
          ? "bg-gradient-to-r from-[#4c1a57] to-[#00a8aa] border-gray-700 text-white"
          : "bg-gradient-to-r from-white to-gray-100 border-gray-200 text-gray-800"
        }`}
    >
      {/* Page Title & Navigation */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <FaBars className="text-xl" />
        </button>

        {/* Global Navigation Buttons */}
        <div className="hidden md:flex items-center gap-1 mr-2">
          <button
            onClick={() => navigate(-1)}
            className={`p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-gray-500'}`}
            title="Go Back"
          >
            <FaChevronLeft size={14} />
          </button>
          <button
            onClick={() => navigate(1)}
            className={`p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-gray-500'}`}
            title="Go Forward"
          >
            <FaChevronRight size={14} />
          </button>
        </div>

        <h1 className="text-lg md:text-xl font-bold transition-colors duration-300">{pageTitle}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search Quote #, MR #, PO #, Brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className={`pl-10 pr-4 py-2 rounded-full border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition-all duration-300
              ${darkMode
                ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500"
                : "bg-white border-gray-200 text-gray-700"
              }`}
          />
          <FaSearch
            onClick={() => navigate(`/quotations/list?search=${encodeURIComponent(searchQuery)}`)}
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer ${darkMode ? "text-gray-400" : "text-gray-400"}`}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all duration-300 ${darkMode ? "hover:bg-white/20 text-yellow-400" : "hover:bg-gray-100 text-gray-600"}`}
        >
          {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-2 p-1 rounded-full transition-all duration-300 ${darkMode ? "hover:bg-white/20" : "hover:bg-gray-100"}`}
          >
            <FaUserCircle className={`text-2xl ${darkMode ? "text-white" : "text-gray-600"}`} />
            <span className={`text-sm font-medium transition-colors duration-300 hidden md:block ${darkMode ? "text-white" : "text-gray-700"}`}>
              Admin User
            </span>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-44 rounded-xl py-2 z-50 shadow-lg border transition-colors duration-300
              ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800"}`}
            >
              <a href="#profile" className="block px-4 py-2 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-300">
                Profile
              </a>
              <a href="#settings" className="block px-4 py-2 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-300">
                Settings
              </a>
              <a href="#logout" className="block px-4 py-2 text-sm text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-700 transition-colors duration-300">
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
