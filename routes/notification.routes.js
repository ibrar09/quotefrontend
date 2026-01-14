import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/generate', notificationController.generateNotifications); // Manual trigger

export default router;
