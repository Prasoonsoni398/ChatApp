import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../config/cloudinary.js";

/**
 * GET /api/users  — returns only the logged-in user's contacts and active chat partners.
 * Requires auth (protect middleware).
 */
export const getUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const me = await User.findById(myId).populate(
      "contacts",
      "name email phone avatar online",
    );
    if (!me) return res.status(404).json({ message: "User not found" });

    // Also include any users who have exchanged direct messages with me
    const [sentTo, receivedFrom] = await Promise.all([
      Message.distinct("receiverId", {
        senderId: myId,
        receiverId: { $ne: null, $exists: true },
        deletedFor: { $ne: myId },
      }),
      Message.distinct("senderId", {
        receiverId: myId,
        senderId: { $ne: null, $exists: true },
        deletedFor: { $ne: myId },
      }),
    ]);

    const contactIds = (me.contacts || [])
      .filter((c) => c && c._id)
      .map((c) => c._id.toString());

    const messageUserIds = [...sentTo, ...receivedFrom]
      .filter((id) => id && id.toString() !== myId.toString())
      .map((id) => id.toString());

    const uniqueIds = [...new Set([...contactIds, ...messageUserIds])];

    const allChatUsers = await User.find({
      _id: { $in: uniqueIds },
    }).select("name email phone avatar online about privacySettings");

    // Build nickname map
    const nicknameMap = new Map();
    if (me.contactNicknames && Array.isArray(me.contactNicknames)) {
      me.contactNicknames.forEach((cn) => {
        if (cn && cn.userId)
          nicknameMap.set(cn.userId.toString(), cn.customName);
      });
    }

    const usersWithDisplayNames = (allChatUsers || []).map((u) => {
      const uObj = u.toObject ? u.toObject() : { ...u };
      const custom = nicknameMap.get(uObj._id.toString());
      if (custom) {
        uObj.customName = custom;
        uObj.displayName = custom;
      } else {
        uObj.displayName = uObj.name;
      }
      return uObj;
    });

    res.status(200).json(usersWithDisplayNames);
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
};

/**
 * GET /api/users/profile/:userId — returns full profile details of a user,
 * common groups, and media exchange count.
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId).select(
      "name email phone avatar about online privacySettings createdAt",
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find common groups
    const commonGroups = await Group.find({
      members: { $all: [myId, userId] },
    }).select("name avatar members admin");

    // Count media exchanged between these two users
    const mediaCount = await Message.countDocuments({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
      mediaType: { $in: ["image", "video", "document", "voice", "audio"] },
      deletedFor: { $ne: myId },
    });

    // Look up custom nickname saved by current user
    const me = await User.findById(myId).select("contactNicknames");
    let customName = null;
    if (me?.contactNicknames && Array.isArray(me.contactNicknames)) {
      const match = me.contactNicknames.find(
        (cn) => cn && cn.userId && cn.userId.toString() === userId.toString(),
      );
      if (match) customName = match.customName;
    }

    res.status(200).json({
      ...user.toObject(),
      customName: customName || undefined,
      displayName: customName || user.name,
      commonGroups,
      mediaCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/users/all  — public list of all verified users (used for group member search).
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true }).select(
      "name email phone avatar",
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.about !== undefined) user.about = req.body.about;

      if (req.file) {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "chatapp_avatars" },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return res.status(500).json({ message: "Image upload failed" });
            }
            user.avatar = result.secure_url;
            const updatedUser = await user.save();
            res.json({
              _id: updatedUser._id,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              avatar: updatedUser.avatar,
              about: updatedUser.about,
              privacySettings: updatedUser.privacySettings,
            });
          },
        );
        uploadStream.end(req.file.buffer);
      } else {
        const updatedUser = await user.save();
        res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          about: updatedUser.about,
          privacySettings: updatedUser.privacySettings,
        });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.privacySettings = {
      ...(user.privacySettings || {}),
      ...req.body,
    };

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      privacySettings: updatedUser.privacySettings,
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (userId.toString() === myId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.blockedUsers = user.blockedUsers || [];
    const isBlocked = user.blockedUsers.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      user.blockedUsers.push(userId);
    }

    await user.save();
    res.status(200).json({
      success: true,
      isBlocked: !isBlocked,
      blockedUsers: user.blockedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "name email avatar",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Linked Devices (PRD Section 70-72) ── */
export const getLinkedDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("linkedDevices");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.linkedDevices || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const linkDevice = async (req, res) => {
  try {
    const { deviceId, deviceName, browser, os } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.linkedDevices = user.linkedDevices || [];
    const newDevice = {
      deviceId:
        deviceId ||
        `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      deviceName: deviceName || "Web Client",
      browser: browser || "Chrome",
      os: os || "Windows",
      lastActive: new Date(),
    };

    user.linkedDevices.push(newDevice);
    await user.save();

    res.status(201).json(user.linkedDevices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlinkDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.linkedDevices = (user.linkedDevices || []).filter(
      (d) => d.deviceId !== deviceId && d._id?.toString() !== deviceId,
    );
    await user.save();

    res.status(200).json({ success: true, linkedDevices: user.linkedDevices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Data Export (PRD Section 105) ── */
export const exportAccountData = async (req, res) => {
  try {
    const myId = req.user._id;
    const user = await User.findById(myId)
      .select("-password -otp -otpExpires")
      .populate("contacts", "name email phone avatar about");

    if (!user) return res.status(404).json({ message: "User not found" });

    const groups = await Group.find({ members: myId }).select(
      "name description avatar admin members createdAt",
    );

    const messageCount = await Message.countDocuments({
      $or: [{ senderId: myId }, { receiverId: myId }],
      deletedFor: { $ne: myId },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      account: user,
      groupsJoinedCount: groups.length,
      groups: groups.map((g) => ({
        id: g._id,
        name: g.name,
        role: g.admin?.toString() === myId.toString() ? "Admin" : "Member",
        createdAt: g.createdAt,
      })),
      totalMessagesExchanged: messageCount,
    };

    res.status(200).json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Account Deletion (PRD Section 104) ── */
export const deleteAccount = async (req, res) => {
  try {
    const myId = req.user._id;
    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Remove user from all groups
    await Group.updateMany(
      { members: myId },
      {
        $pull: {
          members: myId,
          admins: myId,
          memberDetails: { user: myId },
        },
      },
    );

    // 2. Remove user from other users' contacts
    await User.updateMany({ contacts: myId }, { $pull: { contacts: myId } });

    // 3. Mark direct messages as deleted
    await Message.updateMany(
      { $or: [{ senderId: myId }, { receiverId: myId }] },
      { $addToSet: { deletedFor: myId } },
    );

    // 4. Delete user record
    await User.findByIdAndDelete(myId);

    res
      .status(200)
      .json({ message: "Account and associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
