import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        text: {
            type: String,
            default: '',
        },
        image: {
            type: String,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        deletedFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        isDeletedForEveryone: {
            type: Boolean,
            default: false,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        replyToText: {
            type: String,
            default: null,
        },
        replyToSender: {
            type: String,
            default: null,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            default: null,
        },
        reactions: [{
            emoji: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        }],
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
