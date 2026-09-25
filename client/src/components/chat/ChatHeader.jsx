import {
  BsSearch,
  BsThreeDotsVertical,
  BsArrowLeft,
  BsPeopleFill,
  BsCheckSquare,
  BsPinAngleFill,
  BsStarFill,
  BsTrash,
  BsCameraVideo,
  BsTelephone,
  BsLockFill,
  BsUnlockFill,
  BsArchive,
  BsArchiveFill,
  BsBell,
  BsBellSlash,
  BsLink45Deg,
  BsSlashCircle,
  BsShieldExclamation,
  BsDownload,
  BsPersonFill,
} from "react-icons/bs";
import * as messageService from "../../services/messageService.js";
import { exportChatToTxt } from "../../utils/exportChat.js";

/**
 * ChatHeader – the h-16 top bar shown when a chat is open.
 * Displays avatar, name, online/member status, search toggle, and the
 * 3-dot header menu (search, select, pinned, starred, clear chat).
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
  setShowPinnedBanner,
  clearUndoTimeoutRef,
  setClearedMessagesBackup,
  setShowClearUndoBanner,
  startCall,
  onOpenStarred,
  isChatLocked,
  onToggleLockChat,
  isChatArchived,
  onToggleArchiveChat,
  isChatMuted,
  onToggleMuteChat,
  onOpenGroupInvite,
  isContactBlocked,
  onToggleBlockContact,
  onOpenReport,
  onOpenInfo,
}) => {
  return (
    <div className="h-16 px-2 sm:px-4 flex items-center bg-base-100 border-b border-base-300 shadow-sm z-20">
      {/* Back button — mobile only */}
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-base-content/70 hover:text-primary rounded-full hover:bg-base-200 transition-colors flex-shrink-0 mr-1"
        onClick={() => setSelectedChat(null)}
        title="Back to chats"
      >
        <BsArrowLeft size={19} />
      </button>

      {/* Clickable Avatar & Name container (Guftgu Contact/Group Info) */}
      <div
        className="flex items-center flex-1 min-w-0 cursor-pointer hover:opacity-85 transition-opacity mr-2"
        onClick={() => onOpenInfo?.()}
        title="Click to view info and settings"
      >
        <div className="avatar flex-shrink-0 mr-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-xs">
            <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-1 overflow-hidden">
          <h2 className="font-semibold text-sm sm:text-base leading-tight truncate flex items-center gap-1">
            <span className="truncate">
              {selectedChat.customName ||
                selectedChat.displayName ||
                selectedChat.name}
            </span>
            {selectedChat.isGroup && (
              <BsPeopleFill size={13} className="text-primary flex-shrink-0" />
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {selectedChat.isGroup ? (
              <span className="text-[11px] sm:text-xs text-base-content/60 truncate block">
                {selectedChat.members?.length} members · tap for info
              </span>
            ) : onlineUsersMap[selectedChat.id] ? (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-success font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0"></span>
                Online
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs text-base-content/60 block">Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 text-base-content/60 flex-shrink-0 ml-auto">
        {/* Call Buttons */}
        <button
          onClick={() => startCall(selectedChat, "video")}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:text-primary rounded-full hover:bg-base-200 transition-colors active:scale-95"
          title="Video Call"
        >
          <BsCameraVideo size={16} />
        </button>
        <button
          onClick={() => startCall(selectedChat, "voice")}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:text-primary rounded-full hover:bg-base-200 transition-colors active:scale-95"
          title="Voice Call"
        >
          <BsTelephone size={16} />
        </button>

        {/* Search button — Desktop only (accessible via 3-dot menu on mobile) */}
        <button
          onClick={() => {
            setShowMsgSearch((v) => !v);
            setMsgSearchQuery("");
            setMsgSearchIndex(0);
          }}
          className={`hidden md:flex w-9 h-9 items-center justify-center hover:text-primary rounded-full hover:bg-base-200 transition-colors active:scale-95 ${
            showMsgSearch ? "text-primary bg-primary/10 shadow-inner" : ""
          }`}
          title="Search Messages"
        >
          <BsSearch size={16} />
        </button>

        {/* 3-dot menu */}
        <div className="relative" ref={headerMenuRef}>
          <button
            onClick={() => setShowHeaderMenu((v) => !v)}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:text-primary rounded-full hover:bg-base-200 transition-colors active:scale-95 ${
              showHeaderMenu ? "text-primary bg-primary/10 shadow-inner" : ""
            }`}
            title="More Options"
          >
            <BsThreeDotsVertical size={16} />
          </button>

          {showHeaderMenu && (
            <ul className="absolute right-0 top-full mt-1 z-[200] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-300 animate-slide-up origin-top-right">
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    onOpenInfo?.();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2 font-medium"
                >
                  {selectedChat.isGroup ? (
                    <>
                      <BsPeopleFill className="text-primary" /> Group Info
                    </>
                  ) : (
                    <>
                      <BsPersonFill className="text-primary" /> Contact Info
                    </>
                  )}
                </a>
              </li>
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
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                    className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <BsPinAngleFill /> Pinned Message
                  </a>
                </li>
              )}
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (onOpenStarred) onOpenStarred();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <BsStarFill className="text-warning" /> Starred Messages
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (onToggleLockChat) onToggleLockChat();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  {isChatLocked ? (
                    <>
                      <BsUnlockFill className="text-primary" /> Unlock Chat
                    </>
                  ) : (
                    <>
                      <BsLockFill className="text-primary" /> Lock Chat
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (onToggleArchiveChat) onToggleArchiveChat();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  {isChatArchived ? (
                    <>
                      <BsArchiveFill className="text-primary" /> Unarchive Chat
                    </>
                  ) : (
                    <>
                      <BsArchive className="text-primary" /> Archive Chat
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (onToggleMuteChat) onToggleMuteChat();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  {isChatMuted ? (
                    <>
                      <BsBell className="text-primary" /> Unmute Notifications
                    </>
                  ) : (
                    <>
                      <BsBellSlash className="text-primary" /> Mute
                      Notifications
                    </>
                  )}
                </a>
              </li>
              {selectedChat.isGroup && (
                <li>
                  <a
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (onOpenGroupInvite) onOpenGroupInvite();
                    }}
                    className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <BsLink45Deg className="text-primary" size={18} /> Invite
                    via Link
                  </a>
                </li>
              )}
              {!selectedChat.isGroup && (
                <li>
                  <a
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (onToggleBlockContact) onToggleBlockContact();
                    }}
                    className="py-2.5 active:scale-95 transition-transform flex items-center gap-2 text-error"
                  >
                    <BsSlashCircle size={15} />{" "}
                    {isContactBlocked ? "Unblock Contact" : "Block Contact"}
                  </a>
                </li>
              )}
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    if (onOpenReport) onOpenReport();
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2 text-error"
                >
                  <BsShieldExclamation size={15} /> Report{" "}
                  {selectedChat.isGroup ? "Group" : "Contact"}
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowHeaderMenu(false);
                    const loggedInUser = JSON.parse(
                      localStorage.getItem("user") || "null",
                    );
                    exportChatToTxt(selectedChat, messages, loggedInUser);
                  }}
                  className="py-2.5 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <BsDownload className="text-primary" size={15} /> Export Chat
                </a>
              </li>
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
                  className="text-error bg-error/10 hover:bg-error/20 font-medium py-2 px-3 rounded-xl active:scale-95 transition-all flex items-center gap-2"
                >
                  <BsTrash size={15} className="text-error" /> Clear Chat
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
