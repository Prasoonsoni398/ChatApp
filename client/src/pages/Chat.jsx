import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsWifiOff } from "react-icons/bs";
import toast from "react-hot-toast";

// Custom Hooks
import useChatState from "../hooks/useChatState.js";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import useTypingIndicator from "../hooks/useTypingIndicator.js";
import useWebRTC from "../hooks/useWebRTC.js";
import { useChatModalsState } from "../hooks/useChatModalsState.js";
import { useChatLifecycle } from "../hooks/useChatLifecycle.js";
import { useChatSocketEvents } from "../hooks/useChatSocketEvents.js";
import { useChatMessageSender } from "../hooks/useChatMessageSender.js";
import { useChatMessageInteractions } from "../hooks/useChatMessageInteractions.jsx";
import { useChatSecurityAndSettings } from "../hooks/useChatSecurityAndSettings.js";

// Components
import IconSidebar from "../components/chat/IconSidebar.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import StatusSidebar from "../components/chat/StatusSidebar.jsx";
import CommunitiesSidebar from "../components/chat/CommunitiesSidebar.jsx";
import ChannelsView from "../components/chat/ChannelsView.jsx";
import CallsSidebar from "../components/chat/CallsSidebar.jsx";
import ChatMainArea from "../components/chat/ChatMainArea.jsx";
import ChatModals from "../components/chat/ChatModals.jsx";
import ChatModalsContainer from "../components/chat/ChatModalsContainer.jsx";
import CallOverlay from "../components/chat/CallOverlay.jsx";
import MobileNavAndFAB from "../components/chat/MobileNavAndFAB.jsx";
import ContactInfoModal from "../components/chat/ContactInfoModal.jsx";
import GroupInfoModal from "../components/chat/GroupInfoModal.jsx";
import PrivacySettingsModal from "../components/chat/PrivacySettingsModal.jsx";
import NewChatSidebar from "../components/chat/NewChatSidebar.jsx";

const Chat = () => {
  const navigate = useNavigate();
  const state = useChatState();

  const { onlineUsersMap } = useOnlineStatus();
  const {
    otherUserTyping,
    setOtherUserTyping,
    handleTypingEmit,
    handleTypingReceive,
  } = useTypingIndicator(state.selectedChat, state.loggedInUser);

  const webRTC = useWebRTC(state.loggedInUser);

  const [activeTab, setActiveTab] = useState("chats");
  const [selectedFile, setSelectedFile] = useState(null);

  // Unread messages count across all active chats
  const unreadMessagesCount = useMemo(() => {
    return (state.chats || []).reduce(
      (sum, c) => sum + (Number(c.unread) || 0),
      0,
    );
  }, [state.chats]);

  // Modals state bundle
  const modals = useChatModalsState(state.loggedInUser);

  // Lifecycle effects, statuses, and data fetching
  const {
    statuses,
    isUploadingStatus,
    activeStatusGroup,
    setActiveStatusGroup,
    isOnline,
    fetchStatuses,
    handleUploadStatus,
    handleSelectChat,
    handleUpdateContactName,
    fetchChats,
  } = useChatLifecycle({ state, navigate, modals });

  const hasUnreadStatus = useMemo(() => {
    let viewedIds = new Set();
    try {
      viewedIds = new Set(
        JSON.parse(localStorage.getItem("viewed_status_group_ids") || "[]"),
      );
    } catch (_) {}
    return (statuses || []).some(
      (s) =>
        s.user?._id !== state.loggedInUser?._id && !viewedIds.has(s.user?._id),
    );
  }, [statuses, state.loggedInUser]);

  const handleTabSelect = (tabId) => {
    modals.setShowContactInfoModal(false);
    modals.setShowGroupInfoModal(false);
    modals.setShowNewChatSidebar(false);
    if (tabId === "settings") {
      modals.setShowPrivacyModal((prev) => !prev);
    } else {
      modals.setShowPrivacyModal(false);
      setActiveTab(tabId);
    }
  };

  // Handler: user selected from NewChatSidebar
  const handleNewChatSelectUser = (user) => {
    modals.setShowNewChatSidebar(false);
    if (!user) return;
    // Build a chat-like object
    const chatObj = state.chats.find(
      (c) => !c.isGroup && c.id === (user._id || user.id),
    ) || {
      id: user._id || user.id,
      name: user.name,
      avatar: user.avatar,
      isGroup: false,
      lastMessage: "",
      time: "",
      unread: 0,
      phone: user.phone,
    };
    handleSelectChat(chatObj);
    setActiveTab("chats");
  };

  // Socket listeners and message fetching
  useChatSocketEvents({
    state,
    handleTypingReceive,
    setOtherUserTyping,
  });

  // Message sending actions
  const senderActions = useChatMessageSender({
    state,
    selectedFile,
    setSelectedFile,
    setShowLocationModal: modals.setShowLocationModal,
    setShowContactModal: modals.setShowContactModal,
    activeViewOnceMsg: modals.activeViewOnceMsg,
    setActiveViewOnceMsg: modals.setActiveViewOnceMsg,
  });

  // Message and profile interactions
  const interactionActions = useChatMessageInteractions({
    state,
    fetchChats,
    handleTypingEmit,
  });

  // Chat locking, mute, archive, and block actions
  const securityActions = useChatSecurityAndSettings({
    state,
    modals,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("selectedChat");
    toast.success("Logged out");
    navigate("/login");
  };

  const currentPinned =
    state.pinnedMessage || state.messages.find((m) => m.isPinned);

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-base-content">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-warning text-warning-content px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 z-50 shadow-md">
          <BsWifiOff size={15} />
          <span>
            Computer not connected. Make sure your computer has an active
            Internet connection.
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Thin Icon Sidebar */}
        <IconSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTabSelect={handleTabSelect}
          isSettingsOpen={Boolean(modals.showPrivacyModal)}
          unreadMessagesCount={unreadMessagesCount}
          hasUnreadStatus={hasUnreadStatus}
          loggedInUser={state.loggedInUser}
          handleLogout={handleLogout}
          setShowEditModal={state.setShowEditModal}
          setEditName={state.setEditName}
          onOpenPrivacySettings={() => handleTabSelect("settings")}
          onOpenLinkedDevices={() => modals.setShowLinkedDevicesModal(true)}
          onOpenShortcuts={() => modals.setShowShortcutsModal(true)}
        />

        {/* Main Sidebar Slot */}
        {modals.showContactInfoModal &&
        state.selectedChat &&
        !state.selectedChat.isGroup ? (
          <ContactInfoModal
            isOpen={modals.showContactInfoModal}
            onClose={() => modals.setShowContactInfoModal(false)}
            contact={state.selectedChat}
            loggedInUser={state.loggedInUser}
            onUpdateContactName={handleUpdateContactName}
            isMuted={Boolean(
              state.selectedChat &&
              modals.mutedChatIds.includes(state.selectedChat.id),
            )}
            onToggleMute={() =>
              securityActions.handleToggleMuteChat(state.selectedChat?.id)
            }
            isLocked={Boolean(
              state.selectedChat &&
              modals.lockedChatIds.includes(state.selectedChat.id),
            )}
            onToggleLock={() =>
              securityActions.handleToggleLockChat(state.selectedChat?.id)
            }
            isBlocked={Boolean(
              state.selectedChat &&
              modals.blockedUserIds.includes(state.selectedChat.id),
            )}
            onToggleBlock={() =>
              securityActions.handleToggleBlockContact(state.selectedChat?.id)
            }
            onOpenReport={() => modals.setShowReportModal(true)}
            onOpenStarred={() => modals.setShowStarredModal(true)}
            onOpenWallpaperModal={() => modals.setShowWallpaperModal(true)}
            onStartCall={(target, type) => webRTC.startCall(target, type)}
            onOpenSearch={() => {
              state.setShowMsgSearch(true);
              state.setMsgSearchQuery("");
            }}
          />
        ) : modals.showGroupInfoModal && state.selectedChat?.isGroup ? (
          <GroupInfoModal
            isOpen={modals.showGroupInfoModal}
            onClose={() => modals.setShowGroupInfoModal(false)}
            group={state.selectedChat}
            loggedInUser={state.loggedInUser}
            allContacts={state.allUsers}
            isMuted={Boolean(
              state.selectedChat &&
              modals.mutedChatIds.includes(state.selectedChat.id),
            )}
            onToggleMute={() =>
              securityActions.handleToggleMuteChat(state.selectedChat?.id)
            }
            onOpenInviteLink={() => modals.setShowGroupInviteModal(true)}
            onOpenWallpaperModal={() => modals.setShowWallpaperModal(true)}
            onLeaveGroup={() =>
              securityActions.handleLeaveGroup(state.selectedChat?.id)
            }
            onOpenReport={() => modals.setShowReportModal(true)}
          />
        ) : modals.showPrivacyModal ? (
          <PrivacySettingsModal
            isOpen={modals.showPrivacyModal}
            onClose={() => modals.setShowPrivacyModal(false)}
            loggedInUser={state.loggedInUser}
            onUserUpdated={(updated) => {
              state.setLoggedInUser(updated);
            }}
            onAllChatsCleared={() => {
              state.setMessages([]);
            }}
          />
        ) : modals.showNewChatSidebar ? (
          <NewChatSidebar
            isOpen={modals.showNewChatSidebar}
            onClose={() => modals.setShowNewChatSidebar(false)}
            loggedInUser={state.loggedInUser}
            allUsers={state.allUsers}
            onSelectUser={handleNewChatSelectUser}
            onNewGroup={() => {
              modals.setShowNewChatSidebar(false);
              state.setShowCreateGroup(true);
            }}
            onNewContact={() => {
              modals.setShowNewChatSidebar(false);
              modals.setShowAddContactModal(true);
            }}
            onNewCommunity={() => {
              modals.setShowNewChatSidebar(false);
              setActiveTab("communities");
            }}
          />
        ) : activeTab === "chats" ? (
          <ChatSidebar
            loggedInUser={state.loggedInUser}
            chats={state.chats}
            searchQuery={state.searchQuery}
            setSearchQuery={state.setSearchQuery}
            selectedChat={state.selectedChat}
            setSelectedChat={handleSelectChat}
            showProfileMenu={state.showProfileMenu}
            setShowProfileMenu={state.setShowProfileMenu}
            profileMenuRef={state.profileMenuRef}
            handleLogout={handleLogout}
            setShowEditModal={state.setShowEditModal}
            setShowCreateGroup={state.setShowCreateGroup}
            setEditName={state.setEditName}
            lockedChatIds={modals.lockedChatIds}
            isLockedSectionUnlocked={modals.isLockedSectionUnlocked}
            onOpenLockedChats={securityActions.handleOpenLockedChats}
            onOpenPrivacySettings={() => handleTabSelect("settings")}
            onOpenChannels={() => setActiveTab("channels")}
            onOpenLinkedDevices={() => modals.setShowLinkedDevicesModal(true)}
            onOpenShortcuts={() => modals.setShowShortcutsModal(true)}
            onAddContact={() => modals.setShowAddContactModal(true)}
            onOpenNewChat={() => modals.setShowNewChatSidebar(true)}
            archivedChatIds={modals.archivedChatIds}
            isArchivedViewOpen={modals.isArchivedViewOpen}
            setIsArchivedViewOpen={modals.setIsArchivedViewOpen}
            mutedChatIds={modals.mutedChatIds}
          />
        ) : activeTab === "status" ? (
          <StatusSidebar
            loggedInUser={state.loggedInUser}
            statuses={statuses}
            onUploadStatus={handleUploadStatus}
            onViewStatus={setActiveStatusGroup}
            isUploading={isUploadingStatus}
            onStatusUpdated={fetchStatuses}
          />
        ) : activeTab === "communities" ? (
          <CommunitiesSidebar
            chats={state.chats}
            loggedInUser={state.loggedInUser}
            onSelectChat={(chat) => {
              setActiveTab("chats");
              handleSelectChat(chat);
            }}
          />
        ) : activeTab === "channels" ? (
          <ChannelsView loggedInUser={state.loggedInUser} />
        ) : (
          <CallsSidebar
            allUsers={state.allUsers}
            startCall={webRTC.startCall}
            onOpenNewCallModal={() => {
              if (state.allUsers.length > 0) {
                webRTC.startCall(state.allUsers[0], "voice");
              } else {
                toast.error("No contacts available to call");
              }
            }}
          />
        )}

        {/* Main Chat Area */}
        {activeTab !== "channels" && (
          <ChatMainArea
            state={state}
            onlineUsersMap={onlineUsersMap}
            webRTC={webRTC}
            lockedChatIds={modals.lockedChatIds}
            handleToggleLockChat={securityActions.handleToggleLockChat}
            archivedChatIds={modals.archivedChatIds}
            handleToggleArchiveChat={securityActions.handleToggleArchiveChat}
            mutedChatIds={modals.mutedChatIds}
            handleToggleMuteChat={securityActions.handleToggleMuteChat}
            setShowStarredModal={modals.setShowStarredModal}
            setShowGroupInviteModal={modals.setShowGroupInviteModal}
            blockedUserIds={modals.blockedUserIds}
            handleToggleBlockContact={securityActions.handleToggleBlockContact}
            setShowReportModal={modals.setShowReportModal}
            setShowGroupInfoModal={modals.setShowGroupInfoModal}
            setShowContactInfoModal={modals.setShowContactInfoModal}
            onOpenWallpaperModal={() => modals.setShowWallpaperModal(true)}
            currentPinned={currentPinned}
            reactionMapByMsgId={interactionActions.reactionMapByMsgId}
            handleReact={interactionActions.handleReact}
            handleContextMenu={interactionActions.handleContextMenu}
            otherUserTyping={otherUserTyping}
            handleOpenViewOnce={senderActions.handleOpenViewOnce}
            handleRespondEvent={senderActions.handleRespondEvent}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handleImageSelect={interactionActions.handleImageSelect}
            handleSendMessage={senderActions.handleSendMessage}
            handleSendVoice={senderActions.handleSendVoice}
            handleTypingEvent={interactionActions.handleTypingEvent}
            handleInsertMention={interactionActions.handleInsertMention}
            setShowCreatePollModal={modals.setShowCreatePollModal}
            setShowCreateEventModal={modals.setShowCreateEventModal}
            setShowLocationModal={modals.setShowLocationModal}
            setShowContactModal={modals.setShowContactModal}
          />
        )}

        {/* Chat Dialog Modals */}
        <ChatModals
          {...state}
          allUsers={state.allUsers}
          chats={state.chats}
          handleUpdateProfile={interactionActions.handleUpdateProfile}
          handleCreateGroup={interactionActions.handleCreateGroup}
          confirmDeleteMessage={interactionActions.confirmDeleteMessage}
          forwardSelectedMessages={interactionActions.forwardSelectedMessages}
          confirmForward={interactionActions.confirmForward}
        />

        {/* Floating Modals and Dialogs */}
        <ChatModalsContainer
          state={state}
          webRTC={webRTC}
          modals={modals}
          activeStatusGroup={activeStatusGroup}
          setActiveStatusGroup={setActiveStatusGroup}
          onStatusDeleted={fetchStatuses}
          handleJumpToMessage={interactionActions.handleJumpToMessage}
          handleCreatePoll={senderActions.handleCreatePoll}
          handlePasscodeSuccess={securityActions.handlePasscodeSuccess}
          handleSendLocation={senderActions.handleSendLocation}
          handleSendContact={senderActions.handleSendContact}
          handleCloseViewOnce={senderActions.handleCloseViewOnce}
          handleCreateEvent={senderActions.handleCreateEvent}
          handleUpdateContactName={handleUpdateContactName}
          handleToggleMuteChat={securityActions.handleToggleMuteChat}
          handleToggleLockChat={securityActions.handleToggleLockChat}
          handleToggleBlockContact={securityActions.handleToggleBlockContact}
          handleLeaveGroup={securityActions.handleLeaveGroup}
          closeContextMenu={interactionActions.closeContextMenu}
          handlePin={interactionActions.handlePin}
          handleToggleStar={interactionActions.handleToggleStar}
        />

        <CallOverlay {...webRTC} />

        {/* Mobile Bottom Navigation and Floating Action Button */}
        <MobileNavAndFAB
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTabSelect={handleTabSelect}
          isSettingsOpen={Boolean(modals.showPrivacyModal)}
          unreadMessagesCount={unreadMessagesCount}
          hasUnreadStatus={hasUnreadStatus}
          selectedChat={state.selectedChat}
          onAddContact={() => modals.setShowAddContactModal(true)}
          allUsers={state.allUsers}
          startCall={webRTC.startCall}
        />
      </div>
    </div>
  );
};

export default Chat;
