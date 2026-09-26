import { BsCamera } from "react-icons/bs";
import ImageCropView from "../ImageCropModal.jsx";

const QUICK_PRESETS = [
  "Available",
  "Busy",
  "At work",
  "In a meeting",
  "Can't talk, ChatApp only",
  "Urgent calls only",
  "At the gym",
  "Sleeping",
  "Battery about to die",
];

const EditProfileModal = ({
  show,
  onClose,
  editName,
  setEditName,
  editAbout,
  setEditAbout,
  editAvatar,
  setEditAvatar,
  isUpdating,
  handleUpdateProfile,
  cropImageSrc,
  setCropImageSrc,
  cropTarget,
  setCropTarget,
  handleFileSelect,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-base-100 w-full max-w-md rounded-2xl p-0 shadow-xl border border-base-300 animate-modal-pop overflow-hidden">
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

              {/* About / Description */}
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

                {/* Quick Status Presets */}
                <div className="mt-2.5">
                  <span className="text-[11px] font-semibold text-base-content/60 block mb-1.5">
                    Quick Status Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                    {QUICK_PRESETS.map((preset) => (
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
                  onClick={onClose}
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
  );
};

export default EditProfileModal;
