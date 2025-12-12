import NeedPost from '../model/NeedPost.js';
import User from '../model/User.js';
import Notification from '../model/Notification.js'; // Import Notification Model
import { BadRequestError, NotFoundError } from '../errors/index.js';
import { sendPushNotification } from '../utils/firebase.js'; // Import Firebase Utility

// @desc    Create a new Need Post
// @route   POST /api/v1/needs/create
const createNeed = async (req, res) => {
  const { content, urgency } = req.body;
  const userId = req.user.userId;

  if (!content) {
    throw new BadRequestError('Please provide content');
  }

  // 1. Validate User
  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You must join a family first');
  }

  // 2. Create Need in DB
  const need = await NeedPost.create({
    content,
    urgency: urgency || 'normal',
    createdBy: userId,
    familyId: user.familyId,
  });

  // 3. Real-time: Emit to Socket
  const io = req.app.get('io');
  io.to(user.familyId.toString()).emit('new_need', need);

  // 4. Notifications: Push + Database
  // Find all family members EXCEPT the creator
  const familyMembers = await User.find({
    familyId: user.familyId,
    _id: { $ne: userId },
  });

  const notificationTitle = urgency === 'urgent' ? 'URGENT Family Need' : 'New Family Need';
  const notificationBody = `${user.name} needs: ${content}`;

  for (const member of familyMembers) {
    // A. Create DB Notification
    await Notification.create({
      recipient: member._id,
      sender: userId,
      type: 'new_need',
      content: notificationBody,
      relatedId: need._id,
    });

    // B. Send Push Notification
    if (member.fcmToken) {
      sendPushNotification(
        member.fcmToken,
        notificationTitle,
        notificationBody,
        { type: 'need', familyId: user.familyId.toString() }
      );
    }
  }

  res.status(201).json({ need });
};

// @desc    Get all Needs for the user's family
// @route   GET /api/v1/needs
const getFamilyNeeds = async (req, res) => {
  const userId = req.user.userId;
  
  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You are not in a family group');
  }

  const needs = await NeedPost.find({ familyId: user.familyId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name avatar');

  res.status(200).json({ needs, count: needs.length });
};

// @desc    Update Need Status (e.g., mark as fulfilled)
// @route   PATCH /api/v1/needs/:id
const updateNeedStatus = async (req, res) => {
  const { id: needId } = req.params;
  const { status } = req.body;
  const userId = req.user.userId;

  if (!status) {
    throw new BadRequestError('Please provide status');
  }

  const need = await NeedPost.findById(needId);
  if (!need) {
    throw new NotFoundError(`No need found with id ${needId}`);
  }

  need.status = status;
  await need.save();

  // Real-time update
  const io = req.app.get('io');
  io.to(need.familyId.toString()).emit('update_need', need);

  // (Optional: You could add logic here to notify the original creator 
  // that their need was fulfilled, but I have kept it simple for now)

  res.status(200).json({ need });
};

export { createNeed, getFamilyNeeds, updateNeedStatus };