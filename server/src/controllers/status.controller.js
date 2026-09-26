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
 * Upload Image Status
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

    const imageFile = files.find((f) => f.mimetype?.startsWith("image/"));

    if (!imageFile) {
      return res
        .status(400)
        .json({ error: "Image file is required for image status" });
    }

    const caption = req.body.caption || "";
    const song = await parseSongData(req);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "chatapp_status" },
      async (error, result) => {
        let imageUrl = "";
        if (error || !result?.secure_url) {
          // Fallback to base64 data URI if cloudinary fails
          imageUrl = `data:${imageFile.mimetype || "image/jpeg"};base64,${imageFile.buffer.toString("base64")}`;
        } else {
          imageUrl = result.secure_url;
        }

        const newStatus = new Status({
          userId,
          type: "image",
          image: imageUrl,
          caption,
          song,
          viewers: [],
        });
        await newStatus.save();
        await newStatus.populate("userId", "name avatar");

        return res.status(201).json(newStatus);
      },
    );
    uploadStream.end(imageFile.buffer);
  } catch (error) {
    console.error("Error in uploadStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Create Text Status (PRD Section 50.1 & 50.2)
 */
export const createTextStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, backgroundColor, fontFamily } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Status text cannot be empty" });
    }

    const song = await parseSongData(req);

    const newStatus = new Status({
      userId,
      type: "text",
      text: text.trim(),
      backgroundColor: backgroundColor || "#075e54",
      fontFamily: fontFamily || "sans-serif",
      song,
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
 * Mark Status as Viewed (PRD Section 53)
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

export const getStatuses = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const statuses = await Status.find({ createdAt: { $gt: oneDayAgo } })
      .populate("userId", "name avatar")
      .populate("viewers.userId", "name avatar")
      .sort({ createdAt: 1 });

    // Group statuses by user
    const groupedStatuses = {};
    statuses.forEach((status) => {
      if (!status.userId) return;
      const uId = status.userId._id.toString();
      if (!groupedStatuses[uId]) {
        groupedStatuses[uId] = {
          user: status.userId,
          statuses: [],
        };
      }
      groupedStatuses[uId].statuses.push({
        _id: status._id,
        type: status.type || "image",
        image: status.image,
        caption: status.caption || "",
        text: status.text || "",
        backgroundColor: status.backgroundColor || "#075e54",
        fontFamily: status.fontFamily || "sans-serif",
        song: status.song || null,
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
