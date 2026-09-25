import { useState, useEffect } from "react";
import { BsX, BsStarFill, BsArrowRight } from "react-icons/bs";
import * as messageService from "../../services/messageService.js";
import toast from "react-hot-toast";

const StarredMessagesModal = ({ isOpen, onClose, onJumpToMessage }) => {
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStarred = async () => {
    try {
      setLoading(true);
      const data = await messageService.getStarredMessages();
      setStarredMessages(data);
    } catch (_err) {
      toast.error("Failed to load starred messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStarred();
    }
  }, [isOpen]);

  const handleUnstar = async (msgId) => {
    try {
      await messageService.toggleStarMessage(msgId);
      setStarredMessages((prev) => prev.filter((m) => m._id !== msgId));
      toast.success("Message unstarred");
    } catch (_err) {
      toast.error("Failed to unstar message");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-base-100 w-full max-w-md rounded-3xl shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[80vh] animate-modal-pop">
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-warning/20 text-warning">
              <BsStarFill size={16} />
            </div>
            <h3 className="font-bold text-base">Starred Messages</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          ) : starredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-base-content/50 gap-2">
              <BsStarFill size={28} className="opacity-30 text-warning" />
              <p className="text-sm font-medium">No starred messages</p>
              <p className="text-xs text-base-content/40">
                Right-click or press and hold any message to star it for quick reference
              </p>
            </div>
          ) : (
            starredMessages.map((msg) => (
              <div
                key={msg._id}
                className="p-3.5 rounded-2xl bg-base-200/60 border border-base-300 hover:border-primary/40 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        msg.senderId?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId?.name || "User"}`
                      }
                      alt={msg.senderId?.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold text-primary">
                      {msg.senderId?.name || "Sender"}
                    </span>
                  </div>
                  <span className="text-[10px] text-base-content/50">
                    {new Date(msg.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Message preview */}
                {msg.mediaType === "image" || msg.image ? (
                  <img
                    src={msg.mediaUrl || msg.image}
                    alt="attachment"
                    className="max-h-36 rounded-xl object-cover w-full"
                  />
                ) : null}

                {msg.text && (
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-base-300/40 text-xs">
                  <button
                    onClick={() => handleUnstar(msg._id)}
                    className="text-error hover:underline text-[11px]"
                  >
                    Unstar
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onJumpToMessage) onJumpToMessage(msg);
                    }}
                    className="text-primary font-medium flex items-center gap-1 hover:underline text-[11px]"
                  >
                    Go to message <BsArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StarredMessagesModal;
