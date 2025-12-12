import GroceryList from '../model/GroceryList.js';
import User from '../model/User.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

// @desc    Create a new Grocery List
// @route   POST /api/v1/grocery/create
const createList = async (req, res) => {
  const { title } = req.body;
  const userId = req.user.userId;

  // Validate User
  const user = await User.findById(userId);
  if (!user.familyId) {
    throw new BadRequestError('You must join a family first');
  }

  const list = await GroceryList.create({
    title: title || 'New List',
    familyId: user.familyId,
    createdBy: userId,
    items: [],
    seenBy: [userId], // Creator has seen it obviously
  });

  // Real-time: Notify family
  const io = req.app.get('io');
  io.to(user.familyId.toString()).emit('new_grocery_list', list);

  res.status(201).json({ list });
};

// @desc    Get all lists for the family
// @route   GET /api/v1/grocery
const getFamilyLists = async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);

  if (!user.familyId) {
    throw new BadRequestError('You are not in a family group');
  }

  const lists = await GroceryList.find({ familyId: user.familyId })
    .sort({ createdAt: -1 })
    .populate('seenBy', 'name avatar') // Show who saw it
    .populate('items.purchasedBy', 'name'); // Show who bought items

  res.status(200).json({ lists });
};

// @desc    Add an item to a list
// @route   POST /api/v1/grocery/:id/items
const addItem = async (req, res) => {
  const { id: listId } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new BadRequestError('Please provide item name');
  }

  const list = await GroceryList.findById(listId);
  if (!list) {
    throw new NotFoundError(`No list found with id ${listId}`);
  }

  // Add item
  list.items.push({ name, isPurchased: false });
  await list.save();

  // Real-time update
  const io = req.app.get('io');
  io.to(list.familyId.toString()).emit('update_grocery_list', list);

  res.status(200).json({ list });
};

// @desc    Toggle Item Status (Buy/Unbuy)
// @route   PATCH /api/v1/grocery/:listId/items/:itemId
const toggleItem = async (req, res) => {
  const { listId, itemId } = req.params;
  const userId = req.user.userId;

  const list = await GroceryList.findById(listId);
  if (!list) {
    throw new NotFoundError('List not found');
  }

  // Find the specific sub-document item
  const item = list.items.id(itemId);
  if (!item) {
    throw new NotFoundError('Item not found');
  }

  // Toggle status
  item.isPurchased = !item.isPurchased;
  // If purchased, mark who did it. If unpurchased, clear it.
  item.purchasedBy = item.isPurchased ? userId : null;

  await list.save();

  // Populate user data before sending socket update
  // We need to reload to populate the sub-document reference
  await list.populate('items.purchasedBy', 'name');

  // Real-time update
  const io = req.app.get('io');
  io.to(list.familyId.toString()).emit('update_grocery_list', list);

  res.status(200).json({ list });
};

// @desc    Mark list as "Seen" by current user
// @route   POST /api/v1/grocery/:id/seen
const markListSeen = async (req, res) => {
  const { id: listId } = req.params;
  const userId = req.user.userId;

  const list = await GroceryList.findById(listId);
  if (!list) {
    throw new NotFoundError('List not found');
  }

  // Only add if not already in array (addToSet handles duplicates)
  // However, Mongoose arrays work differently, so we check manually or use $addToSet
  if (!list.seenBy.includes(userId)) {
    list.seenBy.push(userId);
    await list.save();
    
    // Populate to show names
    await list.populate('seenBy', 'name avatar');

    // Real-time update
    const io = req.app.get('io');
    io.to(list.familyId.toString()).emit('list_seen', { 
        listId, 
        seenBy: list.seenBy 
    });
  }

  res.status(200).json({ msg: 'List marked as seen' });
};

export { 
    createList, 
    getFamilyLists, 
    addItem, 
    toggleItem, 
    markListSeen 
};