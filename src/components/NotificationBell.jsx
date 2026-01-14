import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ExternalLink, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useTheme } from '../context/ThemeContext';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { darkMode, colors } = useTheme();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notifications/count`);
            if (res.data.success) {
                setUnreadCount(res.data.count);
            }
        } catch (err) {
            console.error('Failed to fetch notification count:', err);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notifications?limit=10&unreadOnly=true`);
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mark as read
    const markAsRead = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
            fetchUnreadCount();
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    // Delete notification
    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API_BASE_URL}/api/notifications/${id}`);
            fetchUnreadCount();
            fetchNotifications();
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        setIsOpen(false);
        navigate(`/quotations/list?search=${notification.quote_no}`);
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return colors.cardColors.red;
            case 'MEDIUM': return colors.cardColors.orange;
            case 'LOW': return colors.cardColors.blue;
            default: return colors.cardColors.gray;
        }
    };

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl transition-all hover:scale-105"
                style={{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? 'white' : 'black'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black rounded-full text-white"
                        style={{ backgroundColor: colors.cardColors.red }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50"
                    style={{
                        backgroundColor: darkMode ? '#1f2937' : 'white',
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                    }}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b" style={{ borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)' }}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="text-xs font-bold" style={{ color: colors.cardColors.red }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                                <p className="text-sm font-bold text-gray-400">All caught up!</p>
                                <p className="text-xs text-gray-500 mt-1">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className="group px-6 py-4 border-b cursor-pointer transition-all hover:bg-opacity-50"
                                    style={{
                                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)',
                                        backgroundColor: darkMode ? 'transparent' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Priority Indicator */}
                                        <div
                                            className="w-1 h-12 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getPriorityColor(notif.priority) }}
                                        />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold mb-1" style={{ color: darkMode ? '#f9fafb' : '#111827' }}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                                <span className="font-mono">{notif.quote_no}</span>
                                                <span>•</span>
                                                <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => deleteNotification(notif.id, e)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                            <ExternalLink size={14} style={{ color: colors.cardColors.blue }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-6 py-3 border-t text-center" style={{ borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)' }}>
                            <button
                                className="text-xs font-black uppercase tracking-wider hover:underline"
                                style={{ color: colors.cardColors.blue }}
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to full notifications page (if you create one)
                                }}
                            >
                                View All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
