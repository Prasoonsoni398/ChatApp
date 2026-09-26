/**
 * contact.controller.js
 * WhatsApp-style contacts: search by phone number, add, remove, list.
 */
import User from "../models/user.model.js";

// Normalise phone for consistent lookup
const normalisePhone = (raw) => {
  if (!raw) return null;
  let p = raw.replace(/[\s\-().]/g, "");
  if (!p.startsWith("+")) p = `+${p}`;
  return p;
};

/* ─── Search user by phone number ─── */
export const searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const normPhone = normalisePhone(phone);
    const user = await User.findOne({
      phone: normPhone,
      isVerified: true,
    }).select("name email phone avatar");

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with that phone number" });
    }

    // Don't return yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot add yourself as a contact" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─── Get all contacts of the logged-in user ─── */
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "contacts",
      "name email phone avatar online about",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build nickname map
    const nicknameMap = new Map();
    if (user.contactNicknames && Array.isArray(user.contactNicknames)) {
      user.contactNicknames.forEach((cn) => {
        if (cn && cn.userId)
          nicknameMap.set(cn.userId.toString(), cn.customName);
      });
    }

    const contactsWithNicknames = (user.contacts || []).map((c) => {
      const cObj = c.toObject ? c.toObject() : { ...c };
      const custom = nicknameMap.get(cObj._id.toString());
      if (custom) {
        cObj.customName = custom;
        cObj.displayName = custom;
      } else {
        cObj.displayName = cObj.name;
      }
      return cObj;
    });

    res.status(200).json(contactsWithNicknames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─── Add a contact by user ID (with optional customName) ─── */
export const addContact = async (req, res) => {
  try {
    const { userId, customName } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const myId = req.user._id;

    if (userId.toString() === myId.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const me = await User.findById(myId);
    if (!me) return res.status(404).json({ message: "User not found" });

    const alreadyAdded = me.contacts.some(
      (c) => c.toString() === userId.toString(),
    );

    if (alreadyAdded) {
      // If already added but user provided an updated custom name, update the custom name!
      if (customName && customName.trim()) {
        me.contactNicknames = me.contactNicknames || [];
        const existingIdx = me.contactNicknames.findIndex(
          (cn) => cn.userId.toString() === userId.toString(),
        );
        if (existingIdx >= 0) {
          me.contactNicknames[existingIdx].customName = customName.trim();
        } else {
          me.contactNicknames.push({ userId, customName: customName.trim() });
        }
        await me.save();
        return res.status(200).json({
          message: "Contact name updated successfully",
          contact: {
            _id: targetUser._id,
            name: targetUser.name,
            customName: customName.trim(),
            displayName: customName.trim(),
            email: targetUser.email,
            phone: targetUser.phone,
            avatar: targetUser.avatar,
            about: targetUser.about,
          },
        });
      }
      return res.status(400).json({ message: "Contact already added" });
    }

    me.contacts.push(userId);

    // Save custom nickname if specified
    if (customName && customName.trim()) {
      me.contactNicknames = me.contactNicknames || [];
      me.contactNicknames.push({
        userId,
        customName: customName.trim(),
      });
    }

    await me.save();

    const finalDisplayName =
      customName && customName.trim() ? customName.trim() : targetUser.name;

    res.status(201).json({
      message: "Contact added successfully",
      contact: {
        _id: targetUser._id,
        name: targetUser.name,
        customName: customName ? customName.trim() : undefined,
        displayName: finalDisplayName,
        email: targetUser.email,
        phone: targetUser.phone,
        avatar: targetUser.avatar,
        about: targetUser.about,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─── Update contact custom name (PUT /api/contacts/:userId) ─── */
export const updateContactName = async (req, res) => {
  try {
    const { userId } = req.params;
    const { customName } = req.body;

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: "User not found" });

    me.contactNicknames = me.contactNicknames || [];
    const idx = me.contactNicknames.findIndex(
      (cn) => cn.userId.toString() === userId.toString(),
    );

    if (customName && customName.trim()) {
      if (idx >= 0) {
        me.contactNicknames[idx].customName = customName.trim();
      } else {
        me.contactNicknames.push({ userId, customName: customName.trim() });
      }
    } else if (idx >= 0) {
      // Clear custom name
      me.contactNicknames.splice(idx, 1);
    }

    await me.save();

    res.status(200).json({
      message: "Contact name updated successfully",
      userId,
      customName: customName ? customName.trim() : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─── Remove a contact ─── */
export const removeContact = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: "User not found" });

    me.contacts = me.contacts.filter((c) => c.toString() !== userId.toString());

    if (me.contactNicknames && Array.isArray(me.contactNicknames)) {
      me.contactNicknames = me.contactNicknames.filter(
        (cn) => cn.userId.toString() !== userId.toString(),
      );
    }

    await me.save();

    res.status(200).json({ message: "Contact removed", contacts: me.contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
