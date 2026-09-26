import Status from "../models/status.model.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Helper to parse and upload song attachments for status
 */
const parseSongData = async (req) => {
  let song = { title: "", artist: "", audioUrl: "" };
  if (req.body.song) {
    try {
      song =
        typeof req.body.song === "string"
          ? JSON.parse(req.body.song)
          : req.body.song;
    } catch (_e) {
      // ignore JSON parse error
    }
  }
  if (req.body.songTitle) song.title = req.body.songTitle;
  if (req.body.songArtist) song.artist = req.body.songArtist;
  if (req.body.songAudioUrl) song.audioUrl = req.body.songAudioUrl;

  const files = req.files
    ? Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat()
    : req.file
      ? [req.file]
      : [];

  const audioFile = files.find(
    (f) =>
      f.mimetype?.startsWith("audio/") ||
      /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i.test(f.originalname || ""),
  );

  if (audioFile) {
    try {
      const uploadAudioResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "chatapp_status_songs", resource_type: "auto" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          },
        );
        stream.end(audioFile.buffer);
      });
      song.audioUrl = uploadAudioResult.secure_url;
      if (!song.title) {
        song.title =
          audioFile.originalname?.replace(/\.[^/.]+$/, "") || "Custom Audio";
      }
      if (!song.artist) {
        song.artist = "Custom Track";
      }
    } catch (_err) {
      song.audioUrl = `data:${audioFile.mimetype || "audio/mp3"};base64,${audioFile.buffer.toString("base64")}`;
      if (!song.title) {
        song.title =
          audioFile.originalname?.replace(/\.[^/.]+$/, "") || "Custom Audio";
      }
      if (!song.artist) {
        song.artist = "Custom Track";
      }
    }
  }

  return song.title || song.audioUrl ? song : undefined;
};

/**
 * Upload Media Status (Image or Video - PRD FR-03, FR-04, AC-01, AC-02)
 */
export const uploadStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
        ? [req.file]
        : [];

    const mediaFile = files.find(
      (f) =>
        f.mimetype?.startsWith("image/") ||
        f.mimetype?.startsWith("video/") ||
        /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(
          f.originalname || "",
        ),
    );

    if (!mediaFile) {
      return res
        .status(400)
        .json({ error: "Media file (photo or video) is required for status" });
    }

    const isVideo =
      mediaFile.mimetype?.startsWith("video/") ||
      /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(mediaFile.originalname || "");
    const statusType = isVideo ? "video" : "image";

    const caption = req.body.caption || "";
    const song = await parseSongData(req);

    // Parse privacy settings
    let parsedPrivacy = {
      type: "contacts",
      excludedUsers: [],
      allowedUsers: [],
    };
    if (req.body.privacy) {
      try {
        parsedPrivacy =
          typeof req.body.privacy === "string"
            ? JSON.parse(req.body.privacy)
            : req.body.privacy;
      } catch (_e) {
        // ignore JSON parse error
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: isVideo ? "chatapp_status_videos" : "chatapp_status",
        resource_type: isVideo ? "video" : "image",
      },
      async (error, result) => {
        let mediaUrl = "";
        if (error || !result?.secure_url) {
          mediaUrl = `data:${mediaFile.mimetype || (isVideo ? "video/mp4" : "image/jpeg")};base64,${mediaFile.buffer.toString("base64")}`;
        } else {
          mediaUrl = result.secure_url;
        }

        const newStatus = new Status({
          userId,
          type: statusType,
          image: !isVideo ? mediaUrl : undefined,
          video: isVideo ? mediaUrl : undefined,
          mediaUrl,
          caption,
          song,
          privacy: parsedPrivacy,
          viewers: [],
        });
        await newStatus.save();
        await newStatus.populate("userId", "name avatar");

        return res.status(201).json(newStatus);
      },
    );
    uploadStream.end(mediaFile.buffer);
  } catch (error) {
    console.error("Error in uploadStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Create Text Status (PRD FR-05, AC-03)
 */
export const createTextStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, backgroundColor, fontFamily } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Status text cannot be empty" });
    }

    const song = await parseSongData(req);

    let parsedPrivacy = {
      type: "contacts",
      excludedUsers: [],
      allowedUsers: [],
    };
    if (req.body.privacy) {
      try {
        parsedPrivacy =
          typeof req.body.privacy === "string"
            ? JSON.parse(req.body.privacy)
            : req.body.privacy;
      } catch (_e) {
        // ignore JSON parse error
      }
    }

    const newStatus = new Status({
      userId,
      type: "text",
      text: text.trim(),
      backgroundColor: backgroundColor || "#075e54",
      fontFamily: fontFamily || "sans-serif",
      song,
      privacy: parsedPrivacy,
      viewers: [],
    });

    await newStatus.save();
    await newStatus.populate("userId", "name avatar");

    return res.status(201).json(newStatus);
  } catch (error) {
    console.error("Error in createTextStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mark Status as Viewed (PRD Section 12 & 21)
 */
export const viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user._id;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    // Don't add own user as viewer
    if (status.userId.toString() !== viewerId.toString()) {
      const alreadyViewed = status.viewers.some(
        (v) => v.userId.toString() === viewerId.toString(),
      );
      if (!alreadyViewed) {
        status.viewers.push({ userId: viewerId, viewedAt: new Date() });
        await status.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in viewStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get Visible Statuses (PRD FR-08, FR-11, AC-04)
 */
export const getStatuses = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const statuses = await Status.find({ createdAt: { $gt: oneDayAgo } })
      .populate("userId", "name avatar")
      .populate("viewers.userId", "name avatar")
      .sort({ createdAt: 1 });

    // Group statuses by user, enforcing server-side privacy rules
    const groupedStatuses = {};
    statuses.forEach((status) => {
      if (!status.userId) return;
      const ownerId = status.userId._id.toString();

      // Check privacy if not own status
      if (ownerId !== currentUserId) {
        const privacy = status.privacy || { type: "contacts" };
        if (privacy.type === "contacts_except") {
          const excluded = (privacy.excludedUsers || []).map((id) =>
            id.toString(),
          );
          if (excluded.includes(currentUserId)) return;
        } else if (privacy.type === "only_share_with") {
          const allowed = (privacy.allowedUsers || []).map((id) =>
            id.toString(),
          );
          if (!allowed.includes(currentUserId)) return;
        }
      }

      if (!groupedStatuses[ownerId]) {
        groupedStatuses[ownerId] = {
          user: status.userId,
          statuses: [],
        };
      }
      groupedStatuses[ownerId].statuses.push({
        _id: status._id,
        type: status.type || "image",
        image: status.image || (!status.video ? status.mediaUrl : undefined),
        video:
          status.video ||
          (status.type === "video" ? status.mediaUrl : undefined),
        mediaUrl: status.mediaUrl || status.image || status.video,
        caption: status.caption || "",
        text: status.text || "",
        backgroundColor: status.backgroundColor || "#075e54",
        fontFamily: status.fontFamily || "sans-serif",
        song: status.song || null,
        privacy: status.privacy || { type: "contacts" },
        viewers: status.viewers || [],
        createdAt: status.createdAt,
      });
    });

    const result = Object.values(groupedStatuses);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getStatuses:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findById(id);

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    if (status.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this status" });
    }

    await Status.deleteOne({ _id: id });
    res
      .status(200)
      .json({ message: "Status deleted successfully", deletedStatusId: id });
  } catch (error) {
    console.error("Error in deleteStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
