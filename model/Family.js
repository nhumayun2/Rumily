import mongoose from 'mongoose';

const FamilySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide family name'],
    minlength: 3,
    maxlength: 50,
  },
  inviteCode: {
    type: String,
    required: [true, 'Please provide an invite code'],
    unique: true,
    minlength: 6,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Family', FamilySchema);