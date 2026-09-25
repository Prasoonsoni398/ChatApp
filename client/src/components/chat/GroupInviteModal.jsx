import { useState, useEffect } from "react";
import {
  BsX,
  BsLink45Deg,
  BsCopy,
  BsArrowRepeat,
  BsCheck2,
  BsShareFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as groupService from "../../services/groupService.js";

/**
 * GroupInviteModal (PRD Section 44)
 * Allows group members/admins to view, copy, share, and reset group invitation links.
 */
const GroupInviteModal = ({ isOpen, onClose, group, loggedInUser }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && group?.id) {
      loadInviteLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, group?.id]);

  const loadInviteLink = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupInviteLink(group.id);
      setInviteCode(data.inviteCode);
    } catch (err) {
      toast.error(err.message || "Failed to load invite link");
    } finally {
      setLoading(false);
    }
  };

  const handleResetLink = async () => {
    if (!window.confirm("Reset invite link? Previous link will stop working."))
      return;
    try {
      setLoading(true);
      const data = await groupService.resetGroupInviteLink(group.id);
      setInviteCode(data.inviteCode);
      toast.success("Invite link reset!");
    } catch (err) {
      toast.error(err.message || "Failed to reset invite link");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
  const isAdmin =
    group.admin === loggedInUser?._id || group.admin?._id === loggedInUser?._id;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on ChatApp`,
          text: `Follow this link to join my Guftgugroup: ${group.name}`,
          url: inviteUrl,
        });
      } catch (_e) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-md shadow-2xl border border-base-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BsLink45Deg size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base">Invite via link</h3>
              <p className="text-xs text-base-content/60 truncate max-w-50">
                {group.name}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-base-content/70">
            Anyone with Guftgucan follow this link to join this group. Only
            share it with people you trust.
          </p>

          {/* Link box */}
          <div className="p-3.5 bg-base-200 rounded-2xl flex items-center justify-between gap-3 border border-base-300">
            <span className="text-xs font-mono text-primary truncate select-all">
              {loading ? "Loading link..." : inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              disabled={loading || !inviteCode}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-base-300 text-primary transition-colors cursor-pointer disabled:opacity-50"
              title="Copy link"
            >
              {copied ? (
                <BsCheck2 size={18} className="text-success" />
              ) : (
                <BsCopy size={16} />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCopy}
              disabled={loading || !inviteCode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors text-sm font-medium"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <BsCopy size={16} />
              </div>
              <span>Copy link</span>
            </button>

            <button
              onClick={handleShare}
              disabled={loading || !inviteCode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors text-sm font-medium"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <BsShareFill size={15} />
              </div>
              <span>Share link</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleResetLink}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 text-error transition-colors text-sm font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-error/10 text-error flex items-center justify-center">
                  <BsArrowRepeat size={16} />
                </div>
                <span>Reset link</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInviteModal;
