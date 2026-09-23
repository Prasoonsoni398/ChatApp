import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: true, // User can only upload images
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Automatically remove the document 24 hours after creation
    expires: 86400,
  },
});

const Status = mongoose.model("Status", statusSchema);
export default Status;
