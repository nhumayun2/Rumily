import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    // Content is not required if there is an attachment (e.g., sending just a photo)
  },
  attachment: {
    type: String, // URL from Cloudinary
    default: '',
  },
  fileType: {
    type: String, // 'image', 'video', 'raw' etc.
    default: 'text',
  },
  sender: {
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

export default mongoose.model('Message', MessageSchema);