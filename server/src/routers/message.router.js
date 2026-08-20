import express from 'express';
import { getMessages, sendMessage, deleteMessage, editMessage } from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, upload.single('image'), sendMessage);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);

export default router;
