import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "text"],
    default: "image",
    required: true,
  },
  image: {
    type: String,
  },
  caption: {
    type: String,
    default: "",
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
