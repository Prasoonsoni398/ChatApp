import React from "react";
import EmojiPicker from "emoji-picker-react";
import {
  BsCheck,
  BsCheckAll,
  BsPencil,
  BsPinAngleFill,
  BsCheckCircle,
  BsCheckCircleFill,
} from "react-icons/bs";
import quickEmojis from "../../mockData/quickEmojis.js";

const MessageBubble = ({
  msg,
  isMe,
  senderName,
  senderAvatar,
  timeStr,
  isSelected,
  selectMode,
  isSearchMatch,
  msgSearchQuery,
  reactionMap,

  selectedChat,
  hoveredMsgId,
  setHoveredMsgId,
  showFullEmojiForMsg,
  setShowFullEmojiForMsg,
  handleReact,
  handleContextMenu,
  toggleSelectMessage,
  setReplyingTo,
  reactionTimeoutRef,
}) => {
  const isTombstone = msg.isDeletedForEveryone;

  const emojiPickerRef = React.useRef(null);

  React.useEffect(() => {
    if (showFullEmojiForMsg !== msg._id) return;
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowFullEmojiForMsg(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFullEmojiForMsg, msg._id, setShowFullEmojiForMsg]);

  return (
    <div
      id={`msg-${msg._id}`}
      className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"} ${
        isSelected ? "opacity-75" : ""
      } ${isSearchMatch ? "ring-2 ring-primary/50 rounded-2xl" : ""} transition-all`}
      onContextMenu={(e) => {
        if (selectMode) {
          e.preventDefault();
          return;
        }
        handleContextMenu(e, msg, isMe);
      }}
      onDoubleClick={(e) => {
        if (selectMode) {
          toggleSelectMessage(msg._id);
          return;
        }
        handleContextMenu(e, msg, isMe);
      }}
      onClick={() => {
        if (selectMode) toggleSelectMessage(msg._id);
      }}
      onTouchStart={(e) => {
        if (selectMode) return;
        e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
        e.currentTarget.dataset.touchStartTime = Date.now();
      }}
      onTouchEnd={(e) => {
        if (selectMode) return;
        const startX = parseFloat(e.currentTarget.dataset.touchStartX);
        const endX = e.changedTouches[0].clientX;
        const elapsed =
          Date.now() - parseFloat(e.currentTarget.dataset.touchStartTime);
        if (elapsed > 500) {
          const t = e.changedTouches[0];
          handleContextMenu(
            {
              pageX: t.pageX,
              pageY: t.pageY,
              preventDefault: () => {},
              stopPropagation: () => {},
            },
            msg,
            isMe,
          );
        } else if (endX - startX > 60) {
          setReplyingTo({
            _id: msg._id,
            text: msg.text,
            image: msg.image,
            senderName,
          });
        }
      }}
    >
      {/* Select checkbox */}
      {selectMode && (
        <div className="flex items-center self-center px-1">
          {isSelected ? (
            <BsCheckCircleFill className="text-primary" size={20} />
          ) : (
            <BsCheckCircle className="text-base-content/40" size={20} />
          )}
        </div>
      )}

      {/* Group sender avatar */}
      {selectedChat.isGroup && !isMe && (
        <div className="flex-shrink-0 mb-1">
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
      {selectedChat.isGroup && isMe && <div className="w-8" />}

      {/* Bubble container */}
      <div
        className={`relative flex flex-col max-w-xs md:max-w-sm lg:max-w-md ${isMe ? "items-end" : "items-start"}`}
        onMouseEnter={() => {
          if (!isTombstone && !selectMode) {
            if (reactionTimeoutRef.current)
              clearTimeout(reactionTimeoutRef.current);
            setHoveredMsgId(msg._id);
          }
        }}
        onMouseLeave={() => {
          reactionTimeoutRef.current = setTimeout(
            () => setHoveredMsgId(null),
            300,
          );
        }}
      >
        {/* Pin indicator */}
        {msg.isPinned && !isTombstone && (
          <BsPinAngleFill
            className={`text-primary absolute -top-2 ${isMe ? "right-2" : "left-2"}`}
            size={11}
          />
        )}

        {/* Group sender name */}
        {selectedChat.isGroup && !isMe && (
          <span className="text-[11px] font-semibold text-primary mb-0.5 pl-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-3 py-2 rounded-2xl shadow-sm text-sm relative
            ${isMe ? "bg-[#dcf8c6] text-black rounded-tr-sm" : "bg-base-100 text-base-content rounded-tl-sm"}
            ${isTombstone ? "opacity-70" : ""}
          `}
        >
          {isTombstone ? (
            <span className="italic flex items-center gap-1.5 opacity-80">
              🚫 This message was deleted
            </span>
          ) : (
            <>
              {/* Reply preview */}
              {msg.replyToText && (
                <div
                  className={`border-l-4 rounded-lg px-2 py-1 mb-2 text-xs cursor-pointer ${
                    isMe
                      ? "border-white/60 bg-white/10"
                      : "border-primary/60 bg-primary/10"
                  }`}
                >
                  <p
                    className={`font-semibold text-[11px] ${isMe ? "text-white/80" : "text-primary"}`}
                  >
                    {msg.replyToSender}
                  </p>
                  <p className="truncate opacity-80">{msg.replyToText}</p>
                </div>
              )}

              {/* Image */}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Attachment"
                  className="max-w-full rounded-xl mb-2 object-cover"
                />
              )}

              {/* Text — with search highlight */}
              {msg.text &&
                (isSearchMatch ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: msg.text.replace(
                        new RegExp(
                          `(${msgSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                          "gi",
                        ),
                        '<mark class="bg-yellow-300 text-black rounded px-0.5">$1</mark>',
                      ),
                    }}
                  />
                ) : (
                  <span>{msg.text}</span>
                ))}
            </>
          )}

          {/* Timestamp + delivery ticks */}
          <div className={`flex items-center gap-1 mt-1 justify-end`}>
            {msg.isEdited && !isTombstone && (
              <span className="text-[10px] opacity-60 flex items-center gap-0.5">
                <BsPencil size={8} /> Edited
              </span>
            )}
            <span
              className={`text-[10px] ${isMe ? "text-black/60" : "text-base-content/50"}`}
            >
              {timeStr}
            </span>
            {isMe && !isTombstone && (
              <span className="text-[1rem]">
                {msg.status === "sending" && (
                  <BsCheck className="text-black/40" />
                )}
                {(!msg.status || msg.status === "sent") && (
                  <BsCheck className="text-black/40" />
                )}
                {msg.status === "delivered" && (
                  <BsCheckAll className="text-black/40" />
                )}
                {msg.status === "read" && (
                  <BsCheckAll className="text-[#53bdeb]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Emoji reactions display */}
        {Object.keys(reactionMap).length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
          >
            {Object.entries(reactionMap).map(([emoji, { count, isMine }]) => (
              <button
                key={emoji}
                onClick={() => handleReact(msg._id, emoji)}
                className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-all ${
                  isMine
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-base-100 border-base-300 hover:border-primary"
                }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="font-semibold">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Quick emoji picker on hover */}
        {hoveredMsgId === msg._id && !isTombstone && (
          <div
            className={`absolute -top-10 z-50 flex items-center gap-1 bg-base-100 border border-base-300 rounded-full px-2 py-1 shadow-xl animate-slide-up origin-bottom ${
              isMe ? "right-0" : "left-0"
            }`}
            onMouseEnter={() => {
              if (reactionTimeoutRef.current)
                clearTimeout(reactionTimeoutRef.current);
              setHoveredMsgId(msg._id);
            }}
            onMouseLeave={() => {
              reactionTimeoutRef.current = setTimeout(
                () => setHoveredMsgId(null),
                300,
              );
            }}
          >
            {quickEmojis.map((em) => (
              <button
                key={em}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(msg._id, em);
                }}
                className="text-lg hover:scale-125 transition-transform"
                title={em}
              >
                {em}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullEmojiForMsg(msg._id);
                setHoveredMsgId(null);
              }}
              className="text-base-content/50 hover:text-primary text-sm px-1"
              title="More"
            >
              +
            </button>
          </div>
        )}

        {/* Full EmojiPicker */}
        {showFullEmojiForMsg === msg._id && (
          <div
            ref={emojiPickerRef}
            className={`absolute z-[150] top-0 animate-fade-in ${
              isMe ? "right-full mr-2" : "left-full ml-2"
            }`}
          >
            <EmojiPicker
              height={350}
              width={280}
              onEmojiClick={(e) => {
                handleReact(msg._id, e.emoji);
                setShowFullEmojiForMsg(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
