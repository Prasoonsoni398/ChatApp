import Channel from "../models/channel.model.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Create a new broadcast Channel.
 */
export const createChannel = async (req, res) => {
  try {
    let { name, description, avatar } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "chatapp_channels", resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          stream.end(req.file.buffer);
        });
        avatar = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn("Avatar upload fallback to data URI:", uploadErr.message);
        avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    const channel = new Channel({
      name: name.trim(),
      description: description || "",
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name.trim())}`,
      owner: userId,
      followers: [userId],
    });

    await channel.save();
    const populated = await Channel.findById(channel._id).populate(
      "owner",
      "name avatar",
    );

    const formatted = {
      ...populated.toObject(),
      followerCount: 1,
      followersCount: 1,
      isFollowing: true,
      isOwner: true,
    };

    const io = req.app.get("io");
    if (io) io.emit("channelCreated", formatted);

    res.status(201).json(formatted);
  } catch (error) {
    console.error("Error in createChannel:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all broadcast Channels with follower status and optional search.
 */
export const getChannels = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    let filter = {};
    if (search && search.trim()) {
      filter = {
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
        ],
      };
    }

    let channels = await Channel.find(filter)
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });

    // Seed default channels if completely empty and no search filter
    if (channels.length === 0 && !search) {
      const seeded = await Channel.create([
        {
          name: "Guftgu Official",
          description: "News, updates, and product tips from the Guftgu team.",
          avatar:
            "https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png",
          owner: userId,
          verified: true,
          followers: [userId],
          posts: [
            {
              text: "Welcome to Guftgu Channels! Follow channels of your favorite creators, sports teams, and news organizations.",
              createdAt: new Date(),
              reactions: [{ emoji: "💚", userIds: [userId] }],
            },
          ],
        },
        {
          name: "Tech Pulse",
          description:
            "Daily technology breakthroughs, AI updates, and developer insights.",
          avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=TechPulse",
          owner: userId,
          verified: true,
          followers: [],
          posts: [
            {
              text: "WebRTC and WebSocket optimizations bring sub-100ms real-time latency across modern web clients.",
              createdAt: new Date(),
              reactions: [{ emoji: "🚀", userIds: [] }],
            },
          ],
        },
      ]);
      channels = seeded;
    }

    const formatted = channels.map((c) => {
      const obj = c.toObject();
      const ownerId = (c.owner?._id || c.owner)?.toString();
      return {
        ...obj,
        followerCount: c.followers?.length || 0,
        isFollowing: c.followers?.some(
          (f) => f.toString() === userId.toString(),
        ),
        isOwner: ownerId === userId.toString(),
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error in getChannels:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get single Channel by ID.
 */
export const getChannelById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(id).populate("owner", "name avatar");
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const ownerId = (channel.owner?._id || channel.owner)?.toString();
    const formatted = {
      ...channel.toObject(),
      followerCount: channel.followers?.length || 0,
      isFollowing: channel.followers?.some(
        (f) => f.toString() === userId.toString(),
      ),
      isOwner: ownerId === userId.toString(),
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error in getChannelById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Toggle follow/unfollow for a Channel.
 */
export const toggleFollowChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(id);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const idx = channel.followers.findIndex(
      (f) => f.toString() === userId.toString(),
    );
    let isFollowing = false;
    if (idx === -1) {
      channel.followers.push(userId);
      isFollowing = true;
    } else {
      channel.followers.splice(idx, 1);
      isFollowing = false;
    }

    await channel.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("channelFollowUpdated", {
        channelId: id,
        followerCount: channel.followers.length,
      });
    }

    res.status(200).json({
      isFollowing,
      followerCount: channel.followers.length,
      followersCount: channel.followers.length,
      channelId: id,
    });
  } catch (error) {
    console.error("Error in toggleFollowChannel:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Post an announcement broadcast to a Channel (channel owner only).
 */
export const postToChannel = async (req, res) => {
  try {
    const { id } = req.params;
    let { text, mediaUrl, mediaType } = req.body || {};
    const userId = req.user._id;

    const channel = await Channel.findById(id).populate("owner", "name avatar");
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const ownerId = (channel.owner?._id || channel.owner)?.toString();
    if (ownerId !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the channel owner can post updates" });
    }

    let fileName = "";
    if (req.file) {
      const mime = req.file.mimetype || "";
      if (mime.startsWith("image/")) {
        mediaType = "image";
      } else if (mime.startsWith("video/")) {
        mediaType = "video";
      } else if (mime.startsWith("audio/")) {
        mediaType = "audio";
      } else {
        mediaType = "document";
      }

      if (
        (mediaType === "audio" || mediaType === "video") &&
        req.file.size > 5 * 1024 * 1024
      ) {
        return res.status(400).json({
          error: "Audio and video uploads are restricted to a maximum of 5MB.",
        });
      }

      fileName = req.file.originalname || "attachment";

      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "chatapp_channels", resource_type: "auto" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          stream.end(req.file.buffer);
        });
        mediaUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn(
          "Cloudinary upload failed, using data URI fallback:",
          uploadErr.message,
        );
        mediaUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    if (!text?.trim() && !mediaUrl) {
      return res
        .status(400)
        .json({ error: "Post message or media attachment is required" });
    }

    const newPost = {
      text: (text || "").trim(),
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "text",
      fileName: fileName || "",
      createdAt: new Date(),
      reactions: [],
    };

    channel.posts.unshift(newPost);
    await channel.save();

    const createdPost = channel.posts[0];

    const io = req.app.get("io");
    if (io) {
      io.emit("channelPost", {
        channelId: id,
        post: createdPost,
      });
    }

    const formatted = {
      ...channel.toObject(),
      followerCount: channel.followers?.length || 0,
      followersCount: channel.followers?.length || 0,
      isFollowing: channel.followers?.some(
        (f) => f.toString() === userId.toString(),
      ),
      isOwner: true,
    };

    res.status(201).json({
      post: createdPost,
      channel: formatted,
      ...formatted,
    });
  } catch (error) {
    console.error("Error in postToChannel:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * React to a channel post with emoji.
 */
export const reactToChannelPost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ error: "Emoji is required" });

    const channel = await Channel.findById(id);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const post = channel.posts.id(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check if user has an existing reaction on any emoji in this post
    let existingEmoji = null;
    for (const r of post.reactions) {
      if (r.userIds?.some((u) => u.toString() === userId.toString())) {
        existingEmoji = r.emoji;
        break;
      }
    }

    // Remove user from all reaction groups first
    post.reactions.forEach((r) => {
      r.userIds = r.userIds.filter((u) => u.toString() !== userId.toString());
    });

    // If user clicked a different emoji, add their reaction
    if (existingEmoji !== emoji) {
      let reactionGroup = post.reactions.find((r) => r.emoji === emoji);
      if (!reactionGroup) {
        post.reactions.push({ emoji, userIds: [userId] });
      } else {
        reactionGroup.userIds.push(userId);
      }
    }

    // Clean up empty reaction groups
    post.reactions = post.reactions.filter(
      (r) => r.userIds && r.userIds.length > 0,
    );

    await channel.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("channelPostReaction", {
        channelId: id,
        postId,
        reactions: post.reactions,
      });
    }

    res.status(200).json({ reactions: post.reactions });
  } catch (error) {
    console.error("Error in reactToChannelPost:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a post from a Channel (owner only).
 */
export const deleteChannelPost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(id);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const ownerId = (channel.owner?._id || channel.owner)?.toString();
    if (ownerId !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the channel owner can delete posts" });
    }

    channel.posts = channel.posts.filter(
      (p) => p._id.toString() !== postId.toString(),
    );
    await channel.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("channelPostDeleted", {
        channelId: id,
        postId,
      });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deleteChannelPost:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a Channel (owner only).
 */
export const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(id);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const ownerId = (channel.owner?._id || channel.owner)?.toString();
    if (ownerId !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the channel owner can delete this channel" });
    }

    await Channel.findByIdAndDelete(id);

    const io = req.app.get("io");
    if (io) {
      io.emit("channelDeleted", { channelId: id });
    }

    res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.error("Error in deleteChannel:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
