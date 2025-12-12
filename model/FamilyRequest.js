import mongoose from 'mongoose';

const FamilyRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// Prevent duplicate pending requests between same users
FamilyRequestSchema.index({ senderId: 1, receiverId: 1, familyId: 1 }, { unique: true });

export default mongoose.model('FamilyRequest', FamilyRequestSchema);