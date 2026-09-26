import { useState, useEffect, useRef } from "react";
import * as messageService from "../../services/messageService.js";
import SidebarTopbar from "./sidebar/SidebarTopbar.jsx";
import SidebarSearchBar from "./sidebar/SidebarSearchBar.jsx";
import SidebarChatListItem from "./sidebar/SidebarChatListItem.jsx";
import SidebarSearchResults from "./sidebar/SidebarSearchResults.jsx";
import {
  ArchivedRowBanner,
  LockedChatsHeader,
} from "./sidebar/ArchivedLockedBanners.jsx";

/**
 * ChatSidebar – WhatsApp-style left panel containing profile info,
 * filter chips, search input, and responsive scrollable chat list.
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
          searchQuery.trim(),
          searchCategory,
        );
        setMessageResults(results || []);
      } catch (_err) {
        setMessageResults([]);
      } finally {
        setIsSearchingMessages(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, searchCategory, isGlobalSearchMode]);

  const handleSelectMessageResult = (msg) => {
    let targetChat = null;
    if (msg.groupId) {
      const gid = msg.groupId._id || msg.groupId;
      targetChat = chats.find((c) => c.isGroup && (c.id === gid || c._id === gid));
    } else {
      const myId = loggedInUser?._id;
      const otherId =
        String(msg.senderId?._id || msg.senderId) === String(myId)
          ? msg.receiverId?._id || msg.receiverId
          : msg.senderId?._id || msg.senderId;
      targetChat = chats.find((c) => !c.isGroup && (c.id === otherId || c._id === otherId));
    }

    if (targetChat) {
      setSelectedChat(targetChat);
      setSearchQuery("");
      setSearchCategory("all");
      setMessageResults([]);
      setIsSearchActive(false);

      setTimeout(() => {
        const msgEl = document.getElementById(`msg-${msg._id}`);
        if (msgEl) {
          msgEl.scrollIntoView({ behavior: "smooth", block: "center" });
          msgEl.classList.add("ring-4", "ring-primary", "rounded-2xl");
          setTimeout(() => {
            msgEl.classList.remove("ring-4", "ring-primary", "rounded-2xl");
          }, 2000);
        }
      }, 300);
    }
  };

  const getDraft = (chatId) => {
    try {
      return localStorage.getItem(`draft_${chatId}`) || "";
    } catch {
      return "";
    }
  };

  const isChatLocked = (chatId) => lockedChatIds.includes(chatId);
  const isChatArchived = (chatId) => archivedChatIds.includes(chatId);

  const regularChats = chats.filter(
    (c) => !isChatLocked(c.id) && !isChatArchived(c.id),
  );
  const lockedChats = chats.filter((c) => isChatLocked(c.id));
  const archivedChats = chats.filter((c) => isChatArchived(c.id));

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
      <SidebarTopbar
        isArchivedViewOpen={isArchivedViewOpen}
        setIsArchivedViewOpen={setIsArchivedViewOpen}
        archivedChatsCount={archivedChats.length}
        loggedInUser={loggedInUser}
        setShowCreateGroup={setShowCreateGroup}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
        setEditName={setEditName}
        setShowEditModal={setShowEditModal}
        onOpenPrivacySettings={onOpenPrivacySettings}
        onOpenLinkedDevices={onOpenLinkedDevices}
        onOpenShortcuts={onOpenShortcuts}
        handleLogout={handleLogout}
      />

      {/* ── Search Bar & Filter Chips ── */}
      <SidebarSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
        isGlobalSearchMode={isGlobalSearchMode}
        onClearSearch={() => {
          setSearchQuery("");
          setSearchCategory("all");
          setMessageResults([]);
          setIsSearchActive(false);
        }}
      />

      {/* ── Chat List / Search Results ── */}
      <div className="flex-1 overflow-y-auto">
        {isGlobalSearchMode ? (
          <SidebarSearchResults
            isSearchingMessages={isSearchingMessages}
            filteredChats={filteredChats}
            messageResults={messageResults}
            searchQuery={searchQuery}
            searchCategory={searchCategory}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            handleSelectMessageResult={handleSelectMessageResult}
            loggedInUser={loggedInUser}
          />
        ) : (
          <>
            {/* Archived row when in main view */}
            {!isArchivedViewOpen && (
              <ArchivedRowBanner
                archivedCount={archivedChatIds.length}
                onOpenArchived={() => setIsArchivedViewOpen(true)}
              />
            )}

            {/* Archived view list */}
            {isArchivedViewOpen ? (
              filteredArchivedChats.length === 0 ? (
                <div className="p-8 text-center text-base-content/50">
                  <p className="text-sm font-medium">No archived chats</p>
                  <p className="text-xs text-base-content/40 mt-1">
                    Archived chats stay saved and hidden from your main chat list.
                  </p>
                </div>
              ) : (
                filteredArchivedChats.map((chat) => (
                  <SidebarChatListItem
                    key={chat.id}
                    chat={chat}
                    isSelected={selectedChat?.id === chat.id}
                    onSelect={() => setSelectedChat(chat)}
                    isMuted={mutedChatIds.includes(chat.id)}
                    isArchived={true}
                    draft={getDraft(chat.id)}
                  />
                ))
              )
            ) : (
              <>
                {/* Locked Chats banner */}
                {lockedChatIds.length > 0 && (
                  <div className="border-b border-base-200">
                    <LockedChatsHeader
                      lockedCount={lockedChatIds.length}
                      isLockedSectionUnlocked={isLockedSectionUnlocked}
                      onOpenLockedChats={onOpenLockedChats}
                    />

                    {isLockedSectionUnlocked && (
                      <div className="bg-base-200/40 pl-2 border-t border-base-200">
                        {filteredLockedChats.map((chat) => (
                          <SidebarChatListItem
                            key={chat.id}
                            chat={chat}
                            isSelected={selectedChat?.id === chat.id}
                            onSelect={() => setSelectedChat(chat)}
                            isMuted={mutedChatIds.includes(chat.id)}
                            isArchived={false}
                            draft={getDraft(chat.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Regular Chats */}
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-base-content/50">
                    <p className="text-sm font-medium">No chats found</p>
                    <p className="text-xs text-base-content/40 mt-1">
                      {searchQuery
                        ? "Try searching with a different keyword"
                        : "Start a conversation by adding contacts"}
                    </p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <SidebarChatListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChat?.id === chat.id}
                      onSelect={() => setSelectedChat(chat)}
                      isMuted={mutedChatIds.includes(chat.id)}
                      isArchived={false}
                      draft={getDraft(chat.id)}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
