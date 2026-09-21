import express from 'express';
import { uploadStatus, getStatuses, deleteStatus } from '../controllers/status.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadStatus);
router.get('/', protect, getStatuses);
router.delete('/:id', protect, deleteStatus);

export default router;
