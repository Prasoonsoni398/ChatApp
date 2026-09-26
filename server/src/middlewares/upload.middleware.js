import multer from "multer";

// Use memory storage for direct streaming to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for chat media, videos, audio, and documents
  },
});

export const uploadAnyMedia = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};
