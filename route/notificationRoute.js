import express from 'express';
import { updateFcmToken, getNotifications } from '../controller/notificationController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/notifications/token - Save the phone's FCM token
router.post('/token', auth, updateFcmToken);

// GET /api/v1/notifications - Get list of past alerts
router.get('/', auth, getNotifications);

export default router;