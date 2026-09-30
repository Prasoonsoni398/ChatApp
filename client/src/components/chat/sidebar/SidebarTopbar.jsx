import { useState } from "react";
import {
  BsPeopleFill,
  BsThreeDotsVertical,
  BsPersonCircle,
  BsGearFill,
  BsLaptop,
  BsKeyboardFill,
  BsArrowLeft,
  BsMegaphoneFill,
  BsPersonPlusFill,
  BsArrowClockwise,
} from "react-icons/bs";
import { hoverPrimary } from "../../../constants/styles.js";

const SidebarTopbar = ({
  isArchivedViewOpen,
  setIsArchivedViewOpen,
  archivedChatsCount,
  loggedInUser,
  onOpenNewChat,
  setShowCreateGroup,
  showProfileMenu,
  setShowProfileMenu,
  profileMenuRef,
  setEditName,
  setShowEditModal,
  onOpenPrivacySettings,
  onOpenChannels,
  onOpenLinkedDevices,
  onOpenShortcuts,
  handleLogout,
  onRefreshChats,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshChats) await onRefreshChats();
    } catch (_e) {}
    setTimeout(() => setIsRefreshing(false), 800);
  };
  if (isArchivedViewOpen) {
    return (
      <div className="h-16 px-4 flex items-center gap-3 bg-base-200/50 border-b border-b-theme-soothing relative z-50">
        <button
          onClick={() => setIsArchivedViewOpen(false)}
          className="p-2 -ml-2 text-base-content/70 hover:text-primary rounded-full transition-colors"
          title="Back to chats"
        >
          <BsArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">Archived</h3>
          <p className="text-[11px] text-base-content/50">
            {archivedChatsCount} {archivedChatsCount === 1 ? "chat" : "chats"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-b-theme-soothing relative z-50">
      <div
        className="flex items-center gap-3 cursor-pointer group select-none"
        onClick={() => onOpenPrivacySettings?.()}
        title="Open Settings"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden transition-transform duration-200 group-hover:scale-105 active:scale-95 group-hover:ring-2 group-hover:ring-primary/60">
          <img
            src={
              loggedInUser?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`
            }
            alt="me"
            className="rounded-full object-cover w-full h-full"
          />
        </div>
        <div>
          <span className="font-semibold block leading-tight text-sm group-hover:text-primary transition-colors">
            {loggedInUser?.name}
          </span>
          <span className="text-[11px] text-base-content/50">Online</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-base-content/60">
        {/* Refresh Chats & Users button */}
        <button
          onClick={handleRefresh}
          className={`${hoverPrimary} p-1.5 rounded-full transition-transform active:scale-90 ${
            isRefreshing ? "animate-spin text-primary" : ""
          }`}
          title="Sync chats and contacts"
          disabled={isRefreshing}
        >
          <BsArrowClockwise size={18} />
        </button>

        {/* New Chat — add-person icon */}
        <button
          onClick={() => onOpenNewChat?.()}
          className={hoverPrimary}
          title="New chat"
        >
          <BsPersonPlusFill size={18} />
        </button>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className={hoverPrimary}
            title="Menu"
          >
            <BsThreeDotsVertical size={18} />
          </button>
          {showProfileMenu && (
            <ul className="absolute right-0 z-50 menu p-2 shadow-xl text-sm bg-base-100 rounded-2xl w-52 border border-base-300 mt-2 animate-slide-up origin-top-right">
              {/* Primary actions */}
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenNewChat?.();
                  }}
                  className="flex items-center gap-2 py-2 text-primary font-medium"
                >
                  <BsPersonPlusFill size={15} /> New Chat
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowCreateGroup(true);
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsPeopleFill size={15} /> New Group
                </a>
              </li>
              <div className="divider my-1" />
              {/* Profile & account */}
              <li>
                <a
                  onClick={() => {
                    setEditName(loggedInUser?.name || "");
                    setShowEditModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsPersonCircle size={15} /> Edit Profile
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenLinkedDevices?.();
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsLaptop size={15} /> Linked Devices
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenShortcuts?.();
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsKeyboardFill size={15} /> Shortcuts
                </a>
              </li>
              <div className="divider my-1" />
              {/* Navigation */}
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenPrivacySettings?.();
                  }}
                  className="flex items-center gap-2 py-2 font-medium"
                >
                  <BsGearFill size={15} className="text-primary" /> Settings
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenChannels?.();
                  }}
                  className="flex items-center gap-2 py-2 text-primary font-medium"
                >
                  <BsMegaphoneFill size={15} /> Channels &amp; Broadcast
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarTopbar;
