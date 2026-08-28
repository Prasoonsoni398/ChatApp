import Message from '../models/message.model.js';
import cloudinary from '../config/cloudinary.js';

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, replyToId, replyToText, replyToSender } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (req.file) {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'chatapp_messages' },
                async (error, result) => {
                    if (error) {
                        return res.status(500).json({ error: 'Image upload failed' });
                    }
                    const newMessage = new Message({
                        senderId,
                        receiverId,
                        text: text || '',
                        image: result.secure_url,
                        replyTo: replyToId || null,
                        replyToText: replyToText || null,
                        replyToSender: replyToSender || null,
                    });
                    await newMessage.save();
                    return res.status(201).json(newMessage);
                }
            );
            uploadStream.end(req.file.buffer);
            return;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || '',
            replyTo: replyToId || null,
            replyToText: replyToText || null,
            replyToSender: replyToSender || null,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { id } = req.params;
        
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to edit this message' });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        res.status(200).json(message);
    } catch (error) {
        console.error('Error in editMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'me' or 'everyone'
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (type === 'everyone') {
            if (message.senderId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Unauthorized to delete this message for everyone' });
            }
            message.isDeletedForEveryone = true;
            message.text = '';
            message.image = '';
            await message.save();
        } else {
            // Delete for me
            if (!message.deletedFor.includes(req.user._id)) {
                message.deletedFor.push(req.user._id);
                await message.save();
            }
        }

        res.status(200).json({ message: 'Message deleted successfully', deletedMessage: message });
    } catch (error) {
        console.error('Error in deleteMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const pinMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.isPinned = !message.isPinned;
        await message.save();

        res.status(200).json({ isPinned: message.isPinned, data: message });
    } catch (error) {
        console.error('Error in pinMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        // Remove any existing reaction from this user (1 reaction per user)
        const existingIndex = message.reactions.findIndex(
            r => r.userId.toString() === userId.toString()
        );

        if (existingIndex !== -1) {
            const isSameEmoji = message.reactions[existingIndex].emoji === emoji;
            // Remove existing reaction
            message.reactions.splice(existingIndex, 1);
            if (!isSameEmoji) {
                // Add new emoji if different
                message.reactions.push({ emoji, userId });
            }
            // If same emoji, just removed (toggle off)
        } else {
            message.reactions.push({ emoji, userId });
        }

        await message.save();
        res.status(200).json(message.reactions);
    } catch (error) {
        console.error('Error in addReaction:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
