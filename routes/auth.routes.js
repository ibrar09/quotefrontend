import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/seed-admin', authController.seedAdmin);

// User Management Routes (Protected)
router.get('/users', verifyToken, authorize('manage_users'), authController.getUsers);
router.post('/register', verifyToken, authorize('manage_users'), authController.register);
router.put('/users/:id', verifyToken, authorize('manage_users'), authController.updateUser);
router.delete('/users/:id', verifyToken, authorize('manage_users'), authController.deleteUser);

// Self-Service Profile Route (Protected but for any logged-in user)
router.put('/profile', verifyToken, authController.updateProfile);

export default router;
