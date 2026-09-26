import { BsX, BsCheck, BsCheckAll } from "react-icons/bs";
import { modalOverlay, modalCard } from "../../../constants/styles.js";

const MessageInfoModal = ({ show, onClose, infoMessage }) => {
  if (!show || !infoMessage) return null;

  return (
    <div className={`${modalOverlay} z-[110]`} onClick={onClose}>
      <div className={modalCard} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Message Info</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={18} />
          </button>
        </div>
        <div className="bg-base-200 rounded-xl px-3 py-2 text-sm mb-4">
          {infoMessage.text || <em className="opacity-60">📷 Image</em>}
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-base-300">
            <span className="text-base-content/60 font-medium">Sent</span>
            <span className="flex items-center gap-2 font-semibold">
              <BsCheck className="text-base-content/60" />
              {new Date(infoMessage.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-base-300">
            <span className="text-base-content/60 font-medium">Delivered</span>
            <span className="flex items-center gap-2 font-semibold text-base-content/60">
              <BsCheckAll />
              {new Date(
                new Date(infoMessage.createdAt).getTime() + 1500,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-base-content/60 font-medium">Read</span>
            <span className="flex items-center gap-2 font-semibold text-success">
              <BsCheckAll />
              {new Date(
                new Date(infoMessage.createdAt).getTime() + 3000,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {infoMessage.isEdited && (
            <div className="flex justify-between items-center py-2 border-t border-base-300">
              <span className="text-base-content/60">Edited</span>
              <span className="badge badge-warning badge-sm">Yes</span>
            </div>
          )}
          {infoMessage.isPinned && (
            <div className="flex justify-between items-center py-2 border-t border-base-300">
              <span className="text-base-content/60">Pinned</span>
              <span className="badge badge-primary badge-sm">Yes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
