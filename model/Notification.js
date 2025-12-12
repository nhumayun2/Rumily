import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Who caused the notification
  },
  type: {
    type: String,
    enum: ['family_invite', 'new_need', 'new_message', 'need_fulfilled'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can be ID of a FamilyRequest, NeedPost, or Message depending on type
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);