import Family from '../model/Family.js';
import User from '../model/User.js';
import FamilyRequest from '../model/FamilyRequest.js';
import Notification from '../model/Notification.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import crypto from 'crypto';
import { sendPushNotification } from '../utils/firebase.js';

// @desc    Create a new Family Group
// @route   POST /api/v1/family/create
const createFamily = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) {
    throw new BadRequestError('Please provide family name');
  }

  const user = await User.findById(userId);
  if (user.familyId) {
    throw new BadRequestError('You are already part of a family group');
  }

  const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  const family = await Family.create({
    name,
    inviteCode,
    createdBy: userId,
  });

  user.familyId = family._id;
  user.role = 'admin';
  await user.save();

  res.status(201).json({ family });
};

// @desc    Join a Family Group using Invite Code
// @route   POST /api/v1/family/join
const joinFamily = async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.userId;

  if (!inviteCode) {
    throw new BadRequestError('Please provide invite code');
  }

  const family = await Family.findOne({ inviteCode });
  if (!family) {
    throw new NotFoundError('Invalid invite code');
  }

  const user = await User.findById(userId);
  if (user.familyId) {
    throw new BadRequestError('You are already part of a family group');
  }

  user.familyId = family._id;
  await user.save();

  res.status(200).json({ msg: `Successfully joined ${family.name}`, family });
};

// @desc    Get all members of the current user's family
// @route   GET /api/v1/family/members
const getFamilyMembers = async (req, res) => {
  const userId = req.user.userId;

  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You are not in a family group');
  }

  const members = await User.find({ familyId: user.familyId }).select('-password');

  res.status(200).json({ members, count: members.length });
};

// --- NEW FEATURES ---

// @desc    Send Invite to a Phone Number
// @route   POST /api/v1/family/invite
const sendInvite = async (req, res) => {
  const { phoneNumber } = req.body;
  const userId = req.user.userId;

  if (!phoneNumber) {
    throw new BadRequestError('Please provide phone number');
  }

  // 1. Check Sender
  const sender = await User.findById(userId);
  if (!sender.familyId) {
    throw new BadRequestError('You must create a family before inviting others');
  }

  // 2. Check Receiver
  const receiver = await User.findOne({ phoneNumber });
  if (!receiver) {
    throw new NotFoundError('User not found with this phone number');
  }
  if (receiver.familyId) {
    throw new BadRequestError('User is already in a family');
  }

  // 3. Check for existing pending request
  const existingRequest = await FamilyRequest.findOne({
    senderId: userId,
    receiverId: receiver._id,
    status: 'pending',
  });
  if (existingRequest) {
    throw new BadRequestError('Invite already sent');
  }

  // 4. Create Request
  const request = await FamilyRequest.create({
    senderId: userId,
    receiverId: receiver._id,
    familyId: sender.familyId,
  });

  // 5. Notify Receiver (DB + Push)
  const notificationBody = `${sender.name} invited you to join their family.`;
  
  await Notification.create({
    recipient: receiver._id,
    sender: userId,
    type: 'family_invite',
    content: notificationBody,
    relatedId: request._id,
  });

  if (receiver.fcmToken) {
    sendPushNotification(
      receiver.fcmToken,
      'Family Invitation',
      notificationBody,
      { type: 'invite', requestId: request._id.toString() }
    );
  }

  res.status(201).json({ msg: 'Invite sent successfully', request });
};

// @desc    Accept or Reject Invite
// @route   POST /api/v1/family/respond
const respondToInvite = async (req, res) => {
  const { requestId, status } = req.body; // status: 'accepted' or 'rejected'
  const userId = req.user.userId;

  if (!requestId || !status) {
    throw new BadRequestError('Please provide request ID and status');
  }

  const request = await FamilyRequest.findOne({ _id: requestId, receiverId: userId });
  if (!request) {
    throw new NotFoundError('Invite not found');
  }
  if (request.status !== 'pending') {
    throw new BadRequestError('This invite has already been responded to');
  }

  // Update Status
  request.status = status;
  await request.save();

  if (status === 'accepted') {
    // Add user to family
    await User.findByIdAndUpdate(userId, { familyId: request.familyId });

    // Notify Sender that invite was accepted
    const user = await User.findById(userId);
    const sender = await User.findById(request.senderId);

    const notificationBody = `${user.name} joined your family!`;

    await Notification.create({
      recipient: request.senderId,
      sender: userId,
      type: 'family_invite',
      content: notificationBody,
      relatedId: user._id,
    });

    if (sender && sender.fcmToken) {
      sendPushNotification(
        sender.fcmToken,
        'Invite Accepted',
        notificationBody,
        { type: 'info' }
      );
    }
  }

  res.status(200).json({ msg: `Invite ${status}` });
};

export { 
  createFamily, 
  joinFamily, 
  getFamilyMembers, 
  sendInvite, 
  respondToInvite 
};