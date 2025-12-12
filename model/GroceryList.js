import mongoose from 'mongoose';

// Schema for individual items (e.g., "Milk")
const GroceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isPurchased: {
    type: Boolean,
    default: false,
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Who bought this specific item?
    default: null,
  },
});

// Main Schema for the List (e.g., "Weekly Groceries")
const GroceryListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide list title'],
    default: 'Grocery List',
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [GroceryItemSchema], // Array of items
  
  // Track who has opened/viewed this list
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

export default mongoose.model('GroceryList', GroceryListSchema);