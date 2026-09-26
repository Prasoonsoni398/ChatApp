import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      type: String,
    },
    // Extended Media Fields (PRD Section 26-31)
    mediaType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "voice",
        "document",
        "poll",
        "location",
        "contact",
        "event",
      ],
      default: "text",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number, // Audio / voice duration in seconds
      default: 0,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
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
      ref: "Group",
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    poll: {
      question: { type: String, default: "" },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      allowMultipleAnswers: { type: Boolean, default: false },
    },
    disappearingUntil: {
      type: Date,
      default: null,
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      name: { type: String, default: "Shared Location" },
      address: { type: String, default: "" },
    },
    contactCard: {
      name: { type: String },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      avatar: { type: String, default: "" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    isViewOnce: {
      type: Boolean,
      default: false,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Group Event (PRD Section 47)
    event: {
      title: { type: String },
      startDate: { type: String },
      startTime: { type: String },
      location: { type: String, default: "" },
      description: { type: String, default: "" },
      responses: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          status: {
            type: String,
            enum: ["going", "maybe", "not_going"],
            default: "going",
          },
        },
      ],
    },
    // Mentions (PRD Section 45)
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
