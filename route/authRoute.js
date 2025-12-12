import express from 'express';
import { 
  register, 
  login, 
  getUser, 
  verifyEmail 
} from '../controller/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/verify-email', verifyEmail); // New Route
router.post('/login', login);

// Protected Routes
router.get('/me', auth, getUser);

export default router;