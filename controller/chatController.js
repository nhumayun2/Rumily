import Message from '../model/Message.js';
import User from '../model/User.js';
import Notification from '../model/Notification.js'; // Import Notification Model
import { BadRequestError } from '../errors/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { sendPushNotification } from '../utils/firebase.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Send a Message (Text + Optional File)
// @route   POST /api/v1/chat/send
const sendMessage = async (req, res) => {
  const { content, fileType } = req.body;
  const userId = req.user.userId;

  // 1. Validate User & Family
  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You must join a family first');
  }

  // 2. Handle File Upload (if exists)
  let attachmentUrl = '';
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'family-connect-uploads',
        resource_type: 'auto',
      });
      attachmentUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new BadRequestError('Image upload failed');
    }
  }

  if (!content && !attachmentUrl) {
    throw new BadRequestError('Message cannot be empty');
  }

  // 3. Create Message in DB
  const message = await Message.create({
    content,
    attachment: attachmentUrl,
    fileType: fileType || 'text',
    sender: userId,
    familyId: user.familyId,
  });

  await message.populate('sender', 'name avatar');

  // 4. Real-time: Emit to Socket (for open app)
  const io = req.app.get('io');
  io.to(user.familyId.toString()).emit('new_message', message);

  // 5. Notifications: Push + Database History
  const familyMembers = await User.find({
    familyId: user.familyId,
    _id: { $ne: userId }, // Exclude sender
  });

  const notificationBody = content 
    ? `${user.name}: ${content}` 
    : `${user.name} sent a file`;

  for (const member of familyMembers) {
    // A. Create Notification in Database
    await Notification.create({
      recipient: member._id,
      sender: userId,
      type: 'new_message',
      content: notificationBody,
      relatedId: message._id,
    });

    // B. Send Push Notification (if token exists)
    if (member.fcmToken) {
      sendPushNotification(
        member.fcmToken,
        'New Family Message',
        notificationBody,
        { type: 'chat', familyId: user.familyId.toString() }
      );
    }
  }

  res.status(201).json({ message });
};

// @desc    Get Chat History for Family
// @route   GET /api/v1/chat/history
const getChatHistory = async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You are not in a family group');
  }

  const messages = await Message.find({ familyId: user.familyId })
    .sort({ createdAt: 1 })
    .populate('sender', 'name avatar');

  res.status(200).json({ messages, count: messages.length });
};

export { sendMessage, getChatHistory };