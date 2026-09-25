import React from "react";
import EmojiPicker from "emoji-picker-react";
import {
  BsCheck,
  BsCheckAll,
  BsPencil,
  BsPinAngleFill,
  BsCheckCircle,
  BsCheckCircleFill,
  BsStarFill,
  BsDownload,
  BsFileEarmarkPdfFill,
  BsFileEarmarkTextFill,
  BsFileEarmarkZipFill,
  BsFileEarmarkFill,
  BsGeoAltFill,
} from "react-icons/bs";
import { IoBanSharp } from "react-icons/io5";
import { IoReturnUpForwardOutline } from "react-icons/io5";
import AudioPlayer from "./AudioPlayer.jsx";
import PollCard from "./PollCard.jsx";
import EventCard from "./EventCard.jsx";
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

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocIcon = (filename = "") => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <BsFileEarmarkPdfFill size={28} className="text-error" />;
    if (["doc", "docx", "txt"].includes(ext))
      return <BsFileEarmarkTextFill size={28} className="text-info" />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
      return <BsFileEarmarkZipFill size={28} className="text-warning" />;
    return <BsFileEarmarkFill size={28} className="text-base-content/60" />;
  };

  return (
    <div
      id={`msg-${msg._id}`}
      className={`flex items-end gap-2 mb-1.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${
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
            image: msg.image || msg.mediaUrl,
            senderName,
          });
        }
      }}
    >
      {/* Select Checkbox */}
      {selectMode && (
        <div className="flex items-center self-center px-1">
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
              <IoBanSharp size={14}  />
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

              {/* 0. View-Once Media Pill (PRD Section 34) */}
              {msg.isViewOnce && (
                (() => {
                  const isOpened = isMe
                    ? (msg.viewedBy && msg.viewedBy.length > 0)
                    : (msg.viewedBy && msg.viewedBy.some((v) => (v._id || v).toString() === loggedInUser?._id?.toString()));

                  if (isOpened) {
                    return (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/5 text-base-content/60 select-none mb-1">
                        <div className="w-5 h-5 rounded-full border border-dashed border-base-content/40 flex items-center justify-center text-[10px] font-bold">
                          1
                        </div>
                        <span className="text-xs italic font-medium">Opened</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      onClick={() => {
                        if (!isMe && onOpenViewOnce) {
                          onOpenViewOnce(msg);
                        }
                      }}
                      className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all select-none mb-1 ${
                        isMe
                          ? "bg-black/10 text-base-content/80 cursor-default"
                          : "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer active:scale-95 shadow-xs"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-[10px] font-bold shadow-xs">
                        1
                      </div>
                      <span className="text-xs font-semibold">
                        {msg.mediaType === "video" ? "Video" : "Photo"}
                      </span>
                      {!isMe && (
                        <span className="text-[10px] opacity-70 ml-1">Tap to open</span>
                      )}
                    </div>
                  );
                })()
              )}

              {/* 1. Voice Note or Audio File (PRD Section 29 & 30) */}
              {(msg.mediaType === "voice" || msg.mediaType === "audio") && (
                <div className="mb-1.5">
                  <AudioPlayer
                    src={msg.mediaUrl || msg.image}
                    isVoice={msg.mediaType === "voice"}
                    initialDuration={msg.duration}
                    isMe={isMe}
                  />
                </div>
              )}

              {/* 2. Video in Chat (PRD Section 28 - allowed in chats, NOT in status) */}
              {!msg.isViewOnce && msg.mediaType === "video" && (
                <div className="mb-2 rounded-xl overflow-hidden shadow-xs bg-black">
                  <video
                    controls
                    preload="metadata"
                    src={msg.mediaUrl || msg.image}
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              )}

              {/* 3. Document Attachment Card (PRD Section 31) */}
              {msg.mediaType === "document" && (
                <a
                  href={msg.mediaUrl || msg.image}
                  target="_blank"
                  rel="noreferrer"
                  download={msg.fileName || "attachment"}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-base-200/80 hover:bg-base-200 border border-base-300/60 mb-2 transition-colors cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-base-100 flex-shrink-0 shadow-xs">
                    {getDocIcon(msg.fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate group-hover:underline">
                      {msg.fileName || "Document"}
                    </p>
                    <p className="text-[10px] text-base-content/60">
                      {formatFileSize(msg.fileSize)}
                    </p>
                  </div>
                  <div className="p-2 rounded-full hover:bg-base-300 text-base-content/60">
                    <BsDownload size={14} />
                  </div>
                </a>
              )}

              {/* 4. Image Attachment (PRD Section 27) */}
              {!msg.isViewOnce &&
                (!msg.mediaType || msg.mediaType === "image") &&
                (msg.mediaUrl || msg.image) && (
                  <img
                    src={msg.mediaUrl || msg.image}
                    alt="Attachment"
                    className="max-w-full rounded-xl mb-2 object-cover max-h-80"
                  />
                )}

              {/* 5. Poll Widget (PRD Section 47) */}
              {msg.mediaType === "poll" && (
                <PollCard
                  message={msg}
                  loggedInUser={loggedInUser}
                  selectedChat={selectedChat}
                />
              )}

              {/* 6. Location Card (PRD Section 32) */}
              {msg.mediaType === "location" && msg.location && (
                <a
                  href={`https://www.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-base-300 bg-base-200/50 mb-2 hover:opacity-95 transition-opacity"
                >
                  <div className="w-full h-32 bg-base-300 relative overflow-hidden flex items-center justify-center">
                    <iframe
                      title="Location map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, pointerEvents: "none" }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.location.longitude - 0.008}%2C${msg.location.latitude - 0.008}%2C${msg.location.longitude + 0.008}%2C${msg.location.latitude + 0.008}&layer=mapnik&marker=${msg.location.latitude}%2C${msg.location.longitude}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg">
                        <BsGeoAltFill size={15} />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h5 className="font-bold text-xs text-base-content truncate">
                      {msg.location.name || "Live Location"}
                    </h5>
                    <p className="text-[10px] text-primary hover:underline mt-0.5">
                      Open in Google Maps ↗
                    </p>
                  </div>
                </a>
              )}

              {/* 7. Contact Card (PRD Section 33) */}
              {msg.mediaType === "contact" && msg.contactCard && (
                <div className="p-3 rounded-xl bg-base-200/80 border border-base-300/80 mb-2 flex items-center gap-3 min-w-56">
                  <img
                    src={
                      msg.contactCard.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.contactCard.name}`
                    }
                    alt={msg.contactCard.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs truncate">
                      {msg.contactCard.name}
                    </h4>
                    <p className="text-[11px] text-base-content/60 truncate">
                      {msg.contactCard.phone || msg.contactCard.email || "Contact"}
                    </p>
                  </div>
                </div>
              )}

              {/* 8. Event Card (PRD Section 47) */}
              {msg.mediaType === "event" && msg.event && (
                <EventCard
                  message={msg}
                  loggedInUser={loggedInUser}
                  onRespond={onRespondEvent}
                />
              )}

              {/* 9. Text — with search highlight & group @mentions (PRD Section 45) */}
              {msg.mediaType !== "poll" &&
                msg.mediaType !== "location" &&
                msg.mediaType !== "contact" &&
                msg.mediaType !== "event" &&
                msg.text &&
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
                  <span className="whitespace-pre-wrap break-words">
                    {msg.text.split(/(@[A-Za-z0-9_]+)/g).map((part, pIdx) => {
                      if (part.startsWith("@")) {
                        const namePart = part.slice(1).trim();
                        const isMeMentioned =
                          loggedInUser?.name &&
                          namePart.toLowerCase() === loggedInUser.name.toLowerCase();
                        return (
                          <span
                            key={pIdx}
                            className={`font-semibold rounded px-1 py-0.5 inline-block ${
                              isMeMentioned
                                ? "bg-primary text-primary-content font-bold shadow-xs"
                                : "text-primary hover:underline cursor-pointer"
                            }`}
                          >
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </span>
                ))}
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
                  <BsCheck className="text-primary-content/60" />
                )}
                {msg.status === "delivered" && (
                  <BsCheckAll className="text-primary-content/60" />
                )}
                {msg.status === "read" && (
                  <BsCheckAll className="text-info" />
                )}
              </span>
            )}
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default MessageBubble;
