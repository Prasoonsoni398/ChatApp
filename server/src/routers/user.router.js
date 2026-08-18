import express from 'express';
import { getUsers, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', getUsers);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

export default router;
