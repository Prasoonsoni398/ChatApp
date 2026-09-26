import { BsX } from "react-icons/bs";
import { modalOverlay, modalCard } from "../../../constants/styles.js";

const ForwardMessageModal = ({
  show,
  onClose,
  chats = [],
  forwardMessage,
  forwardSelectedMessages,
  confirmForward,
}) => {
  if (!show) return null;

  return (
    <div className={`${modalOverlay} z-[110]`} onClick={onClose}>
      <div className={modalCard} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Forward to</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={18} />
          </button>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                if (forwardMessage === "__multi__") {
                  forwardSelectedMessages(chat);
                } else {
                  confirmForward(chat);
                }
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 cursor-pointer transition-colors"
            >
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={chat.avatar} alt={chat.name} />
                </div>
              </div>
              <div>
                <p className="font-medium">{chat.name}</p>
                {chat.isGroup && (
                  <p className="text-xs text-base-content/50">
                    Group · {chat.members?.length} members
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
