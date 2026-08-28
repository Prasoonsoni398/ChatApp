import Group from '../models/group.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary from '../config/cloudinary.js';

/* ── Create a new group ── */
export const createGroup = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;
        const adminId = req.user._id;

        if (!name || !memberIds) {
            return res.status(400).json({ error: 'Name and members are required' });
        }

        const parsedMembers = JSON.parse(memberIds);
        const uniqueMembers = [...new Set([adminId.toString(), ...parsedMembers])];

        let avatarUrl = '';
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'chatapp_groups' },
                    (error, result) => { if (error) reject(error); else resolve(result); }
                ).end(req.file.buffer);
            });
            avatarUrl = result.secure_url;
        }

        const group = new Group({
            name,
            description: description || '',
            members: uniqueMembers,
            admin: adminId,
            avatar: avatarUrl,
        });

        await group.save();

        const populated = await Group.findById(group._id)
            .populate('members', 'name avatar _id')
            .populate('admin', 'name avatar _id');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error in createGroup:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ── Get all groups for the logged-in user ── */
export const getGroups = async (req, res) => {
    try {
        const myId = req.user._id;
        const groups = await Group.find({ members: myId })
            .populate('members', 'name avatar _id')
            .populate('admin', 'name _id')
            .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error('Error in getGroups:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ── Get messages for a group ── */
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ groupId })
            .populate('senderId', 'name avatar _id')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getGroupMessages:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ── Send a message to a group ── */
export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, replyToId, replyToText, replyToSender } = req.body;
        const senderId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (!group.members.map(m => m.toString()).includes(senderId.toString())) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        let imageUrl = '';
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'chatapp_messages' },
                    (error, result) => { if (error) reject(error); else resolve(result); }
                ).end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId: senderId, // placeholder, groupId takes priority
            groupId,
            text: text || '',
            image: imageUrl || undefined,
            replyTo: replyToId || null,
            replyToText: replyToText || null,
            replyToSender: replyToSender || null,
        });

        await newMessage.save();

        const populated = await Message.findById(newMessage._id)
            .populate('senderId', 'name avatar _id');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error in sendGroupMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ── Leave a group ── */
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const myId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        group.members = group.members.filter(m => m.toString() !== myId.toString());

        // If admin leaves, transfer admin to next member
        if (group.admin.toString() === myId.toString() && group.members.length > 0) {
            group.admin = group.members[0];
        }

        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            return res.status(200).json({ message: 'Group deleted (no members left)' });
        }

        await group.save();
        res.status(200).json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('Error in leaveGroup:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
