import express from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js'; // Fixed path

const router = express.Router();

// GET /api/analytics
router.get('/', verifyToken, getDashboardAnalytics);

export default router;
