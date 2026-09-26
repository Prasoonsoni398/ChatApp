import Community from "../models/community.model.js";
import Group from "../models/group.model.js";

/**
 * Create a new Community with automatic Announcement Group provisioning.
 */
export const createCommunity = async (req, res) => {
  try {
    const { name, description, avatar, groupIds } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Community name is required" });
    }

    // Collect all unique members from linked groups
    let allMembers = [adminId];
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      const groups = await Group.find({ _id: { $in: groupIds } });
      groups.forEach((g) => {
        if (Array.isArray(g.members)) {
          g.members.forEach((m) => {
            const mId = m.toString();
            if (!allMembers.some((x) => x.toString() === mId)) {
              allMembers.push(m);
            }
          });
        }
      });
    }

    const commAvatar =
      avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name.trim()}`;

    // Auto-provision official Announcement Group for this Community
    const announcementGroup = new Group({
      name: `${name.trim()} Announcements`,
      description: `Official announcements for ${name.trim()} community`,
      avatar: commAvatar,
      admin: adminId,
      admins: [adminId],
      members: allMembers,
      onlyAdminsCanMessage: true,
      isCommunityAnnouncement: true,
    });
    await announcementGroup.save();

    const newCommunity = new Community({
      name: name.trim(),
      description: description || "",
      avatar: commAvatar,
      admin: adminId,
      admins: [adminId],
      members: allMembers,
      groups: Array.isArray(groupIds) ? groupIds : [],
      announcementGroup: announcementGroup._id,
    });

    await newCommunity.save();

    // Mark announcementGroup and linked groups with communityId
    announcementGroup.communityId = newCommunity._id;
    await announcementGroup.save();

    if (Array.isArray(groupIds) && groupIds.length > 0) {
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { communityId: newCommunity._id },
      );
    }

    const populated = await Community.findById(newCommunity._id)
      .populate("admin", "name avatar")
      .populate("announcementGroup", "name avatar members onlyAdminsCanMessage")
      .populate("groups", "name avatar members");

    // Real-time broadcast to connected users
    const io = req.app.get("io");
    if (io) {
      io.emit("communityCreated", populated);
      io.emit("newGroup", announcementGroup);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createCommunity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all Communities the user belongs to (as admin, member, or group participant).
 */
export const getCommunities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userGroups = await Group.find({ members: userId }).select("_id");
    const userGroupIds = userGroups.map((g) => g._id);

    const communities = await Community.find({
      $or: [
        { members: userId },
        { admin: userId },
        { admins: userId },
        { groups: { $in: userGroupIds } },
      ],
    })
      .populate("admin", "name avatar")
      .populate("announcementGroup", "name avatar members onlyAdminsCanMessage")
      .populate("groups", "name avatar members")
      .sort({ updatedAt: -1 });

    // Ensure all communities have an announcement group provisioned
    for (const comm of communities) {
      if (!comm.announcementGroup) {
        try {
          const annGroup = new Group({
            name: `${comm.name} Announcements`,
            description: `Official announcements for ${comm.name}`,
            avatar: comm.avatar,
            admin: comm.admin._id || comm.admin,
            admins: comm.admins.length > 0 ? comm.admins : [comm.admin._id || comm.admin],
            members: comm.members,
            onlyAdminsCanMessage: true,
            isCommunityAnnouncement: true,
            communityId: comm._id,
          });
          await annGroup.save();
          comm.announcementGroup = annGroup;
          await Community.findByIdAndUpdate(comm._id, {
            announcementGroup: annGroup._id,
          });
        } catch (_err) {
          console.error("Error auto-provisioning announcement group:", _err.message);
        }
      }
    }

    res.status(200).json(communities);
  } catch (error) {
    console.error("Error in getCommunities:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get single Community by ID.
 */
export const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id)
      .populate("admin", "name avatar")
      .populate("announcementGroup", "name avatar members onlyAdminsCanMessage")
      .populate("groups", "name avatar members");

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    res.status(200).json(community);
  } catch (error) {
    console.error("Error in getCommunityById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Add topic groups to a Community and sync member lists.
 */
export const addGroupsToCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupIds } = req.body;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (
      community.admin.toString() !== userId.toString() &&
      !community.admins.some((a) => a.toString() === userId.toString())
    ) {
      return res.status(403).json({ error: "Only admins can add groups to this community" });
    }

    if (Array.isArray(groupIds) && groupIds.length > 0) {
      groupIds.forEach((gid) => {
        if (!community.groups.some((g) => g.toString() === gid.toString())) {
          community.groups.push(gid);
        }
      });

      const newGroups = await Group.find({ _id: { $in: groupIds } });
      newGroups.forEach((g) => {
        if (Array.isArray(g.members)) {
          g.members.forEach((m) => {
            const mId = m.toString();
            if (!community.members.some((x) => x.toString() === mId)) {
              community.members.push(m);
            }
          });
        }
      });

      // Update groups with communityId
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { communityId: community._id },
      );

      // Also update announcementGroup members
      if (community.announcementGroup) {
        await Group.findByIdAndUpdate(community.announcementGroup, {
          members: community.members,
        });
      }
    }

    await community.save();
    const populated = await Community.findById(id)
      .populate("admin", "name avatar")
      .populate("announcementGroup", "name avatar members onlyAdminsCanMessage")
      .populate("groups", "name avatar members");

    const io = req.app.get("io");
    if (io) io.emit("communityUpdated", populated);

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in addGroupsToCommunity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Remove a topic group from a Community.
 */
export const removeGroupFromCommunity = async (req, res) => {
  try {
    const { id, groupId } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (
      community.admin.toString() !== userId.toString() &&
      !community.admins.some((a) => a.toString() === userId.toString())
    ) {
      return res.status(403).json({ error: "Only admins can remove groups from this community" });
    }

    community.groups = community.groups.filter((g) => g.toString() !== groupId.toString());
    await community.save();

    await Group.findByIdAndUpdate(groupId, { communityId: null });

    const populated = await Community.findById(id)
      .populate("admin", "name avatar")
      .populate("announcementGroup", "name avatar members onlyAdminsCanMessage")
      .populate("groups", "name avatar members");

    const io = req.app.get("io");
    if (io) io.emit("communityUpdated", populated);

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in removeGroupFromCommunity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a Community.
 */
export const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (
      community.admin.toString() !== userId.toString() &&
      !community.admins.some((a) => a.toString() === userId.toString())
    ) {
      return res.status(403).json({ error: "Only the admin can delete this community" });
    }

    // Clean up announcement group
    if (community.announcementGroup) {
      await Group.findByIdAndDelete(community.announcementGroup);
    }

    // Detach linked groups
    await Group.updateMany({ communityId: id }, { communityId: null });

    await Community.findByIdAndDelete(id);

    const io = req.app.get("io");
    if (io) io.emit("communityDeleted", { communityId: id });

    res.status(200).json({ message: "Community deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCommunity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Leave a Community.
 */
export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    community.members = community.members.filter((m) => m.toString() !== userId.toString());
    await community.save();

    if (community.announcementGroup) {
      await Group.findByIdAndUpdate(community.announcementGroup, {
        $pull: { members: userId },
      });
    }

    res.status(200).json({ message: "Left community successfully" });
  } catch (error) {
    console.error("Error in leaveCommunity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
