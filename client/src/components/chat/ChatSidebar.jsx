import { useState, useEffect, useRef } from "react";
import {
  BsSearch,
  BsThreeDotsVertical,
  BsPeopleFill,
  BsStarFill,
  BsLockFill,
  BsShieldLockFill,
  BsArchiveFill,
  BsBellSlashFill,
  BsArrowLeft,
  BsImage,
  BsCameraVideo,
  BsLink45Deg,
  BsFileEarmarkText,
  BsMicFill,
  BsBarChartFill,
  BsXCircleFill,
  BsGeoAltFill,
  BsPersonBadgeFill,
  BsLaptop,
  BsKeyboardFill,
  BsPersonPlusFill,
  BsPersonCircle,
  BsBoxArrowRight,
} from "react-icons/bs";
import * as messageService from "../../services/messageService.js";
import {
  hoverPrimary,
  searchInput,
  sidebarChat,
} from "../../constants/styles.js";

/**
 * ChatSidebar – WhatsApp-style left panel containing profile info,
 * filter chips (All, Unread, Favorites, Groups), global search input
 * with media categories (Photos, Videos, Links, Docs, Audio, Polls),
 * and the responsive scrollable list of chats and message search results.
 */
const ChatSidebar = ({
  loggedInUser,
  chats,
  searchQuery,
  setSearchQuery,
  selectedChat,
  setSelectedChat,
  showProfileMenu,
  setShowProfileMenu,
  profileMenuRef,
  handleLogout,
  setShowEditModal,
  setShowCreateGroup,
  setEditName,
  lockedChatIds = [],
  isLockedSectionUnlocked = false,
  onOpenLockedChats,
  onOpenPrivacySettings,
  onOpenLinkedDevices,
  onOpenShortcuts,
  onAddContact,
  archivedChatIds = [],
  isArchivedViewOpen = false,
  setIsArchivedViewOpen,
  mutedChatIds = [],
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchCategory, setSearchCategory] = useState("all");
  const [messageResults, setMessageResults] = useState([]);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchTimeoutRef = useRef(null);

  const filterChips = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "favorites", label: "Favorites" },
    { id: "groups", label: "Groups" },
  ];

  const mediaFilterChips = [
    { id: "photos", label: "Photos", icon: BsImage },
    { id: "videos", label: "Videos", icon: BsCameraVideo },
    { id: "links", label: "Links", icon: BsLink45Deg },
    { id: "documents", label: "Docs", icon: BsFileEarmarkText },
    { id: "audio", label: "Audio", icon: BsMicFill },
    { id: "polls", label: "Polls", icon: BsBarChartFill },
  ];

  const isGlobalSearchMode =
    Boolean(searchQuery && searchQuery.trim().length > 0) ||
    searchCategory !== "all";

  // Debounced search across messages & media
  useEffect(() => {
    if (!isGlobalSearchMode) {
      setMessageResults([]);
      setIsSearchingMessages(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearchingMessages(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await messageService.searchMessages(
          searchQuery,
          searchCategory,
        );
        setMessageResults(results || []);
      } catch (err) {
        console.error("Error searching messages:", err);
        setMessageResults([]);
      } finally {
        setIsSearchingMessages(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, searchCategory, isGlobalSearchMode]);

  // Handle clicking a search result message
  const handleSelectMessageResult = (msg) => {
    let targetChat = null;
    if (msg.groupId) {
      const gId =
        typeof msg.groupId === "object" ? msg.groupId._id : msg.groupId;
      targetChat = chats.find((c) => c.id === gId) || {
        id: gId,
        name: msg.groupId?.name || "Group",
        avatar: msg.groupId?.avatar || "",
        isGroup: true,
      };
    } else {
      const senderObjId =
        typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
      const isMe = String(senderObjId) === String(loggedInUser?._id);

      const otherObj = isMe ? msg.receiverId : msg.senderId;
      const otherId = typeof otherObj === "object" ? otherObj?._id : otherObj;

      targetChat = chats.find((c) => c.id === otherId) || {
        id: otherId,
        name: typeof otherObj === "object" ? otherObj?.name : "Chat",
        avatar: typeof otherObj === "object" ? otherObj?.avatar : "",
        isGroup: false,
      };
    }

    if (targetChat) {
      setSelectedChat(targetChat);
      setTimeout(() => {
        const el = document.getElementById(`msg-${msg._id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(
            "ring-2",
            "ring-primary",
            "rounded-xl",
            "transition-all",
          );
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary");
          }, 2500);
        }
      }, 400);
    }
  };

  // Helper to read draft from localStorage
  const getDraft = (chatId) => {
    try {
      return localStorage.getItem(`draft_${chatId}`) || "";
    } catch {
      return "";
    }
  };

  const isChatLocked = (chatId) => lockedChatIds.includes(chatId);
  const isChatArchived = (chatId) => archivedChatIds.includes(chatId);

  // Normal chats (exclude locked chats and archived chats from general stream)
  const regularChats = chats.filter(
    (c) => !isChatLocked(c.id) && !isChatArchived(c.id),
  );
  const lockedChats = chats.filter((c) => isChatLocked(c.id));
  const archivedChats = chats.filter((c) => isChatArchived(c.id));

  // Filter chats by search query and active chip
  const filteredChats = regularChats
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((c) => {
      if (activeFilter === "groups") return c.isGroup;
      if (activeFilter === "unread") return (c.unread || 0) > 0;
      if (activeFilter === "favorites") return Boolean(c.isFavorite);
      return true;
    });

  const filteredLockedChats = lockedChats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredArchivedChats = archivedChats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 h-full ${
        selectedChat ? "hidden md:flex" : "flex"
      }`}
    >
      {/* ── Top Header ── */}
      {isArchivedViewOpen ? (
        <div className="h-16 px-4 flex items-center gap-3 bg-base-200/50 border-b border-base-300 relative z-50">
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
              {archivedChats.length}{" "}
              {archivedChats.length === 1 ? "chat" : "chats"}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
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
              <span className="font-semibold block leading-tight text-sm">
                {loggedInUser?.name}
              </span>
              <span className="text-[11px] text-base-content/50">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base-content/60">
            {/* New Group */}
            <button
              onClick={() => setShowCreateGroup(true)}
              className={hoverPrimary}
              title="New Group"
            >
              <BsPeopleFill size={18} />
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
                <ul className="absolute right-0 z-50 menu p-2 shadow-xl text-sm bg-base-100 rounded-2xl w-46 border border-base-300 mt-2 animate-slide-up origin-top-right">
                  <li>
                    <a
                      onClick={() => {
                        setEditName(loggedInUser?.name || "");
                        setShowEditModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsPersonCircle size={14} className="text-primary" /> Edit
                      Profile
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => {
                        onAddContact?.();
                        setShowProfileMenu(false);
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsPersonPlusFill size={14} className="text-primary" />{" "}
                      New Contact
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => {
                        setShowCreateGroup(true);
                        setShowProfileMenu(false);
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsPeopleFill size={14} className="text-primary" /> New
                      Group
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenPrivacySettings?.();
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsShieldLockFill size={14} className="text-primary" />{" "}
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenLinkedDevices?.();
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsLaptop size={14} className="text-primary" /> Linked
                      Devices
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenShortcuts?.();
                      }}
                      className="active:scale-95 transition-transform flex items-center gap-2.5"
                    >
                      <BsKeyboardFill size={14} className="text-primary" />{" "}
                      Shortcuts
                    </a>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <a
                      onClick={handleLogout}
                      className="text-error active:scale-95 transition-transform flex items-center gap-2.5 font-medium"
                    >
                      <BsBoxArrowRight size={14} className="text-error" />{" "}
                      Logout
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="p-3 border-b border-base-300">
        <div className="relative flex items-center">
          <BsSearch
            size={14}
            className="absolute left-3 text-base-content/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat…"
            className={`${searchInput} pr-8`}
          />
          {(searchQuery || searchCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchCategory("all");
                setMessageResults([]);
                setIsSearchActive(false);
              }}
              className="absolute right-2.5 p-1 text-base-content/40 hover:text-base-content transition-colors"
              title="Clear search"
            >
              <BsXCircleFill size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Chips (GuftguMobile/Web Style) ── */}
      {isGlobalSearchMode || isSearchActive ? (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-base-300/60 overflow-x-auto scrollbar-none animate-fade-in">
          <button
            onClick={() => setSearchCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
              searchCategory === "all"
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-200 text-base-content/70 hover:bg-base-300"
            }`}
          >
            All
          </button>
          {mediaFilterChips.map((chip) => {
            const Icon = chip.icon;
            const isSelected = searchCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSearchCategory(isSelected ? "all" : chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-200 text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Icon size={12} />
                {chip.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300/60 overflow-x-auto scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                activeFilter === chip.id
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-200 text-base-content/70 hover:bg-base-300"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat List ── */}
      <div className="flex-1 overflow-y-auto">
        {isGlobalSearchMode ? (
          /* ── GLOBAL SEARCH RESULTS VIEW (PRD Section 35, 36) ── */
          <div>
            {isSearchingMessages ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-base-content/50">
                <span className="loading loading-spinner text-primary"></span>
                <span className="text-xs">Searching messages & media...</span>
              </div>
            ) : filteredChats.length === 0 && messageResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-base-content/50 gap-2">
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs text-base-content/40">
                  No chats or messages matching &ldquo;
                  {searchQuery || searchCategory}&rdquo;
                </p>
              </div>
            ) : (
              <div className="divide-y divide-base-200">
                {/* 1. MATCHING CHATS */}
                {filteredChats.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50 bg-base-200/40">
                      Chats ({filteredChats.length})
                    </div>
                    {filteredChats.map((chat) => {
                      const isSelected = selectedChat?.id === chat.id;
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`${sidebarChat} ${
                            isSelected
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "border-l-4 border-l-transparent"
                          }`}
                        >
                          <div className="avatar">
                            <div className="w-11 h-11 rounded-full relative">
                              <img src={chat.avatar} alt={chat.name} />
                              {chat.isGroup && (
                                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full p-1 shadow-sm">
                                  <BsPeopleFill size={10} />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h3 className="font-semibold text-sm truncate">
                                {chat.customName ||
                                  chat.displayName ||
                                  chat.name}
                              </h3>
                              <span className="text-[11px] text-base-content/50">
                                {chat.time}
                              </span>
                            </div>
                            <p className="text-xs text-base-content/60 truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. MATCHING MESSAGES ACROSS CHATS */}
                {messageResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50 bg-base-200/40 flex justify-between items-center">
                      <span>Messages</span>
                      <span className="badge badge-xs badge-ghost font-bold">
                        {messageResults.length}
                      </span>
                    </div>
                    {messageResults.map((msg) => {
                      const senderObj =
                        typeof msg.senderId === "object" ? msg.senderId : null;
                      const senderName =
                        String(senderObj?._id || msg.senderId) ===
                        String(loggedInUser?._id)
                          ? "You"
                          : senderObj?.name || "User";

                      const chatName = msg.groupId
                        ? typeof msg.groupId === "object"
                          ? msg.groupId.name
                          : "Group"
                        : String(senderObj?._id || msg.senderId) ===
                            String(loggedInUser?._id)
                          ? typeof msg.receiverId === "object"
                            ? msg.receiverId.name
                            : "Chat"
                          : senderName;

                      const chatAvatar = msg.groupId
                        ? typeof msg.groupId === "object"
                          ? msg.groupId.avatar
                          : ""
                        : String(senderObj?._id || msg.senderId) ===
                            String(loggedInUser?._id)
                          ? typeof msg.receiverId === "object"
                            ? msg.receiverId.avatar
                            : ""
                          : senderObj?.avatar;

                      const date = new Date(msg.createdAt || Date.now());
                      const timeStr = date.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <div
                          key={msg._id}
                          onClick={() => handleSelectMessageResult(msg)}
                          className={`${sidebarChat} hover:bg-base-200/70 border-l-4 border-l-transparent`}
                        >
                          <div className="avatar">
                            <div className="w-11 h-11 rounded-full relative">
                              <img
                                src={
                                  chatAvatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatName}`
                                }
                                alt={chatName}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h3 className="font-semibold text-sm truncate text-base-content">
                                {chatName}
                              </h3>
                              <span className="text-[11px] text-base-content/50">
                                {timeStr}
                              </span>
                            </div>
                            <div className="text-xs text-base-content/70 truncate flex items-center gap-1.5">
                              <span className="font-medium text-base-content/90">
                                {senderName}:
                              </span>
                              {msg.mediaType === "image" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsImage size={11} /> Photo{" "}
                                  {msg.text ? `• ${msg.text}` : ""}
                                </span>
                              ) : msg.mediaType === "video" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsCameraVideo size={11} /> Video{" "}
                                  {msg.text ? `• ${msg.text}` : ""}
                                </span>
                              ) : msg.mediaType === "document" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsFileEarmarkText size={11} />{" "}
                                  {msg.fileName || "Document"}
                                </span>
                              ) : msg.mediaType === "audio" ||
                                msg.mediaType === "voice" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsMicFill size={11} /> Voice note
                                </span>
                              ) : msg.mediaType === "poll" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsBarChartFill size={11} /> Poll:{" "}
                                  {msg.poll?.question || msg.text}
                                </span>
                              ) : msg.mediaType === "location" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsGeoAltFill size={11} /> Location:{" "}
                                  {msg.location?.name || "Shared location"}
                                </span>
                              ) : msg.mediaType === "contact" ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <BsPersonBadgeFill size={11} /> Contact:{" "}
                                  {msg.contactCard?.name}
                                </span>
                              ) : (
                                <span>{msg.text}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── ARCHIVED ROW (When in standard view and has archived chats) ── */}
            {!isArchivedViewOpen && archivedChatIds.length > 0 && (
              <div
                onClick={() => setIsArchivedViewOpen(true)}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-base-200 hover:bg-base-200 cursor-pointer transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-base-200 text-base-content/70 flex items-center justify-center flex-shrink-0">
                  <BsArchiveFill size={18} />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Archived</h4>
                  <span className="badge badge-xs badge-neutral font-bold">
                    {archivedChatIds.length}
                  </span>
                </div>
              </div>
            )}

            {/* ── ARCHIVED VIEW: Render archived chats ── */}
            {isArchivedViewOpen ? (
              filteredArchivedChats.length === 0 ? (
                <div className="p-8 text-center text-base-content/50">
                  <p className="text-sm font-medium">No archived chats</p>
                  <p className="text-xs text-base-content/40 mt-1">
                    Archived chats stay saved and hidden from your main chat
                    list.
                  </p>
                </div>
              ) : (
                filteredArchivedChats.map((chat) => {
                  const draft = getDraft(chat.id);
                  const isSelected = selectedChat?.id === chat.id;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`${sidebarChat} ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="avatar">
                        <div
                          className={`w-12 h-12 rounded-full relative ${
                            isSelected
                              ? "ring ring-primary ring-offset-base-100 ring-offset-2"
                              : ""
                          }`}
                        >
                          <img src={chat.avatar} alt={chat.name} />
                          <span className="absolute -bottom-1 -right-1 bg-neutral text-neutral-content rounded-full p-1 shadow-sm">
                            <BsArchiveFill size={9} />
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3
                            className={`font-semibold text-sm truncate flex items-center gap-1 ${
                              isSelected ? "text-primary" : ""
                            }`}
                          >
                            {chat.customName || chat.displayName || chat.name}
                            {mutedChatIds.includes(chat.id) && (
                              <BsBellSlashFill
                                size={11}
                                className="text-base-content/40 inline ml-1"
                                title="Muted"
                              />
                            )}
                          </h3>
                          <span className="text-[11px] text-base-content/50">
                            {chat.time}
                          </span>
                        </div>

                        <p className="text-xs text-base-content/60 truncate pr-2">
                          {draft ? (
                            <span className="text-primary font-medium">
                              Draft:{" "}
                              <span className="text-base-content/70 font-normal">
                                {draft}
                              </span>
                            </span>
                          ) : (
                            chat.lastMessage
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <>
                {/* ── LOCKED CHATS HEADER (PRD Section 65-71) ── */}
                {lockedChatIds.length > 0 && (
                  <div className="border-b border-base-200">
                    <div
                      onClick={onOpenLockedChats}
                      className="flex items-center gap-3.5 px-4 py-3 hover:bg-base-200 cursor-pointer transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <BsLockFill size={19} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            Locked chats
                          </h4>
                          <span className="badge badge-xs badge-primary font-bold">
                            {lockedChatIds.length}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/50">
                          {isLockedSectionUnlocked
                            ? "Unlocked • Tap to hide"
                            : "Tap to unlock with PIN"}
                        </p>
                      </div>
                    </div>

                    {/* If unlocked, render locked chats */}
                    {isLockedSectionUnlocked && (
                      <div className="bg-base-200/40 pl-2 border-t border-base-200">
                        {filteredLockedChats.map((chat) => {
                          const draft = getDraft(chat.id);
                          const isSelected = selectedChat?.id === chat.id;

                          return (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChat(chat)}
                              className={`${sidebarChat} ${
                                isSelected
                                  ? "bg-primary/10 border-l-4 border-l-primary"
                                  : "border-l-4 border-l-transparent"
                              }`}
                            >
                              <div className="avatar">
                                <div
                                  className={`w-12 h-12 rounded-full relative ${
                                    isSelected
                                      ? "ring ring-primary ring-offset-base-100 ring-offset-2"
                                      : ""
                                  }`}
                                >
                                  <img src={chat.avatar} alt={chat.name} />
                                  <span className="absolute -bottom-1 -right-1 bg-warning text-warning-content rounded-full p-1 shadow-sm">
                                    <BsLockFill size={10} />
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                  <h3
                                    className={`font-semibold text-sm truncate flex items-center gap-1 ${
                                      isSelected ? "text-primary" : ""
                                    }`}
                                  >
                                    {chat.customName ||
                                      chat.displayName ||
                                      chat.name}
                                    {mutedChatIds.includes(chat.id) && (
                                      <BsBellSlashFill
                                        size={11}
                                        className="text-base-content/40 inline ml-1"
                                        title="Muted"
                                      />
                                    )}
                                  </h3>
                                  <span className="text-[11px] text-base-content/50">
                                    {chat.time}
                                  </span>
                                </div>

                                <p className="text-xs text-base-content/60 truncate pr-2">
                                  {draft ? (
                                    <span className="text-primary font-medium">
                                      Draft:{" "}
                                      <span className="text-base-content/70 font-normal">
                                        {draft}
                                      </span>
                                    </span>
                                  ) : (
                                    chat.lastMessage
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {filteredChats.length === 0 &&
            (!isLockedSectionUnlocked || filteredLockedChats.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-base-content/50 gap-2">
                <p className="text-sm font-medium">No chats found</p>
                <p className="text-xs text-base-content/40">
                  {activeFilter !== "all"
                    ? `No chats match the "${activeFilter}" filter`
                    : "Start a conversation by creating a group or selecting a contact"}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const draft = getDraft(chat.id);
                const isSelected = selectedChat?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`${sidebarChat} ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="avatar">
                      <div
                        className={`w-12 h-12 rounded-full relative ${
                          isSelected
                            ? "ring ring-primary ring-offset-base-100 ring-offset-2"
                            : ""
                        }`}
                      >
                        <img src={chat.avatar} alt={chat.name} />
                        {chat.isGroup && (
                          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full p-1 shadow-sm">
                            <BsPeopleFill size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3
                          className={`font-semibold text-sm truncate flex items-center gap-1 ${
                            isSelected ? "text-primary" : ""
                          }`}
                        >
                          {chat.customName || chat.displayName || chat.name}
                          {chat.isFavorite && (
                            <BsStarFill
                              size={10}
                              className="text-warning inline"
                            />
                          )}
                        </h3>
                        <span className="text-[11px] text-base-content/50">
                          {chat.time}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-xs text-base-content/60 truncate pr-2">
                          {draft ? (
                            <span className="text-primary font-medium">
                              Draft:{" "}
                              <span className="text-base-content/70 font-normal">
                                {draft}
                              </span>
                            </span>
                          ) : (
                            chat.lastMessage
                          )}
                        </p>

                        {chat.unread > 0 && (
                          <span className="badge badge-sm badge-primary text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
