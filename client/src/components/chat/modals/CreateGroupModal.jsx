import { BsPeopleFill, BsX, BsCamera } from "react-icons/bs";
import { modalCardMd } from "../../../constants/styles.js";
import ImageCropView from "../ImageCropModal.jsx";

const CreateGroupModal = ({
  show,
  onClose,
  groupName,
  setGroupName,
  groupMemberIds = [],
  setGroupMemberIds,
  groupAvatarFile,
  setGroupAvatarFile,
  isCreatingGroup,
  handleCreateGroup,
  allUsers = [],
  cropImageSrc,
  setCropImageSrc,
  cropTarget,
  setCropTarget,
  handleFileSelect,
}) => {
  if (!show) return null;

  return (
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
                onClick={onClose}
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
                  onClick={onClose}
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
  );
};

export default CreateGroupModal;
