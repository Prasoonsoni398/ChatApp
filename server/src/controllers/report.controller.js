import Report from "../models/report.model.js";

export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const reporterId = req.user._id;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: "Target type, ID, and reason are required" });
    }

    const report = new Report({
      reporterId,
      targetType,
      targetId,
      reason,
      details: details || "",
    });

    await report.save();
    res.status(201).json({ success: true, message: "Report submitted successfully", report });
  } catch (error) {
    console.error("Error creating report:", error.message);
    res.status(500).json({ error: "Failed to submit report" });
  }
};
