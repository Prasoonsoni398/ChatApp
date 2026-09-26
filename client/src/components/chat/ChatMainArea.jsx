import React from "react";
import { BsSearch, BsX, BsPinAngleFill } from "react-icons/bs";
import { IoReturnUpForwardOutline } from "react-icons/io5";
import ChatHeader from "./ChatHeader.jsx";
import MessageList from "./MessageList.jsx";
import ChatInputArea from "./ChatInputArea.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";

const ChatMainArea = ({
  state,
  onlineUsersMap,
  webRTC,
  lockedChatIds,
  handleToggleLockChat,
  archivedChatIds,
  handleToggleArchiveChat,
  mutedChatIds,
  handleToggleMuteChat,
  setShowStarredModal,
  setShowGroupInviteModal,
  blockedUserIds,
  handleToggleBlockContact,
  setShowReportModal,
  setShowGroupInfoModal,
  setShowContactInfoModal,
  currentPinned,
  reactionMapByMsgId,
  handleReact,
  handleContextMenu,
  otherUserTyping,
  handleOpenViewOnce,
  handleRespondEvent,
  selectedFile,
  setSelectedFile,
  handleImageSelect,
  handleSendMessage,
  handleSendVoice,
  handleTypingEvent,
  handleInsertMention,
  setShowCreatePollModal,
  setShowCreateEventModal,
  setShowLocationModal,
  setShowContactModal,
}) => {
  return (
    <div
      className={`flex-1 flex flex-col relative bg-base-200 overflow-hidden ${
        !state.selectedChat ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Subtle Chat Wallpaper Pattern adapting to any FlyonUI theme */}
      <div className="absolute inset-0 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center opacity-[0.05] pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1 h-full overflow-hidden">
        {state.selectedChat ? (
          <>
            <ChatHeader
              selectedChat={state.selectedChat}
              setSelectedChat={state.setSelectedChat}
              onlineUsersMap={onlineUsersMap}
              showMsgSearch={state.showMsgSearch}
              setShowMsgSearch={state.setShowMsgSearch}
              setMsgSearchQuery={state.setMsgSearchQuery}
              setMsgSearchIndex={state.setMsgSearchIndex}
              showHeaderMenu={state.showHeaderMenu}
              setShowHeaderMenu={state.setShowHeaderMenu}
              headerMenuRef={state.headerMenuRef}
              setSelectMode={state.setSelectMode}
              setSelectedMessageIds={state.setSelectedMessageIds}
              currentPinned={currentPinned}
              messages={state.messages}
              setMessages={state.setMessages}
              showPinnedBanner={state.showPinnedBanner}
              setShowPinnedBanner={state.setShowPinnedBanner}
              clearUndoTimeoutRef={state.clearUndoTimeoutRef}
              setClearedMessagesBackup={state.setClearedMessagesBackup}
              setShowClearUndoBanner={state.setShowClearUndoBanner}
              startCall={webRTC.startCall}
              onOpenStarred={() => setShowStarredModal(true)}
              isChatLocked={Boolean(
                state.selectedChat &&
                  lockedChatIds.includes(state.selectedChat.id),
              )}
              onToggleLockChat={() => handleToggleLockChat(state.selectedChat.id)}
              isChatArchived={Boolean(
                state.selectedChat &&
                  archivedChatIds.includes(state.selectedChat.id),
              )}
              onToggleArchiveChat={handleToggleArchiveChat}
              isChatMuted={Boolean(
                state.selectedChat &&
                  mutedChatIds.includes(state.selectedChat.id),
              )}
              onToggleMuteChat={() => handleToggleMuteChat(state.selectedChat.id)}
              onOpenGroupInvite={() => setShowGroupInviteModal(true)}
              isContactBlocked={Boolean(
                state.selectedChat &&
                  blockedUserIds.includes(state.selectedChat.id),
              )}
              onToggleBlockContact={() =>
                handleToggleBlockContact(state.selectedChat.id)
              }
              onOpenReport={() => setShowReportModal(true)}
              onOpenInfo={() => {
                if (state.selectedChat?.isGroup) {
                  setShowGroupInfoModal(true);
                } else {
                  setShowContactInfoModal(true);
                }
              }}
            />

            {/* In-chat Search Bar */}
            {state.showMsgSearch && (
              <div className="flex items-center gap-2 px-4 py-2 bg-base-100 border-b border-base-300">
                <div className="flex-1 relative">
                  <BsSearch
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={state.msgSearchQuery}
                    onChange={(e) => {
                      state.setMsgSearchQuery(e.target.value);
                      state.setMsgSearchIndex(0);
                    }}
                    placeholder="Search in this chat…"
                    className="input input-sm input-bordered w-full pl-9 bg-base-200"
                    onKeyDown={(e) => {
                      if (!state.msgSearchQuery.trim()) return;
                      const matches = state.messages.filter((m) =>
                        m.text
                          ?.toLowerCase()
                          .includes(state.msgSearchQuery.toLowerCase()),
                      );
                      if (matches.length === 0) return;
                      let nextIdx = state.msgSearchIndex;
                      if (e.key === "Enter" || e.key === "ArrowDown")
                        nextIdx = (state.msgSearchIndex + 1) % matches.length;
                      else if (e.key === "ArrowUp")
                        nextIdx =
                          (state.msgSearchIndex - 1 + matches.length) %
                          matches.length;
                      state.setMsgSearchIndex(nextIdx);
                      const el = document.getElementById(
                        `msg-${matches[nextIdx]._id}`,
                      );
                      el?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      el?.classList.add("ring-2", "ring-primary", "rounded-xl");
                      setTimeout(
                        () =>
                          el?.classList.remove(
                            "ring-2",
                            "ring-primary",
                            "rounded-xl",
                          ),
                        1500,
                      );
                    }}
                  />
                </div>
                {state.msgSearchQuery.trim() && (
                  <span className="text-xs text-base-content/50 whitespace-nowrap">
                    {(() => {
                      const c = state.messages.filter((m) =>
                        m.text
                          ?.toLowerCase()
                          .includes(state.msgSearchQuery.toLowerCase()),
                      ).length;
                      return c > 0
                        ? `${state.msgSearchIndex + 1}/${c}`
                        : "0 results";
                    })()}
                  </span>
                )}
                <button
                  onClick={() => {
                    state.setShowMsgSearch(false);
                    state.setMsgSearchQuery("");
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
                >
                  <BsX size={18} />
                </button>
              </div>
            )}

            {/* Pinned Banner */}
            {currentPinned &&
              state.showPinnedBanner &&
              !currentPinned.isDeletedForEveryone && (
                <div
                  className="flex items-center gap-3 px-4 py-2 bg-base-100/90 border-b border-base-300 cursor-pointer hover:bg-base-200/50 animate-slide-up shadow-sm"
                  onClick={() =>
                    document
                      .getElementById(`msg-${currentPinned._id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                >
                  <BsPinAngleFill className="text-primary" size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">
                      Pinned Message
                    </p>
                    <p className="text-xs text-base-content/70 truncate">
                      {currentPinned.text || "📷 Image"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      state.setShowPinnedBanner(false);
                    }}
                    className="text-base-content/40 hover:text-base-content/70"
                  >
                    <BsX size={18} />
                  </button>
                </div>
              )}

            {/* Select Toolbar */}
            {state.selectMode && state.selectedMessageIds.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-content animate-slide-down">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      state.setSelectMode(false);
                      state.setSelectedMessageIds([]);
                    }}
                    className="hover:bg-primary-focus p-1 rounded-full transition-colors cursor-pointer"
                    title="Cancel selection (Esc)"
                  >
                    <BsX size={22} />
                  </button>
                  <span className="font-semibold select-none">
                    {state.selectedMessageIds.length} selected
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => {
                      state.setForwardMessage("__multi__");
                      state.setShowForwardModal(true);
                    }}
                    className="btn btn-sm btn-ghost text-primary-content hover:bg-black/10"
                    title="Forward selected"
                  >
                    <IoReturnUpForwardOutline size={18} />
                  </button>
                  <RemoveActionButton
                    onClick={() => {
                      if (state.selectedMessageIds.length === 0) return;
                      state.setDeleteMessageId("__multi__");
                      state.setDeleteIsMe(false);
                      state.setShowDeleteModal(true);
                    }}
                    variant="circle"
                    size="sm"
                    title="Delete selected messages"
                  />
                </div>
              </div>
            )}

            <MessageList
              messages={state.messages}
              loggedInUser={state.loggedInUser}
              selectedChat={state.selectedChat}
              selectMode={state.selectMode}
              selectedMessageIds={state.selectedMessageIds}
              msgSearchQuery={state.msgSearchQuery}
              reactionMapByMsgId={reactionMapByMsgId}
              hoveredMsgId={state.hoveredMsgId}
              setHoveredMsgId={state.setHoveredMsgId}
              showFullEmojiForMsg={state.showFullEmojiForMsg}
              setShowFullEmojiForMsg={state.setShowFullEmojiForMsg}
              handleReact={handleReact}
              handleContextMenu={handleContextMenu}
              toggleSelectMessage={(id) =>
                state.setSelectedMessageIds((prev) => {
                  const isCurrentlySelected = prev.includes(id);
                  const next = isCurrentlySelected
                    ? prev.filter((i) => i !== id)
                    : [...prev, id];
                  if (isCurrentlySelected && next.length === 0) {
                    state.setSelectMode(false);
                  }
                  return next;
                })
              }
              setReplyingTo={state.setReplyingTo}
              reactionTimeoutRef={state.reactionTimeoutRef}
              messagesEndRef={state.messagesEndRef}
              otherUserTyping={otherUserTyping}
              onOpenViewOnce={handleOpenViewOnce}
              onRespondEvent={handleRespondEvent}
            />

            {/* Clear Chat Undo Banner */}
            {state.showClearUndoBanner && (
              <div className="mx-4 my-2 p-3 bg-base-100 rounded-xl shadow-lg border border-base-300 flex items-center justify-between animate-fade-in relative z-10">
                <span className="text-sm">
                  Messages cleared from this device.
                </span>
                <button
                  onClick={() => {
                    state.setMessages(state.clearedMessagesBackup);
                    state.setClearedMessagesBackup(null);
                    state.setShowClearUndoBanner(false);
                    if (state.clearUndoTimeoutRef.current)
                      clearTimeout(state.clearUndoTimeoutRef.current);
                  }}
                  className="btn btn-sm btn-primary px-4 rounded-lg shadow-sm"
                >
                  Undo
                </button>
              </div>
            )}

            {/* Blocked Contact Warning Banner */}
            {!state.selectedChat.isGroup &&
            blockedUserIds.includes(state.selectedChat.id) ? (
              <div className="p-4 bg-base-200/90 border-t border-base-300 text-center flex flex-col items-center justify-center gap-1.5 z-20">
                <p className="text-xs text-base-content/70">
                  You blocked this contact. Tap below to unblock and resume chatting.
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleBlockContact(state.selectedChat.id)}
                  className="btn btn-sm btn-outline btn-primary rounded-xl"
                >
                  Unblock Contact
                </button>
              </div>
            ) : (
              <ChatInputArea
                message={state.message}
                setMessage={state.setMessage}
                selectedImage={state.selectedImage}
                setSelectedImage={state.setSelectedImage}
                imagePreview={state.imagePreview}
                setImagePreview={state.setImagePreview}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                replyingTo={state.replyingTo}
                setReplyingTo={state.setReplyingTo}
                editingMessageId={state.editingMessageId}
                setEditingMessageId={state.setEditingMessageId}
                showEmojiPicker={state.showEmojiPicker}
                setShowEmojiPicker={state.setShowEmojiPicker}
                emojiPickerRef={state.emojiPickerRef}
                emojiToggleBtnRef={state.emojiToggleBtnRef}
                fileInputRef={state.fileInputRef}
                handleImageSelect={handleImageSelect}
                handleSendMessage={handleSendMessage}
                handleSendVoice={handleSendVoice}
                handleTypingEvent={handleTypingEvent}
                showMentionPopup={state.showMentionPopup}
                mentionFilter={state.mentionFilter}
                selectedChat={state.selectedChat}
                loggedInUser={state.loggedInUser}
                handleInsertMention={handleInsertMention}
                onOpenCreatePoll={() => setShowCreatePollModal(true)}
                onOpenCreateEvent={() => setShowCreateEventModal(true)}
                onOpenLocationShare={() => setShowLocationModal(true)}
                onOpenContactShare={() => setShowContactModal(true)}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-100/50 backdrop-blur-sm">
            <div className="w-64 h-64 mb-8 opacity-40 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png')] bg-no-repeat bg-contain bg-center"></div>
            <h1 className="text-3xl font-light text-base-content mb-4">
              ChatApp Web
            </h1>
            <p className="text-base-content/60 max-w-md">
              Send and receive messages without keeping your phone online.
              <br />
              Use ChatApp on up to 4 linked devices and 1 phone at the same
              time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMainArea;
