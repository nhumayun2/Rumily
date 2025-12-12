import express from 'express';
import { 
  createList, 
  getFamilyLists, 
  addItem, 
  toggleItem, 
  markListSeen
} from '../controller/groceryController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Protect all grocery routes
router.use(auth);

// Create a new list (e.g., "Weekly Groceries")
router.post('/create', createList);

// Get all lists for the family
router.get('/', getFamilyLists);

// Add an item to a specific list
router.post('/:id/items', addItem);

// Toggle item status (Buy/Unbuy)
// requires both List ID and Item ID
router.patch('/:listId/items/:itemId', toggleItem);

// Mark a list as "Seen" by the user
router.post('/:id/seen', markListSeen);

export default router;