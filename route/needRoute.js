import express from 'express';
import { 
  createNeed, 
  getFamilyNeeds, 
  updateNeedStatus 
} from '../controller/needController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Protect all need routes
router.post('/create', auth, createNeed);
router.get('/', auth, getFamilyNeeds);
router.patch('/:id', auth, updateNeedStatus);

export default router;