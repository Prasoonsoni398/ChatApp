import cloudinary from "../config/cloudinary.js";

/**
 * MEDIA_EXPIRY_FOLDERS — Cloudinary folders whose assets expire after 48 hours.
 * Profile avatars, group icons, and channel icons are intentionally excluded.
 */
export const MEDIA_EXPIRY_FOLDERS = [
  "chatapp_messages",
  "chatapp_status",
  "chatapp_status_videos",
  "chatapp_status_songs",
];

/** 48 hours in milliseconds */
export const EXPIRY_MS = 48 * 60 * 60 * 1000;

/** Tag applied to every expiring asset */
export const EXPIRY_TAG = "expires_48h";

/**
 * Upload a buffer to Cloudinary with automatic 48-hour expiry tagging.
 * Wrap all chat media / status media uploads with this helper.
 *
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Cloudinary upload_stream options (folder, resource_type, …)
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadWithExpiry = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000); // Unix seconds
    const tags = [EXPIRY_TAG, `uploaded_at_${now}`, ...(options.tags || [])];

    const stream = cloudinary.uploader.upload_stream(
      {
        ...options,
        tags,
        context: {
          ...(options.context || {}),
          uploaded_at: now,
        },
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

/**
 * Delete a single Cloudinary asset by public_id.
 * @param {string} publicId
 * @param {string} resourceType  'image' | 'video' | 'raw'
 */
export const deleteAsset = (publicId, resourceType = "image") =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

/**
 * Extract the Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1234/chatapp_messages/abc.jpg"
 * → "chatapp_messages/abc"
 */
export const publicIdFromUrl = (url = "") => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    // Remove version segment (v1234/) if present
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    // Remove file extension
    return afterUpload.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};
