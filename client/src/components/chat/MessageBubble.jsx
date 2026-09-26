import React from "react";
import {
  BsCheck,
  BsCheckAll,
  BsPencil,
  BsPinAngleFill,
  BsCheckCircle,
  BsCheckCircleFill,
  BsStarFill,
} from "react-icons/bs";
import { IoBanSharp } from "react-icons/io5";
import { IoReturnUpForwardOutline } from "react-icons/io5";
import MessageMediaContent from "./message/MessageMediaContent.jsx";
import MessageReactions from "./message/MessageReactions.jsx";

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
  loggedInUser,
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
  onOpenViewOnce,
  onRespondEvent,
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

  // Jump to replied quote handler (PRD Section 17)
  const handleJumpToReply = (e) => {
    e.stopPropagation();
    if (!msg.replyTo) return;
    const targetEl = document.getElementById(`msg-${msg.replyTo}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("ring-4", "ring-primary", "rounded-2xl");
      setTimeout(() => {
        targetEl.classList.remove("ring-4", "ring-primary", "rounded-2xl");
      }, 1500);
    }
  };

  const isStarred = Boolean(
    msg.starredBy &&
      msg.starredBy.some(
        (uid) =>
          uid.toString() === loggedInUser?._id?.toString() ||
          uid._id?.toString() === loggedInUser?._id?.toString(),
      ),
  );

  return (
    <div
      id={`msg-${msg._id}`}
      className={`flex items-end gap-2 my-1 group select-text transition-colors duration-150 ${
        isMe ? "justify-end" : "justify-start"
      } ${
        isSearchMatch
          ? "ring-2 ring-warning ring-offset-2 rounded-2xl bg-warning/5 p-1"
          : ""
      }`}
      onContextMenu={(e) => {
        if (!isTombstone) handleContextMenu(e, msg);
      }}
      onDoubleClick={() => {
        if (!isTombstone && setReplyingTo) setReplyingTo(msg);
      }}
    >
      {/* Selection Checkbox in Select Mode */}
      {selectMode && (
        <div
          className="flex-shrink-0 cursor-pointer self-center"
          onClick={() => toggleSelectMessage(msg._id)}
        >
          {isSelected ? (
            <BsCheckCircleFill className="text-primary" size={20} />
          ) : (
            <BsCheckCircle className="text-base-content/40" size={20} />
          )}
        </div>
      )}

      {/* Group Sender Avatar */}
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

      {/* Bubble Container */}
      <div
        className={`relative flex flex-col max-w-xs sm:max-w-sm md:max-w-md ${
          isMe ? "items-end" : "items-start"
        }`}
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
        {/* Pin Indicator */}
        {msg.isPinned && !isTombstone && (
          <BsPinAngleFill
            className={`text-primary absolute -top-2 ${isMe ? "right-2" : "left-2"}`}
            size={11}
          />
        )}

        {/* Group Sender Name */}
        {selectedChat.isGroup && !isMe && (
          <span className="text-[11px] font-semibold text-primary mb-0.5 pl-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-3 py-2 rounded-2xl shadow-sm text-sm relative
            ${isMe ? "bg-primary text-primary-content rounded-tr-sm" : "bg-base-100 text-base-content rounded-tl-sm"}
            ${isTombstone ? "opacity-70" : ""}
          `}
        >
          {isTombstone ? (
            <span className="italic flex items-center gap-1.5 opacity-80">
              <IoBanSharp size={14} />
              This message was deleted
            </span>
          ) : (
            <>
              {/* Forwarded label (PRD Section 21) */}
              {msg.isForwarded && (
                <div className="flex items-center gap-1 text-[10px] text-base-content/60 italic mb-1">
                  <IoReturnUpForwardOutline size={13} />
                  <span>Forwarded</span>
                </div>
              )}

              {/* Reply Preview with Jump-to-Quote (PRD Section 17) */}
              {msg.replyToText && (
                <div
                  onClick={handleJumpToReply}
                  className={`border-l-4 rounded-lg px-2.5 py-1.5 mb-2 text-xs cursor-pointer transition-colors ${
                    isMe
                      ? "border-primary-content/50 bg-black/10 hover:bg-black/20 text-primary-content"
                      : "border-primary bg-primary/10 hover:bg-primary/20"
                  }`}
                  title="Click to jump to quoted message"
                >
                  <p
                    className={`font-semibold text-[11px] ${
                      isMe ? "text-primary-content font-bold" : "text-primary"
                    }`}
                  >
                    {msg.replyToSender || "Quoted Message"}
                  </p>
                  <p className="truncate opacity-80">{msg.replyToText}</p>
                </div>
              )}

              {/* Media Content (Audio, Video, Doc, Image, Poll, Location, Contact, Event, Text) */}
              <MessageMediaContent
                msg={msg}
                isMe={isMe}
                loggedInUser={loggedInUser}
                selectedChat={selectedChat}
                onOpenViewOnce={onOpenViewOnce}
                onRespondEvent={onRespondEvent}
                isSearchMatch={isSearchMatch}
                msgSearchQuery={msgSearchQuery}
              />
            </>
          )}

          {/* Timestamp + delivery ticks + Star indicator */}
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            {msg.isEdited && !isTombstone && (
              <span className="text-[10px] opacity-60 flex items-center gap-0.5">
                <BsPencil size={8} /> Edited
              </span>
            )}

            {isStarred && (
              <BsStarFill
                size={11}
                className="text-warning fill-warning"
                title="Starred message"
              />
            )}

            <span
              className={`text-[10px] ${
                isMe ? "text-primary-content/75" : "text-base-content/50"
              }`}
            >
              {timeStr}
            </span>

            {isMe && !isTombstone && (
              <span className="text-[1rem] leading-none">
                {msg.status === "sending" && (
                  <BsCheck className="text-primary-content/60" />
                )}
                {(!msg.status || msg.status === "sent") && (
                  <BsCheck className="text-primary-content/75" />
                )}
                {msg.status === "delivered" && (
                  <BsCheckAll className="text-primary-content/90" />
                )}
                {msg.status === "read" && (
                  <BsCheckAll className="text-info" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction Pill Container & Popups */}
        <MessageReactions
          msg={msg}
          isMe={isMe}
          isTombstone={isTombstone}
          selectMode={selectMode}
          reactionMap={reactionMap}
          hoveredMsgId={hoveredMsgId}
          setHoveredMsgId={setHoveredMsgId}
          showFullEmojiForMsg={showFullEmojiForMsg}
          setShowFullEmojiForMsg={setShowFullEmojiForMsg}
          handleReact={handleReact}
          reactionTimeoutRef={reactionTimeoutRef}
          emojiPickerRef={emojiPickerRef}
        />
      </div>
    </div>
  );
};

export default MessageBubble;
