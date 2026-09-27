import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "text", "video"],
    default: "image",
    required: true,
  },
  image: {
    type: String,
  },
  video: {
    type: String,
  },
  mediaUrl: {
    type: String,
  },
  caption: {
    type: String,
    default: "",
  },
  privacy: {
    type: {
      type: String,
      enum: ["contacts", "contacts_except", "only_share_with"],
      default: "contacts",
    },
    excludedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  text: {
    type: String,
    default: "",
  },
  backgroundColor: {
    type: String,
    default: "#075e54",
  },
  fontFamily: {
    type: String,
    default: "sans-serif",
  },
  song: {
    title: { type: String, default: "" },
    artist: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    volume: { type: Number, default: 1 },
  },
  videoSelection: {
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    originalDuration: { type: Number, default: 0 },
    volume: { type: Number, default: 1 },
  },
  filter: {
    type: String,
    default: "none",
  },
  overlays: {
    type: Array,
    default: [],
  },
  viewers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    // Automatically remove the document 24 hours after creation
    expires: 86400,
  },
});

const Status = mongoose.model("Status", statusSchema);
export default Status;
