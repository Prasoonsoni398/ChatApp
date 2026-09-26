import mongoose from "mongoose";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

/* ── Create a new group ── */
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !memberIds) {
      return res.status(400).json({ error: "Name and members are required" });
    }

    const parsedMembers = JSON.parse(memberIds);
    const uniqueMembers = [...new Set([adminId.toString(), ...parsedMembers])];

    let avatarUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "chatapp_groups" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(req.file.buffer);
      });
      avatarUrl = result.secure_url;
    }

    const memberDetails = uniqueMembers.map((uid) => ({
      user: uid,
      addedBy: uid.toString() === adminId.toString() ? null : adminId,
      joinedAt: new Date(),
    }));

    const group = new Group({
      name,
      description: description || "",
      members: uniqueMembers,
      memberDetails,
      admin: adminId,
      admins: [adminId],
      avatar: avatarUrl,
    });

    await group.save();

    const populated = await Group.findById(group._id)
      .populate("members", "name avatar phone about _id")
      .populate("admin", "name avatar phone _id")
      .populate("admins", "name avatar _id")
      .populate("memberDetails.user", "name avatar phone about _id")
      .populate("memberDetails.addedBy", "name _id");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Get all groups for the logged-in user ── */
export const getGroups = async (req, res) => {
  try {
    const myId = req.user._id;
    const groups = await Group.find({ members: myId })
      .populate("members", "name avatar phone about _id")
      .populate("admin", "name avatar phone _id")
      .populate("admins", "name avatar _id")
      .populate("memberDetails.user", "name avatar phone about _id")
      .populate("memberDetails.addedBy", "name _id")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Get single group full details ── */
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const group = await Group.findById(groupId)
      .populate("members", "name avatar phone about _id")
      .populate("admin", "name avatar phone _id")
      .populate("admins", "name avatar _id")
      .populate("memberDetails.user", "name avatar phone about _id")
      .populate("memberDetails.addedBy", "name _id");

    if (!group) return res.status(404).json({ error: "Group not found" });

    // Count media in this group
    const mediaCount = await Message.countDocuments({
      groupId,
      mediaType: { $in: ["image", "video", "document", "voice", "audio"] },
    });

    res.status(200).json({ ...group.toObject(), mediaCount });
  } catch (error) {
    console.error("Error in getGroupDetails:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Add members to group ── */
export const addMembersToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Check membership
    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const newIds = (memberIds || []).filter(
      (id) => !group.members.some((m) => m.toString() === id.toString()),
    );

    newIds.forEach((id) => {
      group.members.push(id);
      if (!group.memberDetails) group.memberDetails = [];
      group.memberDetails.push({
        user: id,
        addedBy: myId,
        joinedAt: new Date(),
      });
    });

    await group.save();

    const populated = await Group.findById(groupId)
      .populate("members", "name avatar phone about _id")
      .populate("admin", "name avatar phone _id")
      .populate("admins", "name avatar _id")
      .populate("memberDetails.user", "name avatar phone about _id")
      .populate("memberDetails.addedBy", "name _id");

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in addMembersToGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Get messages for a group ── */
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({ groupId, deletedFor: { $ne: myId } })
      .populate("senderId", "name avatar _id")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Send a message to a group ── */
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, replyToId, replyToText, replyToSender } = req.body;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.map((m) => m.toString()).includes(senderId.toString())) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    if (group.onlyAdminsCanMessage) {
      const isAdmin =
        (group.admin?._id || group.admin)?.toString() === senderId.toString() ||
        (group.admins || []).some((a) => (a._id || a)?.toString() === senderId.toString());
      if (!isAdmin) {
        return res.status(403).json({ error: "Only admins can send messages to this announcement group" });
      }
    }

    let mediaUrl = "";
    let mediaType = "text";
    let fileName = "";
    let fileSize = 0;
    const isVoice = req.body.isVoice === "true" || req.body.isVoice === true;
    const duration = Number(req.body.duration) || 0;

    if (req.file) {
      const mimetype = req.file.mimetype || "";
      if (isVoice) {
        mediaType = "voice";
      } else if (mimetype.startsWith("image/")) {
        mediaType = "image";
      } else if (mimetype.startsWith("video/")) {
        mediaType = "video";
      } else if (mimetype.startsWith("audio/")) {
        mediaType = "audio";
      } else {
        mediaType = "document";
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "chatapp_messages", resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(req.file.buffer);
      });
      mediaUrl = result.secure_url;
      fileName = req.file.originalname || "attachment";
      fileSize = req.file.size || 0;
    }

    let parsedLocation = null;
    if (req.body.location) {
      try {
        parsedLocation = typeof req.body.location === "string" ? JSON.parse(req.body.location) : req.body.location;
      } catch (_e) {}
    }
    let parsedContact = null;
    if (req.body.contactCard) {
      try {
        parsedContact = typeof req.body.contactCard === "string" ? JSON.parse(req.body.contactCard) : req.body.contactCard;
      } catch (_e) {}
    }
    if (req.body.mediaType === "location" || parsedLocation) mediaType = "location";
    else if (req.body.mediaType === "contact" || parsedContact) mediaType = "contact";

    const newMessage = new Message({
      senderId,
      receiverId: senderId, // placeholder, groupId takes priority
      groupId,
      text: text || "",
      image: mediaUrl || undefined,
      mediaType,
      mediaUrl,
      fileName,
      fileSize,
      duration,
      location: parsedLocation,
      contactCard: parsedContact,
      replyTo: replyToId || null,
      replyToText: replyToText || null,
      replyToSender: replyToSender || null,
    });

    await newMessage.save();

    const populated = await Message.findById(newMessage._id).populate(
      "senderId",
      "name avatar _id",
    );

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Leave a group ── */
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    group.members = group.members.filter(
      (m) => m.toString() !== myId.toString(),
    );

    if (group.memberDetails) {
      group.memberDetails = group.memberDetails.filter(
        (md) => md.user?.toString() !== myId.toString(),
      );
    }

    // If admin leaves, transfer admin to next member
    if (
      group.admin.toString() === myId.toString() &&
      group.members.length > 0
    ) {
      group.admin = group.members[0];
    }

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res
        .status(200)
        .json({ message: "Group deleted (no members left)" });
    }

    await group.save();
    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Group Invite Links (PRD Section 44) ── */
export const getGroupInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    if (!group.inviteCode) {
      group.inviteCode = crypto.randomBytes(6).toString("hex");
      await group.save();
    }

    res.status(200).json({ inviteCode: group.inviteCode });
  } catch (error) {
    console.error("Error in getGroupInviteLink:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetGroupInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isAdmin =
      group.admin.toString() === req.user._id.toString() ||
      group.admins?.some((a) => a.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can reset invite link" });
    }

    group.inviteCode = crypto.randomBytes(6).toString("hex");
    await group.save();

    res.status(200).json({ inviteCode: group.inviteCode });
  } catch (error) {
    console.error("Error in resetGroupInviteLink:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode }).populate("admin", "name avatar");
    if (!group) return res.status(404).json({ error: "Invalid or expired invite link" });

    res.status(200).json({
      _id: group._id,
      name: group.name,
      avatar: group.avatar,
      description: group.description,
      memberCount: group.members.length,
      admin: group.admin,
      inviteCode: group.inviteCode,
    });
  } catch (error) {
    console.error("Error in getGroupByInviteCode:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroupByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const myId = req.user._id;

    const group = await Group.findOne({ inviteCode });
    if (!group) return res.status(404).json({ error: "Invalid or expired invite link" });

    if (!group.members.some((m) => m.toString() === myId.toString())) {
      group.members.push(myId);
      await group.save();
    }

    const populated = await Group.findById(group._id)
      .populate("members", "name email avatar")
      .populate("admin", "name email avatar");

    res.status(200).json({ success: true, group: populated });
  } catch (error) {
    console.error("Error in joinGroupByInviteCode:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
