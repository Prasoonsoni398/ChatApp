import express from 'express';
import { getMessages, sendMessage, deleteMessage, editMessage, pinMessage, addReaction, clearChat } from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, upload.single('image'), sendMessage);
router.put('/:id', protect, editMessage);
router.patch('/pin/:id', protect, pinMessage);
router.patch('/react/:id', protect, addReaction);
router.delete('/clear/:id', protect, clearChat);
router.delete('/:id', protect, deleteMessage);

export default router;
