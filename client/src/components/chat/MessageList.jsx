import React from "react";
import { BsEmojiSmile } from "react-icons/bs";
import MessageBubble from "./MessageBubble.jsx";

/**
 * MessageList – the scrollable container mapping over messages.
 * Includes the "No messages yet" placeholder, date separators, and typing indicator.
 */
const MessageList = ({
  messages,
  loggedInUser,
  selectedChat,
  selectMode,
  selectedMessageIds,
  msgSearchQuery,
  reactionMapByMsgId,
  hoveredMsgId,
  setHoveredMsgId,
  showFullEmojiForMsg,
  setShowFullEmojiForMsg,
  handleReact,
  handleContextMenu,
  toggleSelectMessage,
  setReplyingTo,
  reactionTimeoutRef,
  messagesEndRef,
  otherUserTyping,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
          <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center shadow-sm border border-base-300">
            <BsEmojiSmile size={32} className="text-primary/50" />
          </div>
          <p className="text-lg">No messages yet</p>
          <p className="text-sm">Say hello to {selectedChat.name}!</p>
        </div>
      ) : (
        messages
          .filter((msg) => !msg.deletedFor?.includes(loggedInUser?._id))
          .map((msg, idx, filteredMessages) => {
            const senderId = selectedChat.isGroup ? msg.senderId?._id : msg.senderId;
            const isMe =
              senderId === loggedInUser?._id ||
              (typeof msg.senderId === "object" && msg.senderId?._id === loggedInUser?._id);
            const senderName = selectedChat.isGroup
              ? msg.senderId?.name || "Member"
              : isMe
              ? loggedInUser.name
              : selectedChat.name;
            const senderAvatar = selectedChat.isGroup
              ? msg.senderId?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`
              : isMe
              ? loggedInUser?.avatar
              : selectedChat.avatar;

            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isSelected = selectedMessageIds.includes(msg._id);
            const isSearchMatch =
              msgSearchQuery.trim() &&
              msg.text?.toLowerCase().includes(msgSearchQuery.toLowerCase());

            const reactionMap = reactionMapByMsgId(msg);

            const prevMsg = filteredMessages[idx - 1];
            const showDateSep =
              idx === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(prevMsg?.createdAt).toDateString();

            return (
              <React.Fragment key={msg._id}>
                {showDateSep && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs bg-base-100/80 rounded-full px-3 py-1 text-base-content/50 shadow-sm">
                      {new Date(msg.createdAt).toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  isMe={isMe}
                  senderName={senderName}
                  senderAvatar={senderAvatar}
                  timeStr={timeStr}
                  isSelected={isSelected}
                  selectMode={selectMode}
                  isSearchMatch={isSearchMatch}
                  msgSearchQuery={msgSearchQuery}
                  reactionMap={reactionMap}
                  loggedInUser={loggedInUser}
                  selectedChat={selectedChat}
                  hoveredMsgId={hoveredMsgId}
                  setHoveredMsgId={setHoveredMsgId}
                  showFullEmojiForMsg={showFullEmojiForMsg}
                  setShowFullEmojiForMsg={setShowFullEmojiForMsg}
                  handleReact={handleReact}
                  handleContextMenu={handleContextMenu}
                  toggleSelectMessage={toggleSelectMessage}
                  setReplyingTo={setReplyingTo}
                  reactionTimeoutRef={reactionTimeoutRef}
                />
              </React.Fragment>
            );
          })
      )}

      {/* Typing indicator */}
      {otherUserTyping && (
        <div className="flex items-end gap-2 mb-1">
          <img
            src={selectedChat.avatar}
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <div className="bg-base-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <span className="flex items-center gap-1 h-4">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 bg-base-content/40 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
