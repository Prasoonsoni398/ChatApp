import Status from "../models/status.model.js";
import { uploadWithExpiry } from "../utils/cloudinaryUpload.js";

/**
 * Helper to parse and upload song attachments for status
 */
const parseSongData = async (req) => {
  let song = {
    title: "",
    artist: "",
    audioUrl: "",
    startTime: 0,
    endTime: 0,
    volume: 1,
  };
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
  if (req.body.songStartTime !== undefined)
    song.startTime = Number(req.body.songStartTime) || 0;
  if (req.body.songEndTime !== undefined)
    song.endTime = Number(req.body.songEndTime) || 0;
  if (req.body.songVolume !== undefined)
    song.volume = Number(req.body.songVolume);

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
      const uploadAudioResult = await uploadWithExpiry(audioFile.buffer, {
        folder: "chatapp_status_songs",
        resource_type: "auto",
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

    // Video selection & trim settings
    let videoSelection = {
      startTime: Number(req.body.videoStart || req.body.videoStartTime || 0),
      endTime: Number(req.body.videoEnd || req.body.videoEndTime || 0),
      originalDuration: Number(req.body.videoOriginalDuration || 0),
      volume:
        req.body.videoVolume !== undefined ? Number(req.body.videoVolume) : 1,
    };
    if (req.body.videoSelection) {
      try {
        const parsed =
          typeof req.body.videoSelection === "string"
            ? JSON.parse(req.body.videoSelection)
            : req.body.videoSelection;
        videoSelection = { ...videoSelection, ...parsed };
      } catch (_e) {
        /* ignore parse error */
      }
    }

    const filter = req.body.filter || "none";
    let overlays = [];
    if (req.body.overlays) {
      try {
        overlays =
          typeof req.body.overlays === "string"
            ? JSON.parse(req.body.overlays)
            : req.body.overlays;
      } catch (_e) {
        /* ignore parse error */
      }
    }

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

    let uploadResult;
    try {
      uploadResult = await uploadWithExpiry(mediaFile.buffer, {
        folder: isVideo ? "chatapp_status_videos" : "chatapp_status",
        resource_type: isVideo ? "video" : "image",
      });
    } catch (_uploadErr) {
      uploadResult = null;
    }

    const mediaUrl = uploadResult?.secure_url
      ? uploadResult.secure_url
      : `data:${mediaFile.mimetype || (isVideo ? "video/mp4" : "image/jpeg")};base64,${mediaFile.buffer.toString("base64")}`;

    const newStatus = new Status({
      userId,
      type: statusType,
      image: !isVideo ? mediaUrl : undefined,
      video: isVideo ? mediaUrl : undefined,
      mediaUrl,
      caption,
      song,
      videoSelection: isVideo ? videoSelection : undefined,
      filter,
      overlays,
      privacy: parsedPrivacy,
      viewers: [],
    });
    await newStatus.save();
    await newStatus.populate("userId", "name avatar");

    const io = req.app.get("io");
    if (io) {
      io.emit("statusUpdated", {
        type: "create",
        userId: userId.toString(),
        statusId: newStatus._id,
      });
    }

    return res.status(201).json(newStatus);
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
    const { text, backgroundColor, fontFamily, textColor, bgPattern } =
      req.body;

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
      textColor: textColor || "#ffffff",
      bgPattern: bgPattern || "none",
      fontFamily: fontFamily || "sans-serif",
      song,
      privacy: parsedPrivacy,
      viewers: [],
    });

    await newStatus.save();
    await newStatus.populate("userId", "name avatar");

    const io = req.app.get("io");
    if (io) {
      io.emit("statusUpdated", {
        type: "create",
        userId: userId.toString(),
        statusId: newStatus._id,
      });
    }

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
        textColor: status.textColor || "#ffffff",
        bgPattern: status.bgPattern || "none",
        fontFamily: status.fontFamily || "sans-serif",
        song: status.song || null,
        videoSelection: status.videoSelection || null,
        filter: status.filter || "none",
        overlays: status.overlays || [],
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

    const io = req.app.get("io");
    if (io) {
      io.emit("statusUpdated", {
        type: "delete",
        userId: req.user._id.toString(),
        statusId: id,
      });
    }

    res
      .status(200)
      .json({ message: "Status deleted successfully", deletedStatusId: id });
  } catch (error) {
    console.error("Error in deleteStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
