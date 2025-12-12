import mongoose from 'mongoose';

const NeedPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide the content of the need'],
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled'],
    default: 'active',
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('NeedPost', NeedPostSchema);