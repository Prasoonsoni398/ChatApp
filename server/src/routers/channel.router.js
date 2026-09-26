import express from "express";
import {
  createChannel,
  getChannels,
  getChannelById,
  toggleFollowChannel,
  postToChannel,
  reactToChannelPost,
  deleteChannelPost,
  deleteChannel,
} from "../controllers/channel.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadAnyMedia } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", protect, getChannels);
router.post("/", protect, uploadAnyMedia, createChannel);
router.get("/:id", protect, getChannelById);
router.delete("/:id", protect, deleteChannel);
router.patch("/:id/follow", protect, toggleFollowChannel);
router.post("/:id/posts", protect, uploadAnyMedia, postToChannel);
router.delete("/:id/posts/:postId", protect, deleteChannelPost);
router.post("/:id/posts/:postId/react", protect, reactToChannelPost);

export default router;
