import { useState } from "react";
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
          loggedInUser={state.loggedInUser}
          handleLogout={handleLogout}
          setShowEditModal={state.setShowEditModal}
          setEditName={state.setEditName}
          onOpenPrivacySettings={() => modals.setShowPrivacyModal(true)}
          onOpenLinkedDevices={() => modals.setShowLinkedDevicesModal(true)}
          onOpenShortcuts={() => modals.setShowShortcutsModal(true)}
        />

        {/* Main Sidebar */}
        {activeTab === "chats" ? (
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
            onOpenPrivacySettings={() => modals.setShowPrivacyModal(true)}
            onOpenChannels={() => setActiveTab("channels")}
            onOpenLinkedDevices={() => modals.setShowLinkedDevicesModal(true)}
            onOpenShortcuts={() => modals.setShowShortcutsModal(true)}
            onAddContact={() => modals.setShowAddContactModal(true)}
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
