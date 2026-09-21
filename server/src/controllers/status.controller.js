import Status from '../models/status.model.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/user.model.js';

export const uploadStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required for status' });
        }

        // Validate image mimetype
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed for status' });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'chatapp_status' },
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ error: 'Image upload failed' });
                }
                const newStatus = new Status({
                    userId,
                    image: result.secure_url,
                });
                await newStatus.save();
                
                // Populate user info before returning
                await newStatus.populate('userId', 'name avatar');

                return res.status(201).json(newStatus);
            }
        );
        uploadStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error in uploadStatus:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStatuses = async (req, res) => {
    try {
        // Fetch all statuses created within the last 24 hours
        // The TTL index automatically removes them, but we add a time check just in case.
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const statuses = await Status.find({ createdAt: { $gt: oneDayAgo } })
            .populate('userId', 'name avatar')
            .sort({ createdAt: 1 });

        // Group statuses by user
        const groupedStatuses = {};
        statuses.forEach((status) => {
            const uId = status.userId._id.toString();
            if (!groupedStatuses[uId]) {
                groupedStatuses[uId] = {
                    user: status.userId,
                    statuses: [],
                };
            }
            groupedStatuses[uId].statuses.push({
                _id: status._id,
                image: status.image,
                createdAt: status.createdAt,
            });
        });

        // Convert grouped object to array
        const result = Object.values(groupedStatuses);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getStatuses:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);

        if (!status) {
            return res.status(404).json({ error: 'Status not found' });
        }

        if (status.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this status' });
        }

        await Status.deleteOne({ _id: id });
        res.status(200).json({ message: 'Status deleted successfully', deletedStatusId: id });
    } catch (error) {
        console.error('Error in deleteStatus:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
