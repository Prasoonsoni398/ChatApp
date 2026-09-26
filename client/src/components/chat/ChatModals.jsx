import { useState } from "react";
import CreateGroupModal from "./modals/CreateGroupModal.jsx";
import EditProfileModal from "./modals/EditProfileModal.jsx";
import DeleteMessageModal from "./modals/DeleteMessageModal.jsx";
import MessageInfoModal from "./modals/MessageInfoModal.jsx";
import ForwardMessageModal from "./modals/ForwardMessageModal.jsx";

/**
 * ChatModals – groups together all modals used within Chat.
 * Included modals: Create Group, Edit Profile, Delete Message, Message Info, Forward.
 */
const ChatModals = ({
  // Edit Profile
  showEditModal,
  setShowEditModal,
  editName,
  setEditName,
  editAbout = "Hey there! I am using ChatApp.",
  setEditAbout,
  editAvatar,
  setEditAvatar,
  isUpdating,
  handleUpdateProfile,

  // Create Group
  showCreateGroup,
  setShowCreateGroup,
  groupName,
  setGroupName,
  groupMemberIds = [],
  setGroupMemberIds,
  groupAvatarFile,
  setGroupAvatarFile,
  isCreatingGroup,
  handleCreateGroup,
  allUsers = [],

  // Delete
  showDeleteModal,
  setShowDeleteModal,
  deleteMessageId,
  setDeleteMessageId,
  deleteIsMe,
  confirmDeleteMessage,
  selectedMessageIds,

  // Info
  showInfoModal,
  setShowInfoModal,
  infoMessage,

  // Forward
  showForwardModal,
  setShowForwardModal,
  forwardMessage,
  setForwardMessage,
  chats,
  forwardSelectedMessages,
  confirmForward,
}) => {
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);

  const handleFileSelect = (e, target) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImageSrc(reader.result);
        setCropTarget(target);
      });
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  return (
    <>
      {/* ══ CREATE GROUP MODAL ══ */}
      <CreateGroupModal
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        groupMemberIds={groupMemberIds}
        setGroupMemberIds={setGroupMemberIds}
        groupAvatarFile={groupAvatarFile}
        setGroupAvatarFile={setGroupAvatarFile}
        isCreatingGroup={isCreatingGroup}
        handleCreateGroup={handleCreateGroup}
        allUsers={allUsers}
        cropImageSrc={cropImageSrc}
        setCropImageSrc={setCropImageSrc}
        cropTarget={cropTarget}
        setCropTarget={setCropTarget}
        handleFileSelect={handleFileSelect}
      />

      {/* ══ EDIT PROFILE MODAL ══ */}
      <EditProfileModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        editName={editName}
        setEditName={setEditName}
        editAbout={editAbout}
        setEditAbout={setEditAbout}
        editAvatar={editAvatar}
        setEditAvatar={setEditAvatar}
        isUpdating={isUpdating}
        handleUpdateProfile={handleUpdateProfile}
        cropImageSrc={cropImageSrc}
        setCropImageSrc={setCropImageSrc}
        cropTarget={cropTarget}
        setCropTarget={setCropTarget}
        handleFileSelect={handleFileSelect}
      />

      {/* ══ MESSAGE INFO MODAL ══ */}
      <MessageInfoModal
        show={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        infoMessage={infoMessage}
      />

      {/* ══ FORWARD MODAL ══ */}
      <ForwardMessageModal
        show={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setForwardMessage(null);
        }}
        chats={chats}
        forwardMessage={forwardMessage}
        forwardSelectedMessages={forwardSelectedMessages}
        confirmForward={confirmForward}
      />

      {/* ══ DELETE MODAL ══ */}
      <DeleteMessageModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteMessageId(null);
        }}
        deleteMessageId={deleteMessageId}
        selectedMessageIds={selectedMessageIds}
        deleteIsMe={deleteIsMe}
        confirmDeleteMessage={confirmDeleteMessage}
      />
    </>
  );
};

export default ChatModals;
