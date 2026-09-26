import { useState, useRef, useEffect } from "react";
import { BsX, BsCameraFill, BsMegaphoneFill } from "react-icons/bs";

const CreateChannelModal = ({
  show,
  isOpen,
  onClose,
  channelName,
  setChannelName,
  channelDesc,
  setChannelDesc,
  onSubmit,
  handleCreateChannel,
}) => {
  const visible = show !== undefined ? show : isOpen;
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const handler = onSubmit || handleCreateChannel;
    if (handler) {
      handler(e, avatarFile);
    }
  };

  const defaultAvatar = channelName?.trim()
    ? `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(channelName.trim())}`
    : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-300">
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BsMegaphoneFill size={13} />
            </div>
            <h3 className="font-bold text-base">Create New Channel</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={20} />
          </button>
        </div>

        <form onSubmit={submitHandler} className="p-5 space-y-4">
          {/* Avatar selector */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-primary/40 hover:border-primary flex items-center justify-center cursor-pointer overflow-hidden bg-base-200 group transition-all"
              title="Click to choose channel image"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : defaultAvatar ? (
                <img
                  src={defaultAvatar}
                  alt="Avatar auto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <BsCameraFill size={24} className="text-base-content/40 group-hover:text-primary transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                Change
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-[11px] text-base-content/50 mt-1.5">
              Channel Icon (optional)
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
              Channel Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. Daily Tech Updates"
              className="input input-bordered w-full rounded-xl bg-base-200/60 focus:bg-base-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
              Description
            </label>
            <textarea
              value={channelDesc}
              onChange={(e) => setChannelDesc(e.target.value)}
              placeholder="Describe what broadcasts your channel shares…"
              rows={2}
              className="textarea textarea-bordered w-full rounded-xl bg-base-200/60 focus:bg-base-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <p className="text-[11px] text-base-content/60 bg-base-200/60 p-2.5 rounded-xl border border-base-300/50">
            💡 As the creator, you can broadcast messages, updates, and photos anytime. Followers can view and react to your posts!
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName.trim()}
              className="btn btn-sm btn-primary rounded-xl px-5 font-semibold"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
