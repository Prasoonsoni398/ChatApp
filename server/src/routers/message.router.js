import express from "express";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  pinMessage,
  toggleStarMessage,
  getStarredMessages,
  addReaction,
  clearChat,
  createPoll,
  votePoll,
  viewOnceMessage,
  searchMessages,
  clearAllChats,
  createEvent,
  respondEvent,
  getStorageUsage,
} from "../controllers/message.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadAnyMedia } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/starred", protect, getStarredMessages);
router.get("/search", protect, searchMessages);
router.get("/storage-usage", protect, getStorageUsage);
router.delete("/clear-all", protect, clearAllChats);
router.post("/poll", protect, createPoll);
router.post("/poll/:id/vote", protect, votePoll);
router.post("/event", protect, createEvent);
router.post("/event/:id/respond", protect, respondEvent);
router.post("/:id/view-once", protect, viewOnceMessage);
router.get("/:id", protect, getMessages);
router.post("/send/:id", protect, uploadAnyMedia, sendMessage);
router.put("/:id", protect, editMessage);
router.patch("/pin/:id", protect, pinMessage);
router.patch("/star/:id", protect, toggleStarMessage);
router.patch("/react/:id", protect, addReaction);
router.delete("/clear/:id", protect, clearChat);
router.delete("/:id", protect, deleteMessage);

export default router;
