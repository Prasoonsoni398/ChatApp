import {
  BsInfoCircle,
  BsReply,
  BsCopy,
  BsForward,
  BsPin,
  BsCheckSquare,
  BsTrash,
  BsPencil,
} from "react-icons/bs";
import { contextMenuAction } from "../../constants/styles.js";

/**
 * ContextMenu – the right-click / long-press floating action menu.
 * Rendered at an absolute position determined by the click coordinates.
 */
const ContextMenu = ({
  contextMenu,
  loggedInUser,
  messages,
  handleShowInfo,
  handleReply,
  handleCopy,
  handleForward,
  handlePin,
  handleStartSelect,
  openDeleteModal,
  closeContextMenu,
  setEditingMessageId,
  setMessage,
}) => {
  if (!contextMenu.visible) return null;

  return (
    <ul
      className="menu bg-base-100 shadow-2xl rounded-2xl absolute z-[100] border border-base-300/50 w-56 p-2 animate-modal-pop origin-top-left"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {!(
        contextMenu.msg?.isDeletedForEveryone ||
        contextMenu.msg?.deletedFor?.includes(loggedInUser?._id)
      ) && (
        <>
          <li>
            <a onClick={handleShowInfo} className={contextMenuAction}>
              <BsInfoCircle size={15} className="text-base-content/50" />{" "}
              Message info
            </a>
          </li>
          <li>
            <a onClick={handleReply} className={contextMenuAction}>
              <BsReply size={15} className="text-base-content/50" /> Reply
            </a>
          </li>
          <li>
            <a onClick={handleCopy} className={contextMenuAction}>
              <BsCopy size={15} className="text-base-content/50" /> Copy
            </a>
          </li>
          <li>
            <a onClick={handleForward} className={contextMenuAction}>
              <BsForward size={15} className="text-base-content/50" /> Forward
            </a>
          </li>
          <li>
            <a onClick={handlePin} className={contextMenuAction}>
              <BsPin size={15} className="text-base-content/50" />{" "}
              {contextMenu.msg?.isPinned ? "Unpin" : "Pin"}
            </a>
          </li>
          <div className="divider my-1"></div>
          <li>
            <a onClick={handleStartSelect} className={contextMenuAction}>
              <BsCheckSquare size={15} className="text-base-content/50" />{" "}
              Select
            </a>
          </li>
          {contextMenu.isMe && (
            <li>
              <a
                onClick={() => {
                  const msg = messages.find(
                    (m) => m._id === contextMenu.messageId,
                  );
                  if (msg && !msg.isDeletedForEveryone) {
                    setEditingMessageId(msg._id);
                    setMessage(msg.text);
                    closeContextMenu();
                  }
                }}
                className="flex items-center gap-3 py-2.5 rounded-xl"
              >
                <BsPencil size={15} className="text-base-content/50" /> Edit
              </a>
            </li>
          )}
        </>
      )}
      <li>
        <a
          onClick={openDeleteModal}
          className="flex items-center gap-3 py-2.5 rounded-xl text-error hover:bg-error/10"
        >
          <BsTrash size={15} /> Delete
        </a>
      </li>
    </ul>
  );
};

export default ContextMenu;
