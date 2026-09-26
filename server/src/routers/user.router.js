import express from "express";
import {
  getUsers,
  getAllUsers,
  getUserProfile,
  updateProfile,
  updatePrivacySettings,
  toggleBlockUser,
  getBlockedUsers,
  getLinkedDevices,
  linkDevice,
  unlinkDevice,
  exportAccountData,
  deleteAccount,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET /api/users/profile/:userId — full profile details of a user
router.get("/profile/:userId", protect, getUserProfile);

// GET /api/users/all  — all verified users (for group member picker)
router.get("/all", protect, getAllUsers);

// GET /api/users/export-data — export account data (PRD Section 105)
router.get("/export-data", protect, exportAccountData);

// DELETE /api/users/account — delete account and all associations (PRD Section 104)
router.delete("/account", protect, deleteAccount);

// GET /api/users  — current user's contacts only (requires auth)
router.get("/", protect, getUsers);

router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.put("/privacy", protect, updatePrivacySettings);
router.get("/blocked", protect, getBlockedUsers);
router.post("/block/:userId", protect, toggleBlockUser);
router.get("/linked-devices", protect, getLinkedDevices);
router.post("/linked-devices", protect, linkDevice);
router.delete("/linked-devices/:deviceId", protect, unlinkDevice);

export default router;
