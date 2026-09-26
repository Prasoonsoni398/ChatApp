import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        text: { type: String, default: "" },
        mediaUrl: { type: String, default: "" },
        mediaType: { type: String, default: "text" },
        createdAt: { type: Date, default: Date.now },
        reactions: [
          {
            emoji: { type: String, required: true },
            userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const Channel = mongoose.model("Channel", channelSchema);
export default Channel;
