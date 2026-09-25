import { useState } from "react";
import {
  BsPeopleFill,
  BsX,
  BsCheck,
  BsCheckAll,
  BsCamera,
} from "react-icons/bs";
import {
  modalOverlay,
  modalCard,
  modalCardMd,
} from "../../constants/styles.js";
import ImageCropView from "./ImageCropModal.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";

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
      {showCreateGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className={`${modalCardMd} p-0 overflow-hidden`}>
            {cropImageSrc && cropTarget === "group" ? (
              <ImageCropView
                imageSrc={cropImageSrc}
                onCropComplete={(croppedFile) => {
                  setGroupAvatarFile(croppedFile);
                  setCropImageSrc(null);
                  setCropTarget(null);
                }}
                onCancel={() => {
                  setCropImageSrc(null);
                  setCropTarget(null);
                }}
              />
            ) : (
              <>
                <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BsPeopleFill className="text-primary" /> New Group
                  </h3>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
                  >
                    <BsX size={18} />
                  </button>
                </div>
                <div className="px-6 pb-6 space-y-4">
                  {/* Group name */}
                  <div>
                    <label className="text-sm font-medium text-base-content/70 mb-1 block">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="input input-bordered w-full bg-base-200"
                    />
                  </div>
                  {/* Group avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative group cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-base-300 hover:border-primary flex flex-col items-center justify-center bg-base-200 overflow-hidden transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, "group")}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {groupAvatarFile ? (
                        <img
                          src={URL.createObjectURL(groupAvatarFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <BsCamera className="text-3xl text-base-content/50 group-hover:text-primary transition-colors" />
                          <span className="text-xs text-base-content/50 mt-1 font-medium group-hover:text-primary">
                            Upload
                          </span>
                        </>
                      )}
                      {groupAvatarFile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BsCamera className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <label className="text-sm font-medium text-base-content/70 mt-2 block">
                      Group Icon (optional)
                    </label>
                  </div>
                  {/* Member selection */}
                  <div>
                    <label className="text-sm font-medium text-base-content/70 mb-2 block">
                      Add Members *
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-base-300 rounded-xl p-2">
                      {allUsers.length > 0 ? (
                        allUsers.map((u) => (
                          <label
                            key={u._id}
                            className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={groupMemberIds.includes(u._id)}
                              onChange={(e) =>
                                setGroupMemberIds((prev) =>
                                  e.target.checked
                                    ? [...prev, u._id]
                                    : prev.filter((id) => id !== u._id),
                                )
                              }
                              className="checkbox checkbox-primary checkbox-sm"
                            />
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden">
                                <img
                                  src={
                                    u.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`
                                  }
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-sm truncate block">
                                {u.name}
                              </span>
                              {u.phone && (
                                <span className="text-[11px] text-base-content/50 block">
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="p-4 text-center text-base-content/50 text-xs space-y-1">
                          <p className="font-medium text-base-content/70">
                            No added contacts found
                          </p>
                          <p className="text-[11px]">
                            Only users you have added to your contacts can be
                            added to a group.
                          </p>
                        </div>
                      )}
                    </div>
                    {groupMemberIds.length > 0 && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {groupMemberIds.length} contact
                        {groupMemberIds.length > 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCreateGroup(false)}
                      className="btn btn-ghost flex-1 active:scale-95 transition-transform"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      disabled={isCreatingGroup}
                      className="btn btn-primary flex-1 active:scale-95 transition-transform"
                    >
                      {isCreatingGroup ? "Creating…" : "Create Group"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ EDIT PROFILE MODAL ══ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div
            className={`bg-base-100 w-full max-w-md rounded-2xl p-0 shadow-xl border border-base-300 animate-modal-pop overflow-hidden`}
          >
            {cropImageSrc && cropTarget === "profile" ? (
              <ImageCropView
                imageSrc={cropImageSrc}
                onCropComplete={(croppedFile) => {
                  setEditAvatar(croppedFile);
                  setCropImageSrc(null);
                  setCropTarget(null);
                }}
                onCancel={() => {
                  setCropImageSrc(null);
                  setCropTarget(null);
                }}
              />
            ) : (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-base-content/80 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input input-bordered w-full bg-base-200 text-sm rounded-xl"
                      required
                    />
                  </div>

                  {/* About / Description (PRD GuftguAbout) */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-base-content/80">
                        About / Description
                      </label>
                      <span className="text-[10px] text-base-content/50 font-mono">
                        {140 - (editAbout?.length || 0)} left
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={140}
                      value={editAbout}
                      onChange={(e) => setEditAbout(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="textarea textarea-bordered w-full bg-base-200 text-sm rounded-xl resize-none"
                    />

                    {/* GuftguQuick Status Presets */}
                    <div className="mt-2.5">
                      <span className="text-[11px] font-semibold text-base-content/60 block mb-1.5">
                        Quick Status Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                        {[
                          "Available",
                          "Busy",
                          "At work",
                          "In a meeting",
                          "Can't talk, ChatApp only",
                          "Urgent calls only",
                          "At the gym",
                          "Sleeping",
                          "Battery about to die",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditAbout(preset)}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              editAbout === preset
                                ? "bg-primary text-primary-content border-primary font-medium shadow-xs"
                                : "bg-base-200/90 text-base-content/70 border-base-300 hover:bg-base-300 hover:text-base-content"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative group cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-base-300 hover:border-primary flex flex-col items-center justify-center bg-base-200 overflow-hidden transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, "profile")}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {editAvatar ? (
                        <img
                          src={URL.createObjectURL(editAvatar)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <BsCamera className="text-3xl text-base-content/50 group-hover:text-primary transition-colors" />
                          <span className="text-xs text-base-content/50 mt-1 font-medium group-hover:text-primary">
                            Upload
                          </span>
                        </>
                      )}
                      {editAvatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BsCamera className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <label className="block text-sm font-medium text-base-content/70 mt-2">
                      Profile Image (optional)
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="btn btn-ghost active:scale-95 transition-transform"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary active:scale-95 transition-transform"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MESSAGE INFO MODAL ══ */}
      {showInfoModal && infoMessage && (
        <div
          className={`${modalOverlay} z-[110]`}
          onClick={() => setShowInfoModal(false)}
        >
          <div className={modalCard} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Message Info</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              >
                <BsX size={18} />
              </button>
            </div>
            <div className="bg-base-200 rounded-xl px-3 py-2 text-sm mb-4">
              {infoMessage.text || <em className="opacity-60">📷 Image</em>}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">Sent</span>
                <span className="flex items-center gap-2 font-semibold">
                  <BsCheck className="text-base-content/60" />
                  {new Date(infoMessage.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">
                  Delivered
                </span>
                <span className="flex items-center gap-2 font-semibold text-base-content/60">
                  <BsCheckAll />
                  {new Date(
                    new Date(infoMessage.createdAt).getTime() + 1500,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base-content/60 font-medium">Read</span>
                <span className="flex items-center gap-2 font-semibold text-success">
                  <BsCheckAll />
                  {new Date(
                    new Date(infoMessage.createdAt).getTime() + 3000,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {infoMessage.isEdited && (
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-base-content/60">Edited</span>
                  <span className="badge badge-warning badge-sm">Yes</span>
                </div>
              )}
              {infoMessage.isPinned && (
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-base-content/60">Pinned</span>
                  <span className="badge badge-primary badge-sm">Yes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ FORWARD MODAL ══ */}
      {showForwardModal && (
        <div
          className={`${modalOverlay} z-[110]`}
          onClick={() => {
            setShowForwardModal(false);
            setForwardMessage(null);
          }}
        >
          <div className={modalCard} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Forward to</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardMessage(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              >
                <BsX size={18} />
              </button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (forwardMessage === "__multi__")
                      forwardSelectedMessages(chat);
                    else confirmForward(chat);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 cursor-pointer transition-colors"
                >
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={chat.avatar} alt={chat.name} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{chat.name}</p>
                    {chat.isGroup && (
                      <p className="text-xs text-base-content/50">
                        Group · {chat.members?.length} members
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className={`${modalCardMd} p-0`}>
            <div className="px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold mb-1">Delete message?</h3>
              <p className="text-sm text-base-content/60">
                {deleteMessageId === "__multi__"
                  ? `Delete ${selectedMessageIds.length} message(s)?`
                  : "Choose who to delete for."}
              </p>
            </div>
            <div className="px-4 pb-5 flex flex-col gap-2">
              {(deleteIsMe || deleteMessageId === "__multi__") && (
                <RemoveActionButton
                  onClick={() => confirmDeleteMessage("everyone")}
                  fullWidth
                  size="md"
                  label="Delete for everyone"
                />
              )}
              <button
                onClick={() => confirmDeleteMessage("me")}
                className="btn btn-outline w-full active:scale-95 transition-transform"
              >
                Delete for me
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteMessageId(null);
                }}
                className="btn btn-ghost w-full active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatModals;
