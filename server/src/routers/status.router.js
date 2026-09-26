import express from "express";
import {
  uploadStatus,
  createTextStatus,
  viewStatus,
  getStatuses,
  deleteStatus,
} from "../controllers/status.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), uploadStatus);
router.post("/text", protect, createTextStatus);
router.post("/:id/view", protect, viewStatus);
router.get("/", protect, getStatuses);
router.delete("/:id", protect, deleteStatus);

export default router;
