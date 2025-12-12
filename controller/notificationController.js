import User from '../model/User.js';
import Notification from '../model/Notification.js';
import { BadRequestError } from '../errors/index.js';

// @desc    Update User's FCM Device Token
// @route   POST /api/v1/notifications/token
const updateFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.userId;

  if (!fcmToken) {
    throw new BadRequestError('Please provide FCM token');
  }

  // Update the user's profile with the new token
  await User.findByIdAndUpdate(userId, { fcmToken });

  res.status(200).json({ msg: 'FCM Token updated successfully' });
};

// @desc    Get User's Notifications
// @route   GET /api/v1/notifications
const getNotifications = async (req, res) => {
  const userId = req.user.userId;
  
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 }) // Newest first
    .limit(20) // Only fetch last 20 to keep it fast
    .populate('sender', 'name avatar');

  // Optional: Mark them as read immediately (or create a separate endpoint for that)
  // await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

  res.status(200).json({ notifications });
};

export { updateFcmToken, getNotifications };