import cron from "node-cron";
import cloudinary from "../config/cloudinary.js";
import { MEDIA_EXPIRY_FOLDERS, EXPIRY_MS } from "./cloudinaryUpload.js";

/**
 * Delete a single Cloudinary asset safely with CDN cache invalidation.
 */
const destroyAsset = async (publicId, resourceType) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result;
  } catch (err) {
    console.warn(
      `[MediaCleanup] Failed to destroy ${publicId} (${resourceType}):`,
      err.message,
    );
    return null;
  }
};

/**
 * Fetch all assets in a Cloudinary folder that have exceeded the 48-hour expiration period.
 * Inspects both explicit `uploaded_at_` tags and Cloudinary's native `created_at` timestamp.
 * Handles pagination via `next_cursor`.
 */
const fetchExpiredAssetsInFolder = async (folder, resourceType = "image") => {
  const expired = [];
  let nextCursor = null;

  do {
    const params = {
      type: "upload",
      prefix: folder + "/",
      resource_type: resourceType,
      max_results: 100,
      tags: true,
      context: true,
    };
    if (nextCursor) params.next_cursor = nextCursor;

    let result;
    try {
      result = await cloudinary.api.resources(params);
    } catch (err) {
      console.warn(
        `[MediaCleanup] Could not list resources in folder "${folder}" (${resourceType}):`,
        err.message,
      );
      break;
    }

    const resources = result?.resources || [];
    for (const asset of resources) {
      const tags = asset.tags || [];

      // Determine upload timestamp: prefer custom uploaded_at tag/context, fallback to created_at
      let uploadedAt = null;
      const uploadedAtTag = tags.find((t) => t.startsWith("uploaded_at_"));
      if (uploadedAtTag) {
        uploadedAt =
          parseInt(uploadedAtTag.replace("uploaded_at_", ""), 10) * 1000;
      } else if (asset.context?.custom?.uploaded_at) {
        uploadedAt = parseInt(asset.context.custom.uploaded_at, 10) * 1000;
      } else if (asset.created_at) {
        uploadedAt = new Date(asset.created_at).getTime();
      }

      // If media is older than 48 hours (EXPIRY_MS = 48 * 60 * 60 * 1000), mark for deletion
      if (uploadedAt && Date.now() - uploadedAt >= EXPIRY_MS) {
        expired.push({ publicId: asset.public_id, resourceType });
      }
    }

    nextCursor = result?.next_cursor || null;
  } while (nextCursor);

  return expired;
};

/**
 * Run one full cleanup pass: scan all expiring folders and permanently delete
 * assets that are ≥ 48 hours old from Cloudinary.
 */
export const runMediaCleanup = async () => {
  console.log(
    "[MediaCleanup] Starting 48-hour media cleanup pass from Cloudinary…",
  );
  const startTime = Date.now();
  let totalDeleted = 0;
  let totalErrors = 0;

  const resourceTypesPerFolder = {
    chatapp_messages: ["image", "video", "raw"],
    chatapp_status: ["image"],
    chatapp_status_videos: ["video"],
    chatapp_status_songs: ["video", "raw"], // audio files stored under video or raw in Cloudinary
  };

  for (const folder of MEDIA_EXPIRY_FOLDERS) {
    const types = resourceTypesPerFolder[folder] || ["image", "video", "raw"];

    for (const resourceType of types) {
      const expired = await fetchExpiredAssetsInFolder(folder, resourceType);

      for (const { publicId, resourceType: rType } of expired) {
        const result = await destroyAsset(publicId, rType);
        if (result?.result === "ok" || result?.result === "not found") {
          totalDeleted++;
          console.log(
            `[MediaCleanup] Permanently deleted from Cloudinary: ${publicId} (${rType})`,
          );
        } else {
          totalErrors++;
          console.warn(
            `[MediaCleanup] Could not delete ${publicId} (${rType}):`,
            result,
          );
        }
      }
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[MediaCleanup] Pass completed in ${durationSec}s. Deleted: ${totalDeleted}, Errors: ${totalErrors}`,
  );
  return { totalDeleted, totalErrors, durationSec };
};

/**
 * Register the cron job to run every hour, plus an initial check 10 seconds after boot.
 */
export const scheduleMediaCleanup = () => {
  // Initial run after server boot
  setTimeout(async () => {
    try {
      await runMediaCleanup();
    } catch (err) {
      console.error(
        "[MediaCleanup] Initial cleanup run encountered error:",
        err,
      );
    }
  }, 10000);

  // Run recurring check every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      await runMediaCleanup();
    } catch (err) {
      console.error(
        "[MediaCleanup] Unhandled error in scheduled cleanup job:",
        err,
      );
    }
  });

  console.log(
    "[MediaCleanup] Scheduled: Media older than 48 hours will be permanently purged from Cloudinary hourly.",
  );
};
