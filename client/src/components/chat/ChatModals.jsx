import React, { useState } from "react";
import { BsPeopleFill, BsX, BsCheck, BsCheckAll, BsCamera } from "react-icons/bs";
import { modalOverlay, modalCard, modalCardMd } from "../../constants/styles.js";
import ImageCropView from "./ImageCropModal.jsx";

/**
 * ChatModals – groups together all modals used within Chat.
 * Included modals: Create Group, Edit Profile, Delete Message, Message Info, Forward.
 */
const ChatModals = ({
  // Edit Profile
  showEditModal, setShowEditModal, editName, setEditName, editAvatar, setEditAvatar,
  isUpdating, handleUpdateProfile,
  
  // Create Group
  showCreateGroup, setShowCreateGroup, groupName, setGroupName, groupMemberIds,
  setGroupMemberIds, groupAvatarFile, setGroupAvatarFile, isCreatingGroup, handleCreateGroup, allUsers,
  
  // Delete
  showDeleteModal, setShowDeleteModal, deleteMessageId, setDeleteMessageId,
  deleteIsMe, confirmDeleteMessage, selectedMessageIds,
  
  // Info
  showInfoModal, setShowInfoModal, infoMessage,
  
  // Forward
  showForwardModal, setShowForwardModal, forwardMessage, setForwardMessage,
  chats, forwardSelectedMessages, confirmForward
}) => {
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);

  const handleFileSelect = (e, target) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
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
            {cropImageSrc && cropTarget === 'group' ? (
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
                    className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"
                  >
                    <BsX size={18} />
                  </button>
                </div>
                <div className="px-6 pb-6 space-y-4">
                  {/* Group name */}
                  <div>
                    <label className="text-sm font-medium text-base-content/70 mb-1 block">Group Name *</label>
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
                        onChange={(e) => handleFileSelect(e, 'group')}
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
                          <span className="text-xs text-base-content/50 mt-1 font-medium group-hover:text-primary">Upload</span>
                        </>
                      )}
                      {groupAvatarFile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BsCamera className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <label className="text-sm font-medium text-base-content/70 mt-2 block">Group Icon (optional)</label>
                  </div>
                  {/* Member selection */}
                  <div>
                    <label className="text-sm font-medium text-base-content/70 mb-2 block">Add Members *</label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-base-300 rounded-xl p-2">
                      {allUsers.map((u) => (
                        <label
                          key={u._id}
                          className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={groupMemberIds.includes(u._id)}
                            onChange={(e) =>
                              setGroupMemberIds((prev) =>
                                e.target.checked ? [...prev, u._id] : prev.filter((id) => id !== u._id),
                              )
                            }
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                            alt={u.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium text-sm">{u.name}</span>
                        </label>
                      ))}
                    </div>
                    {groupMemberIds.length > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {groupMemberIds.length} member{groupMemberIds.length > 1 ? "s" : ""} selected
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
          <div className={`bg-base-100 w-full max-w-md rounded-2xl p-0 shadow-xl border border-base-300 animate-modal-pop overflow-hidden`}>
            {cropImageSrc && cropTarget === 'profile' ? (
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
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input input-bordered w-full bg-base-200"
                      required
                    />
                  </div>
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative group cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-base-300 hover:border-primary flex flex-col items-center justify-center bg-base-200 overflow-hidden transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'profile')}
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
                          <span className="text-xs text-base-content/50 mt-1 font-medium group-hover:text-primary">Upload</span>
                        </>
                      )}
                      {editAvatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BsCamera className="text-white text-2xl" />
                        </div>
                      )}
                    </div>
                    <label className="block text-sm font-medium text-base-content/70 mt-2">Profile Image (optional)</label>
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
        <div className={`${modalOverlay} z-[110]`} onClick={() => setShowInfoModal(false)}>
          <div className={modalCard} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Message Info</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"
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
                <span className="text-base-content/60 font-medium">Delivered</span>
                <span className="flex items-center gap-2 font-semibold text-base-content/60">
                  <BsCheckAll />
                  {new Date(new Date(infoMessage.createdAt).getTime() + 1500).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base-content/60 font-medium">Read</span>
                <span className="flex items-center gap-2 font-semibold text-success">
                  <BsCheckAll />
                  {new Date(new Date(infoMessage.createdAt).getTime() + 3000).toLocaleTimeString([], {
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
          onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}
        >
          <div className={modalCard} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Forward to</h3>
              <button
                onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}
                className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"
              >
                <BsX size={18} />
              </button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (forwardMessage === "__multi__") forwardSelectedMessages(chat);
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
                <button
                  onClick={() => confirmDeleteMessage("everyone")}
                  className="btn btn-error w-full active:scale-95 transition-transform"
                >
                  🗑️ Delete for everyone
                </button>
              )}
              <button
                onClick={() => confirmDeleteMessage("me")}
                className="btn btn-outline w-full active:scale-95 transition-transform"
              >
                Delete for me
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteMessageId(null); }}
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
