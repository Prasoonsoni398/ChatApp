import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

export const viewOnceMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.isViewOnce) {
      return res.status(400).json({ error: "Not a view-once message" });
    }

    if (!message.viewedBy.some((v) => v.toString() === userId.toString())) {
      message.viewedBy.push(userId);
      await message.save();
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error in viewOnceMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to edit this message" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'me' or 'everyone'
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (type === "everyone") {
      if (message.senderId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this message for everyone" });
      }
      message.isDeletedForEveryone = true;
      message.text = "";
      message.image = "";
      message.mediaUrl = "";
      await message.save();
    } else {
      // Delete for me
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.status(200).json({
      message: "Message deleted successfully",
      deletedMessage: message,
    });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.status(200).json({ isPinned: message.isPinned, data: message });
  } catch (error) {
    console.error("Error in pinMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PRD Section 22: Starred Messages
export const toggleStarMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const index = message.starredBy.findIndex(
      (uid) => uid.toString() === userId.toString(),
    );

    let isStarred = false;
    if (index === -1) {
      message.starredBy.push(userId);
      isStarred = true;
    } else {
      message.starredBy.splice(index, 1);
      isStarred = false;
    }

    await message.save();
    res.status(200).json({ isStarred, messageId: id, starredBy: message.starredBy });
  } catch (error) {
    console.error("Error in toggleStarMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const starredMessages = await Message.find({ starredBy: userId })
      .populate("senderId", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(starredMessages);
  } catch (error) {
    console.error("Error in getStarredMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString(),
    );

    if (existingIndex !== -1) {
      const isSameEmoji = message.reactions[existingIndex].emoji === emoji;
      message.reactions.splice(existingIndex, 1);
      if (!isSameEmoji) {
        message.reactions.push({ emoji, userId });
      }
    } else {
      message.reactions.push({ emoji, userId });
    }

    await message.save();
    res.status(200).json(message.reactions);
  } catch (error) {
    console.error("Error in addReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { groupId: chatId },
        { senderId: myId, receiverId: chatId },
        { senderId: chatId, receiverId: myId },
      ],
    });

    const bulkOps = messages
      .map((msg) => {
        if (!msg.deletedFor.includes(myId)) {
          return {
            updateOne: {
              filter: { _id: msg._id },
              update: { $push: { deletedFor: myId } },
            },
          };
        }
        return null;
      })
      .filter((op) => op !== null);

    if (bulkOps.length > 0) {
      await Message.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.error("Error in clearChat:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Global Search Messages & Media ── */
export const searchMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q, type } = req.query;

    if (!q && !type) {
      return res.status(200).json([]);
    }

    // Get group IDs user is a member of
    const userGroups = await Group.find({ members: myId }).select("_id");
    const groupIds = userGroups.map((g) => g._id);

    const filter = {
      $and: [
        {
          $or: [
            { senderId: myId },
            { receiverId: myId },
            { groupId: { $in: groupIds } },
          ],
        },
        { deletedFor: { $ne: myId } },
      ],
    };

    if (type && type !== "all") {
      const lowerType = type.toLowerCase();
      if (lowerType === "photos" || lowerType === "image" || lowerType === "images") {
        filter.$and.push({ mediaType: "image" });
      } else if (lowerType === "videos" || lowerType === "video") {
        filter.$and.push({ mediaType: "video" });
      } else if (lowerType === "documents" || lowerType === "document" || lowerType === "docs") {
        filter.$and.push({ mediaType: "document" });
      } else if (lowerType === "audio" || lowerType === "voice") {
        filter.$and.push({ mediaType: { $in: ["audio", "voice"] } });
      } else if (lowerType === "polls" || lowerType === "poll") {
        filter.$and.push({ mediaType: "poll" });
      } else if (lowerType === "contacts" || lowerType === "contact") {
        filter.$and.push({ mediaType: "contact" });
      } else if (lowerType === "location" || lowerType === "locations") {
        filter.$and.push({ mediaType: "location" });
      } else if (lowerType === "links" || lowerType === "link") {
        filter.$and.push({ text: { $regex: "https?://", $options: "i" } });
      }
    }

    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const textRegex = new RegExp(escaped, "i");
      filter.$and.push({
        $or: [
          { text: textRegex },
          { fileName: textRegex },
          { "poll.question": textRegex },
          { "contactCard.name": textRegex },
          { "location.name": textRegex },
        ],
      });
    }

    const messages = await Message.find(filter)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar")
      .populate("groupId", "name avatar")
      .sort({ createdAt: -1 })
      .limit(60);

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in searchMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Clear All Chats ── */
export const clearAllChats = async (req, res) => {
  try {
    const myId = req.user._id;
    const userGroups = await Group.find({ members: myId }).select("_id");
    const groupIds = userGroups.map((g) => g._id);

    await Message.updateMany(
      {
        $or: [
          { senderId: myId },
          { receiverId: myId },
          { groupId: { $in: groupIds } },
        ],
      },
      {
        $addToSet: { deletedFor: myId },
      }
    );

    res.status(200).json({ message: "All chats cleared successfully" });
  } catch (error) {
    console.error("Error in clearAllChats:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Storage Management (PRD Section 81 & 82) ── */
export const getStorageUsage = async (req, res) => {
  try {
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
      mediaUrl: { $ne: "" },
      deletedFor: { $ne: myId },
    }).select("mediaType mediaUrl fileSize createdAt text");

    let totalBytes = 0;
    const categoryBreakdown = {
      photos: { count: 0, sizeBytes: 0 },
      videos: { count: 0, sizeBytes: 0 },
      audio: { count: 0, sizeBytes: 0 },
      documents: { count: 0, sizeBytes: 0 },
      other: { count: 0, sizeBytes: 0 },
    };

    const largeFiles = [];

    messages.forEach((msg) => {
      const size = msg.fileSize || 1024 * 50; // estimate 50KB if not stored
      totalBytes += size;

      if (msg.mediaType === "image") {
        categoryBreakdown.photos.count += 1;
        categoryBreakdown.photos.sizeBytes += size;
      } else if (msg.mediaType === "video") {
        categoryBreakdown.videos.count += 1;
        categoryBreakdown.videos.sizeBytes += size;
      } else if (["voice", "audio"].includes(msg.mediaType)) {
        categoryBreakdown.audio.count += 1;
        categoryBreakdown.audio.sizeBytes += size;
      } else if (["document", "pdf"].includes(msg.mediaType)) {
        categoryBreakdown.documents.count += 1;
        categoryBreakdown.documents.sizeBytes += size;
      } else {
        categoryBreakdown.other.count += 1;
        categoryBreakdown.other.sizeBytes += size;
      }

      if (size > 1024 * 100) {
        largeFiles.push({
          id: msg._id,
          mediaType: msg.mediaType,
          mediaUrl: msg.mediaUrl,
          fileSize: size,
          createdAt: msg.createdAt,
          caption: msg.text || "",
        });
      }
    });

    largeFiles.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));

    res.status(200).json({
      totalBytes,
      totalFormatted: (totalBytes / (1024 * 1024)).toFixed(2) + " MB",
      categoryBreakdown,
      largeFiles: largeFiles.slice(0, 20),
    });
  } catch (error) {
    console.error("Error in getStorageUsage:", error.message);
    res.status(500).json({ error: "Failed to retrieve storage usage" });
  }
};
