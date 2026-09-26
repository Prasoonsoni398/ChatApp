import React from "react";
import StarredMessagesModal from "./StarredMessagesModal.jsx";
import CreatePollModal from "./CreatePollModal.jsx";
import PrivacySettingsModal from "./PrivacySettingsModal.jsx";
import PasscodeModal from "./PasscodeModal.jsx";
import LocationShareModal from "./LocationShareModal.jsx";
import ContactShareModal from "./ContactShareModal.jsx";
import GroupInviteModal from "./GroupInviteModal.jsx";
import ReportModal from "./ReportModal.jsx";
import ViewOnceModal from "./ViewOnceModal.jsx";
import LinkedDevicesModal from "./LinkedDevicesModal.jsx";
import CreateEventModal from "./CreateEventModal.jsx";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal.jsx";
import AddContactModal from "./AddContactModal.jsx";
import ContactInfoModal from "./ContactInfoModal.jsx";
import GroupInfoModal from "./GroupInfoModal.jsx";
import ContextMenu from "./ContextMenu.jsx";
import StatusViewer from "./StatusViewer.jsx";

const ChatModalsContainer = ({
  state,
  webRTC,
  modals,
  activeStatusGroup,
  setActiveStatusGroup,
  handleJumpToMessage,
  handleCreatePoll,
  handlePasscodeSuccess,
  handleSendLocation,
  handleSendContact,
  handleCloseViewOnce,
  handleCreateEvent,
  handleUpdateContactName,
  handleToggleMuteChat,
  handleToggleLockChat,
  handleToggleBlockContact,
  handleLeaveGroup,
  closeContextMenu,
  handlePin,
  handleToggleStar,
}) => {
  return (
    <>
      {activeStatusGroup && (
        <StatusViewer
          group={activeStatusGroup}
          loggedInUser={state.loggedInUser}
          onClose={() => setActiveStatusGroup(null)}
        />
      )}

      <ContextMenu
        contextMenu={state.contextMenu}
        loggedInUser={state.loggedInUser}
        messages={state.messages}
        handleShowInfo={() => {
          state.setInfoMessage(state.contextMenu.msg);
          state.setShowInfoModal(true);
          closeContextMenu();
        }}
        handleReply={() => {
          const msg = state.contextMenu.msg;
          const senderName = state.contextMenu.isMe
            ? "You"
            : state.selectedChat?.isGroup
              ? msg.senderId?.name || "Member"
              : state.selectedChat?.name;
          state.setReplyingTo({
            _id: msg._id,
            text: msg.text,
            image: msg.image,
            senderName,
          });
          closeContextMenu();
        }}
        handleCopy={() => {
          if (state.contextMenu.text) {
            navigator.clipboard.writeText(state.contextMenu.text);
          }
          closeContextMenu();
        }}
        handleForward={() => {
          state.setForwardMessage(state.contextMenu.msg);
          state.setShowForwardModal(true);
          closeContextMenu();
        }}
        handlePin={handlePin}
        handleToggleStar={handleToggleStar}
        handleStartSelect={() => {
          state.setSelectMode(true);
          state.setSelectedMessageIds([state.contextMenu.messageId]);
          closeContextMenu();
        }}
        openDeleteModal={() => {
          state.setDeleteMessageId(state.contextMenu.messageId);
          state.setDeleteIsMe(state.contextMenu.isMe);
          state.setShowDeleteModal(true);
          closeContextMenu();
        }}
        closeContextMenu={closeContextMenu}
        setEditingMessageId={state.setEditingMessageId}
        setMessage={state.setMessage}
      />

      <StarredMessagesModal
        isOpen={modals.showStarredModal}
        onClose={() => modals.setShowStarredModal(false)}
        onJumpToMessage={handleJumpToMessage}
      />

      <CreatePollModal
        isOpen={modals.showCreatePollModal}
        onClose={() => modals.setShowCreatePollModal(false)}
        onCreatePoll={handleCreatePoll}
      />

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

      <PasscodeModal
        isOpen={modals.showPasscodeModal}
        onClose={() => modals.setShowPasscodeModal(false)}
        onSuccess={handlePasscodeSuccess}
        mode={modals.passcodeModalConfig.mode}
      />

      <LocationShareModal
        isOpen={modals.showLocationModal}
        onClose={() => modals.setShowLocationModal(false)}
        onSendLocation={handleSendLocation}
      />

      <ContactShareModal
        isOpen={modals.showContactModal}
        onClose={() => modals.setShowContactModal(false)}
        allUsers={state.allUsers}
        onSendContact={handleSendContact}
      />

      <GroupInviteModal
        isOpen={modals.showGroupInviteModal}
        onClose={() => modals.setShowGroupInviteModal(false)}
        group={state.selectedChat}
        loggedInUser={state.loggedInUser}
      />

      <ReportModal
        isOpen={modals.showReportModal}
        onClose={() => modals.setShowReportModal(false)}
        target={state.selectedChat}
        onBlocked={(uid) => {
          modals.setBlockedUserIds((p) => (p.includes(uid) ? p : [...p, uid]));
        }}
      />

      <ViewOnceModal
        isOpen={Boolean(modals.activeViewOnceMsg)}
        onClose={handleCloseViewOnce}
        mediaUrl={modals.activeViewOnceMsg?.mediaUrl || modals.activeViewOnceMsg?.image}
        isVideo={modals.activeViewOnceMsg?.mediaType === "video"}
      />

      <LinkedDevicesModal
        isOpen={modals.showLinkedDevicesModal}
        onClose={() => modals.setShowLinkedDevicesModal(false)}
      />

      <CreateEventModal
        isOpen={modals.showCreateEventModal}
        onClose={() => modals.setShowCreateEventModal(false)}
        onCreateEvent={handleCreateEvent}
      />

      <KeyboardShortcutsModal
        isOpen={modals.showShortcutsModal}
        onClose={() => modals.setShowShortcutsModal(false)}
      />

      <AddContactModal
        isOpen={modals.showAddContactModal}
        onClose={() => modals.setShowAddContactModal(false)}
        onContactAdded={(newContact) => {
          if (newContact) {
            const newChat = {
              id: newContact._id,
              name: newContact.name,
              phone: newContact.phone,
              isGroup: false,
              lastMessage: "Tap to start chatting",
              time: "",
              unread: 0,
              avatar:
                newContact.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${newContact.name}`,
            };
            state.setChats((prev) => {
              if (prev.some((c) => c.id === newContact._id)) return prev;
              return [newChat, ...prev];
            });
            state.setAllUsers((prev) => {
              if (prev.some((u) => u._id === newContact._id)) return prev;
              return [newContact, ...prev];
            });
            state.setSelectedChat(newChat);
          }
        }}
      />

      <ContactInfoModal
        isOpen={modals.showContactInfoModal}
        onClose={() => modals.setShowContactInfoModal(false)}
        contact={state.selectedChat}
        loggedInUser={state.loggedInUser}
        onUpdateContactName={handleUpdateContactName}
        isMuted={Boolean(
          state.selectedChat && modals.mutedChatIds.includes(state.selectedChat.id),
        )}
        onToggleMute={() => handleToggleMuteChat(state.selectedChat?.id)}
        isLocked={Boolean(
          state.selectedChat && modals.lockedChatIds.includes(state.selectedChat.id),
        )}
        onToggleLock={() => handleToggleLockChat(state.selectedChat?.id)}
        isBlocked={Boolean(
          state.selectedChat && modals.blockedUserIds.includes(state.selectedChat.id),
        )}
        onToggleBlock={() => handleToggleBlockContact(state.selectedChat?.id)}
        onOpenReport={() => modals.setShowReportModal(true)}
        onOpenStarred={() => modals.setShowStarredModal(true)}
        onStartCall={(target, type) => webRTC.startCall(target, type)}
        onOpenSearch={() => {
          state.setShowMsgSearch(true);
          state.setMsgSearchQuery("");
        }}
      />

      <GroupInfoModal
        isOpen={modals.showGroupInfoModal}
        onClose={() => modals.setShowGroupInfoModal(false)}
        group={state.selectedChat}
        loggedInUser={state.loggedInUser}
        allContacts={state.allUsers}
        isMuted={Boolean(
          state.selectedChat && modals.mutedChatIds.includes(state.selectedChat.id),
        )}
        onToggleMute={() => handleToggleMuteChat(state.selectedChat?.id)}
        onOpenInviteLink={() => modals.setShowGroupInviteModal(true)}
        onLeaveGroup={() => handleLeaveGroup(state.selectedChat?.id)}
        onOpenReport={() => modals.setShowReportModal(true)}
      />
    </>
  );
};

export default ChatModalsContainer;
