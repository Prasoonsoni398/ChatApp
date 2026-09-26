import { useEffect } from "react";
import { BsExclamationTriangleFill } from "react-icons/bs";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const ClearChatsConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isClearingAll = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isClearingAll) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClearingAll, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-chats-title"
      aria-describedby="clear-chats-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isClearingAll) {
          onClose();
        }
      }}
      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-base-100 rounded-2xl p-5 border border-error/30 shadow-2xl max-w-sm w-full space-y-4 text-center animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
          <BsExclamationTriangleFill size={22} />
        </div>
        <div>
          <h4 id="clear-chats-title" className="font-bold text-base">
            Clear all chats?
          </h4>
          <p id="clear-chats-desc" className="text-xs text-base-content/60 mt-1">
            This action will clear messages across all your conversations. You
            will not be able to undo this operation.
          </p>
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearingAll}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            Cancel
          </button>
          <RemoveActionButton
            onClick={onConfirm}
            disabled={isClearingAll}
            loading={isClearingAll}
            size="sm"
            label="Yes, Clear All"
            className="px-4"
          />
        </div>
      </div>
    </div>
  );
};

export default ClearChatsConfirmModal;
