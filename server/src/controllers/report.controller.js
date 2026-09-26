import mongoose from "mongoose";
import Report from "../models/report.model.js";

const VALID_TARGET_TYPES = ["user", "group", "channel", "message", "status"];
const VALID_REASONS = ["spam", "scam", "harassment", "abuse", "other"];

export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body || {};
    const reporterId = req.user?._id;

    if (!targetType || !targetId || !reason) {
      return res
        .status(400)
        .json({ error: "Target type, target ID, and reason are required" });
    }

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({
        error: `Invalid target type. Must be one of: ${VALID_TARGET_TYPES.join(", ")}`,
      });
    }

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        error: `Invalid report reason. Must be one of: ${VALID_REASONS.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: "Invalid target ID format" });
    }

    if (
      targetType === "user" &&
      targetId.toString() === reporterId?.toString()
    ) {
      return res
        .status(400)
        .json({ error: "You cannot report your own account" });
    }

    const report = new Report({
      reporterId,
      targetType,
      targetId,
      reason,
      details: typeof details === "string" ? details.trim() : "",
    });

    await report.save();
    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("Error creating report:", error.message);
    return res.status(500).json({ error: "Failed to submit report" });
  }
};
