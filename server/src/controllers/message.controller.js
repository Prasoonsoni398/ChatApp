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
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
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
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this message' });
        }

        await Message.findByIdAndDelete(id);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
