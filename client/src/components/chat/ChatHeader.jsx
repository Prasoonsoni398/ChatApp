import React from "react";
import {
  BsSearch,
  BsThreeDotsVertical,
  BsArrowLeft,
  BsPeopleFill,
  BsCheckSquare,
  BsPinAngleFill,
  BsTrash,
} from "react-icons/bs";
import * as messageService from "../../services/messageService.js";

/**
 * ChatHeader – the h-16 top bar shown when a chat is open.
 * Displays avatar, name, online/member status, search toggle, and the
 * 3-dot header menu (search, select, pinned, clear chat).
 */
const ChatHeader = ({
  selectedChat,
  setSelectedChat,
  onlineUsersMap,
  showMsgSearch,
  setShowMsgSearch,
  setMsgSearchQuery,
  setMsgSearchIndex,
  showHeaderMenu,
  setShowHeaderMenu,
  headerMenuRef,
  setSelectMode,
  setSelectedMessageIds,
  currentPinned,
  messages,
  setMessages,
  showPinnedBanner,
  setShowPinnedBanner,
  clearUndoTimeoutRef,
  setClearedMessagesBackup,
  setShowClearUndoBanner,
}) => {
  return (
    <div className="h-16 px-4 flex items-center gap-3 bg-base-100 border-b border-base-300 shadow-sm z-20">
      {/* Back button — mobile only */}
      <button
        className="md:hidden p-2 -ml-2 text-base-content/60 hover:text-primary"
        onClick={() => setSelectedChat(null)}
      >
        <BsArrowLeft size={24} />
      </button>

      {/* Avatar */}
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={selectedChat.avatar} alt={selectedChat.name} />
        </div>
      </div>

      {/* Name + status */}
      <div className="flex-1">
        <h2 className="font-semibold flex items-center gap-1.5">
          {selectedChat.name}
          {selectedChat.isGroup && (
            <BsPeopleFill size={14} className="text-primary" />
          )}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          {selectedChat.isGroup ? (
            <span className="text-xs text-base-content/60">
              {selectedChat.members?.length} members
            </span>
          ) : onlineUsersMap[selectedChat.id] ? (
            <>
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="text-xs text-success font-medium">Online</span>
            </>
          ) : (
            <span className="text-xs text-base-content/60">Offline</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 text-base-content/60 items-center">
        {/* Search toggle */}
        <button
          onClick={() => {
            setShowMsgSearch((v) => !v);
            setMsgSearchQuery("");
            setMsgSearchIndex(0);
          }}
          className={`p-2 hover:text-primary rounded-lg transition-all duration-300 hover:bg-primary/10 hover:scale-110 active:scale-95 ${
            showMsgSearch ? "text-primary bg-primary/10 shadow-inner" : ""
          }`}
        >
          <BsSearch size={18} />
        </button>

        {/* 3-dot menu */}
        <div className="relative" ref={headerMenuRef}>
          <button
            onClick={() => setShowHeaderMenu((v) => !v)}
            className={`p-2 hover:text-primary rounded-lg transition-all duration-300 hover:bg-primary/10 hover:scale-110 active:scale-95 ${
              showHeaderMenu ? "text-primary bg-primary/10 shadow-inner" : ""
            }`}
          >
            <BsThreeDotsVertical size={18} />
          </button>

          {showHeaderMenu && (
            <ul className="absolute right-0 top-full mt-1 z-[200] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-300 animate-slide-up origin-top-right">
              <li>
                <a
                  onClick={() => {
                    setShowMsgSearch(true);
                    setShowHeaderMenu(false);
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <BsSearch /> Search Messages
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setSelectMode(true);
                    setSelectedMessageIds([]);
                    setShowHeaderMenu(false);
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <BsCheckSquare /> Select Messages
                </a>
              </li>
              {currentPinned && (
                <li>
                  <a
                    onClick={() => {
                      setShowPinnedBanner(true);
                      setShowHeaderMenu(false);
                      document
                        .getElementById(`msg-${currentPinned._id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <BsPinAngleFill /> Pinned Message
                  </a>
                </li>
              )}
              <div className="divider my-1"></div>
              <li>
                <a
                  onClick={() => {
                    if (messages.length === 0) {
                      setShowHeaderMenu(false);
                      return;
                    }
                    setClearedMessagesBackup([...messages]);
                    setMessages([]);
                    setShowHeaderMenu(false);
                    setShowClearUndoBanner(true);
                    if (clearUndoTimeoutRef.current)
                      clearTimeout(clearUndoTimeoutRef.current);
                    clearUndoTimeoutRef.current = setTimeout(async () => {
                      setShowClearUndoBanner(false);
                      setClearedMessagesBackup(null);
                      try {
                        await messageService.clearChat(selectedChat.id);
                      } catch (e) {
                        console.error("Error clearing chat from backend", e);
                      }
                    }, 4000);
                  }}
                  className="text-error py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <BsTrash /> Clear Chat
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
