import express from "express";
import {
  createGroup,
  getGroups,
  getGroupDetails,
  addMembersToGroup,
  getGroupMessages,
  sendGroupMessage,
  leaveGroup,
  getGroupInviteLink,
  resetGroupInviteLink,
  getGroupByInviteCode,
  joinGroupByInviteCode,
} from "../controllers/group.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload, uploadAnyMedia } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", protect, upload.single("avatar"), createGroup);
router.get("/", protect, getGroups);
router.get("/join/:inviteCode", protect, getGroupByInviteCode);
router.post("/join/:inviteCode", protect, joinGroupByInviteCode);
router.get("/:groupId/invite", protect, getGroupInviteLink);
router.post("/:groupId/invite/reset", protect, resetGroupInviteLink);
router.get("/:groupId/details", protect, getGroupDetails);
router.post("/:groupId/members", protect, addMembersToGroup);
router.get("/:groupId/messages", protect, getGroupMessages);
router.post(
  "/:groupId/messages",
  protect,
  uploadAnyMedia,
  sendGroupMessage,
);
router.delete("/:groupId/leave", protect, leaveGroup);

export default router;
