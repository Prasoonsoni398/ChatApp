import { useState } from "react";
import { BsX, BsShieldExclamation, BsCheck2 } from "react-icons/bs";
import toast from "react-hot-toast";
import * as reportService from "../../services/reportService.js";
import * as userService from "../../services/userService.js";
import ToggleSwitch from "../common/ToggleSwitch.jsx";

/**
 * ReportModal (PRD Section 68)
 * Enables users to report accounts, groups, channels, or messages for moderation.
 */
const ReportModal = ({ isOpen, onClose, target, onBlocked }) => {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [blockAlso, setBlockAlso] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !target) return null;

  const categories = [
    { id: "spam", label: "Spam" },
    { id: "scam", label: "Scam or fraud" },
    { id: "harassment", label: "Harassment or bullying" },
    { id: "abuse", label: "Hate speech or abuse" },
    { id: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await reportService.createReport({
        targetType: target.type || (target.isGroup ? "group" : "user"),
        targetId: target.id || target._id,
        reason,
        details,
      });

      if (blockAlso && !target.isGroup) {
        await userService.toggleBlockUser(target.id || target._id);
        if (onBlocked) onBlocked(target.id || target._id);
      }

      toast.success("Report submitted. Thank you for keeping Guftgusafe.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-md shadow-2xl border border-base-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
              <BsShieldExclamation size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">Report {target.name}</h3>
              <p className="text-xs text-base-content/60">
                {target.isGroup ? "Group" : "Contact"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-base-content/70">
            Please choose a reason for reporting. The last 5 messages from this{" "}
            {target.isGroup ? "group" : "user"} will be forwarded to Guftgufor
            review.
          </p>

          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:bg-base-200/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={cat.id}
                  checked={reason === cat.id}
                  onChange={(e) => setReason(e.target.value)}
                  className="radio radio-primary radio-sm"
                />
                <span className="text-sm font-medium">{cat.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70 block mb-1.5">
              Additional comments (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what happened..."
              rows={3}
              className="textarea textarea-bordered w-full text-sm rounded-xl resize-none"
            />
          </div>

          {!target.isGroup && (
            <div className="pt-1">
              <ToggleSwitch
                checked={blockAlso}
                onChange={(val) => setBlockAlso(val)}
                label={
                  <span className="text-xs text-base-content/80">
                    Block contact and delete chat messages
                  </span>
                }
                size="sm"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-error flex-1 rounded-xl text-white shadow-md shadow-error/20"
            >
              {loading ? "Submitting..." : "Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
