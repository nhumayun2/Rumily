import express from 'express';
import authRouter from '../route/authRoute.js';
import familyRouter from '../route/familyRoute.js';
import needRouter from '../route/needRoute.js';
import chatRouter from '../route/chatRoute.js';
import notificationRouter from '../route/notificationRoute.js';
import groceryRouter from '../route/groceryRoute.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/family', familyRouter);
router.use('/needs', needRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationRouter);
router.use('/grocery', groceryRouter);

export default router;