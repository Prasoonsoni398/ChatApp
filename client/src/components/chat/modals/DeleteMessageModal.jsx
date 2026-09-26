import { modalCardMd } from "../../../constants/styles.js";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const DeleteMessageModal = ({
  show,
  onClose,
  deleteMessageId,
  selectedMessageIds,
  deleteIsMe,
  confirmDeleteMessage,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
      <div className={`${modalCardMd} p-0`}>
        <div className="px-6 pt-6 pb-3">
          <h3 className="text-lg font-bold mb-1">Delete message?</h3>
          <p className="text-sm text-base-content/60">
            {deleteMessageId === "__multi__"
              ? `Delete ${selectedMessageIds.length} message(s)?`
              : "Choose who to delete for."}
          </p>
        </div>
        <div className="px-4 pb-5 flex flex-col gap-2">
          {(deleteIsMe || deleteMessageId === "__multi__") && (
            <RemoveActionButton
              onClick={() => confirmDeleteMessage("everyone")}
              fullWidth
              size="md"
              label="Delete for everyone"
            />
          )}
          <button
            onClick={() => confirmDeleteMessage("me")}
            className="btn btn-outline w-full active:scale-95 transition-transform"
          >
            Delete for me
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost w-full active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
