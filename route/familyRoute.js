import express from 'express';
import { 
  createFamily, 
  joinFamily, 
  getFamilyMembers,
  sendInvite,
  respondToInvite
} from '../controller/familyController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Existing Routes
router.post('/create', auth, createFamily);
router.post('/join', auth, joinFamily);
router.get('/members', auth, getFamilyMembers);

// --- NEW ROUTES ---
// Send an invite to a phone number
router.post('/invite', auth, sendInvite);

// Accept or Reject an invite
router.post('/respond', auth, respondToInvite);

export default router;