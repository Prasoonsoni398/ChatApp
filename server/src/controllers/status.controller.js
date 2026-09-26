import Status from "../models/status.model.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Upload Image Status
 * PRD Section 1.3 & 147 EXCLUSION:
 * Videos are strictly forbidden for status.
 */
export const uploadStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Image file is required for image status" });
    }

    // STRICT PRD ENFORCEMENT: Reject any video file immediately
    if (req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({
        error:
          "Video Status is explicitly excluded per platform policy. Only images and text are supported for Status.",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res
        .status(400)
        .json({ error: "Only image files are allowed for status" });
    }

    const caption = req.body.caption || "";

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "chatapp_status" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Image upload failed" });
        }
        const newStatus = new Status({
          userId,
          type: "image",
          image: result.secure_url,
          caption,
          viewers: [],
        });
        await newStatus.save();
        await newStatus.populate("userId", "name avatar");

        return res.status(201).json(newStatus);
      },
    );
    uploadStream.end(req.file.buffer);
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

    const newStatus = new Status({
      userId,
      type: "text",
      text: text.trim(),
      backgroundColor: backgroundColor || "#075e54",
      fontFamily: fontFamily || "sans-serif",
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
