import * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res) => {
    try {
        const { limit = 50, unreadOnly = 'false' } = req.query;
        const notifications = await notificationService.getNotifications(
            parseInt(limit),
            unreadOnly === 'true'
        );
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount();
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markAsRead(id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.deleteNotification(id);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateNotifications = async (req, res) => {
    try {
        const result = await notificationService.generateNotifications();
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error generating notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
