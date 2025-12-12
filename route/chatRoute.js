import express from 'express';
import { sendMessage, getChatHistory } from '../controller/chatController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// 1. Check Auth
// 2. Parse File (Multer)
// 3. Handle Logic (Controller)
router.post('/send', auth, upload.single('file'), sendMessage);

router.get('/history', auth, getChatHistory);

export default router;