import EmojiPicker from "emoji-picker-react";
import quickEmojis from "../../../mockData/quickEmojis.js";

const MessageReactions = ({
  msg,
  isMe,
  isTombstone,
  selectMode,
  reactionMap,
  hoveredMsgId,
  setHoveredMsgId,
  showFullEmojiForMsg,
  setShowFullEmojiForMsg,
  handleReact,
  reactionTimeoutRef,
  emojiPickerRef,
}) => {
  return (
    <>
      {/* Reaction Pill Container */}
      {reactionMap && reactionMap.length > 0 && (
        <div
          className={`flex flex-wrap gap-1 mt-0.5 z-10 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          {reactionMap.map(({ emoji, count, isMyReaction }) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(msg._id, emoji);
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs shadow-xs border transition-all active:scale-95 ${
                isMyReaction
                  ? "bg-primary/15 border-primary/40 text-primary font-bold"
                  : "bg-base-100 border-base-300 text-base-content/70 hover:bg-base-200"
              }`}
            >
              <span>{emoji}</span>
              {count > 1 && <span className="text-[10px]">{count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Quick Reaction Bar on Hover */}
      {hoveredMsgId === msg._id && !isTombstone && !selectMode && (
        <div
          className={`absolute -top-9 ${
            isMe ? "right-0" : "left-0"
          } bg-base-100/95 backdrop-blur-md rounded-full shadow-lg border border-base-300 px-2 py-1 flex items-center gap-1 z-30 animate-fade-in`}
          onMouseEnter={() => {
            if (reactionTimeoutRef.current)
              clearTimeout(reactionTimeoutRef.current);
          }}
          onMouseLeave={() => setHoveredMsgId(null)}
        >
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(msg._id, emoji)}
              className="hover:scale-125 transition-transform text-sm p-1 rounded-full hover:bg-base-200 active:scale-95"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() =>
              setShowFullEmojiForMsg(
                showFullEmojiForMsg === msg._id ? null : msg._id,
              )
            }
            className="text-base-content/50 hover:text-base-content text-xs px-1 hover:bg-base-200 rounded-full transition-colors"
          >
            +
          </button>
        </div>
      )}

      {/* Full Emoji Picker on Plus */}
      {showFullEmojiForMsg === msg._id && (
        <div
          ref={emojiPickerRef}
          className={`absolute top-0 ${
            isMe ? "right-0" : "left-0"
          } z-50 animate-modal-pop shadow-2xl rounded-2xl overflow-hidden`}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              handleReact(msg._id, emojiData.emoji);
              setShowFullEmojiForMsg(null);
            }}
            lazyLoadEmojis
          />
        </div>
      )}
    </>
  );
};

export default MessageReactions;
