import User from '../models/user.model.js';
import cloudinary from '../config/cloudinary.js';

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('name email avatar');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            
            if (req.file) {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'chatapp_avatars' },
                    async (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return res.status(500).json({ message: 'Image upload failed' });
                        }
                        user.avatar = result.secure_url;
                        const updatedUser = await user.save();
                        res.json({
                            _id: updatedUser._id,
                            name: updatedUser.name,
                            email: updatedUser.email,
                            avatar: updatedUser.avatar,
                        });
                    }
                );
                uploadStream.end(req.file.buffer);
            } else {
                const updatedUser = await user.save();
                res.json({
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatar: updatedUser.avatar,
                });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
