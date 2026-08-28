import express from 'express';
import { createGroup, getGroups, getGroupMessages, sendGroupMessage, leaveGroup } from '../controllers/group.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('avatar'), createGroup);
router.get('/', protect, getGroups);
router.get('/:groupId/messages', protect, getGroupMessages);
router.post('/:groupId/messages', protect, upload.single('image'), sendGroupMessage);
router.delete('/:groupId/leave', protect, leaveGroup);

export default router;
