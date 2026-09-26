import express from "express";
import {
  createCommunity,
  getCommunities,
  getCommunityById,
  addGroupsToCommunity,
  removeGroupFromCommunity,
  deleteCommunity,
  leaveCommunity,
} from "../controllers/community.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getCommunities);
router.post("/", protect, createCommunity);
router.get("/:id", protect, getCommunityById);
router.post("/:id/groups", protect, addGroupsToCommunity);
router.delete("/:id/groups/:groupId", protect, removeGroupFromCommunity);
router.post("/:id/leave", protect, leaveCommunity);
router.delete("/:id", protect, deleteCommunity);

export default router;
