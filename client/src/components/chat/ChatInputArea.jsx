import React from "react";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile, BsPaperclip, BsFillSendFill, BsX, BsPencil } from "react-icons/bs";

/**
 * ChatInputArea – the bottom bar where users type messages.
 * Includes the textarea, emoji button, attachment button, and mention popup.
 */
const ChatInputArea = ({
  message,
  setMessage,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  replyingTo,
  setReplyingTo,
  editingMessageId,
  setEditingMessageId,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  emojiToggleBtnRef,
  fileInputRef,
  handleImageSelect,
  handleSendMessage,
  handleTypingEvent,
  showMentionPopup,
  mentionFilter,
  selectedChat,
  loggedInUser,
  handleInsertMention,
}) => {
  return (
    <div className="bg-base-100 px-4 py-3 flex flex-col gap-2 border-t border-base-300">
      {/* Reply preview */}
      {replyingTo && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-primary bg-primary/5`}>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">
              Replying to {replyingTo.senderName}
            </p>
            <p className="text-xs text-base-content/60 truncate">
              {replyingTo.text || "📷 Image"}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-2 text-base-content/40 hover:text-base-content/70"
          >
            <BsX size={18} />
          </button>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessageId && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-warning bg-warning/5">
          <p className="text-xs font-semibold text-warning flex items-center gap-1">
            <BsPencil size={10} /> Editing message
          </p>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setMessage("");
            }}
            className="ml-2 text-base-content/40 hover:text-base-content/70"
          >
            <BsX size={18} />
          </button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-base-300 shadow-sm self-start">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
          >
            <BsX size={12} />
          </button>
        </div>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-[100%] left-4 mb-2 z-50 shadow-xl animate-modal-pop origin-bottom-left"
        >
          <EmojiPicker onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)} />
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          ref={emojiToggleBtnRef}
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          className={`p-2 transition-colors ${showEmojiPicker ? "text-primary" : "text-base-content/50 hover:text-primary"}`}
        >
          <BsEmojiSmile size={22} />
        </button>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-base-content/50 hover:text-primary transition-colors"
        >
          <BsPaperclip size={22} />
        </button>

        <form onSubmit={handleSendMessage} className="flex-1 flex items-end gap-2 relative">
          {/* Mention Popup */}
          {showMentionPopup && selectedChat?.isGroup && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-xl shadow-2xl z-[150] animate-fade-in py-1">
              {(selectedChat.members || [])
                .filter((m) => m && m._id !== loggedInUser?._id && m.name)
                .filter((m) => m.name.toLowerCase().includes((mentionFilter || "").toLowerCase()))
                .map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 cursor-pointer transition-colors"
                    onClick={() => handleInsertMention(member)}
                  >
                    <img
                      src={
                        member.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
                      }
                      alt={member.name}
                      className="w-8 h-8 rounded-full border border-base-300"
                    />
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                ))}
              {(selectedChat.members || [])
                .filter((m) => m && m._id !== loggedInUser?._id && m.name)
                .filter((m) => m.name.toLowerCase().includes((mentionFilter || "").toLowerCase()))
                .length === 0 && (
                <div className="px-4 py-3 text-sm text-base-content/50 text-center">
                  No members found
                </div>
              )}
            </div>
          )}

          <textarea
            value={message}
            onChange={handleTypingEvent}
            placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : "Type a message"}
            className="textarea textarea-bordered w-full rounded-xl bg-base-200 min-h-[44px] max-h-32 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none py-3 text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() && !selectedImage}
            className="btn btn-circle btn-primary shadow-sm disabled:bg-base-300 disabled:text-base-content/30"
          >
            <BsFillSendFill size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInputArea;
