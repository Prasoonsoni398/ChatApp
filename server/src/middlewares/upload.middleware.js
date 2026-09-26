import multer from "multer";

// Use memory storage for direct streaming to Cloudinary
const storage = multer.memoryStorage();

export const MAX_AUDIO_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB limit strictly enforced for audio and video

export const isAudioOrVideoFile = (file) => {
  if (!file) return false;
  const mime = (file.mimetype || "").toLowerCase();
  const name = (file.originalname || "").toLowerCase();
  return (
    mime.startsWith("audio/") ||
    mime.startsWith("video/") ||
    /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba|mp4|webm|mov|mkv|avi|3gp|m4v)$/i.test(
      name,
    )
  );
};

export const checkAudioVideoSize = (req, res) => {
  const files = req.files
    ? Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat()
    : req.file
      ? [req.file]
      : [];

  for (const file of files) {
    if (isAudioOrVideoFile(file) && file.size > MAX_AUDIO_VIDEO_SIZE) {
      return res.status(400).json({
        error: "Audio and video uploads are restricted to a maximum of 5MB.",
      });
    }
  }
  return null;
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for chat media, images, and documents
  },
});

export const uploadAnyMedia = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    const sizeErr = checkAudioVideoSize(req, res);
    if (sizeErr) return;
    next();
  });
};

export const uploadSingleMedia = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const sizeErr = checkAudioVideoSize(req, res);
    if (sizeErr) return;
    next();
  });
};
