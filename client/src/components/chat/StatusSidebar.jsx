import { useState, useRef, useEffect } from "react";
import {
  BsPlus,
  BsRecordCircle,
  BsPencilFill,
  BsCameraFill,
  BsPaletteFill,
  BsX,
  BsSendFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as statusService from "../../services/statusService.js";

const BACKGROUND_COLORS = [
  "#075e54", // Guftgugreen
  "#128c7e", // Teal
  "#25d366", // Light green
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#1f2937", // Dark Gray
];

const FONTS = [
  { id: "sans-serif", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "monospace", label: "Mono" },
  { id: "cursive", label: "Cursive" },
];

const StatusSidebar = ({
  loggedInUser,
  statuses,
  onUploadStatus,
  onViewStatus,
  isUploading,
  onStatusUpdated,
}) => {
  const fileInputRef = useRef(null);
  const [showTextStatusModal, setShowTextStatusModal] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [isPublishingText, setIsPublishingText] = useState(false);

  // Caption modal for image status
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageCaption, setImageCaption] = useState("");

  const handleClearImagePreview = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setImageCaption("");
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // STRICT PRD ENFORCEMENT: Video status is strictly excluded (PRD Section 1.3 & 147)
    if (file.type.startsWith("video/")) {
      toast.error(
        "Video Status is not supported. Only images and text are allowed for status updates.",
      );
      e.target.value = null;
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed for status");
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      e.target.value = null;
      return;
    }

    // Revoke previous object URL if any
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    // Open image caption preview modal
    setPendingImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = null;
  };

  const handleConfirmImageStatus = async () => {
    if (!pendingImageFile) return;
    try {
      const formData = new FormData();
      formData.append("image", pendingImageFile);
      if (imageCaption.trim()) {
        formData.append("caption", imageCaption.trim());
      }
      await onUploadStatus(formData);
      handleClearImagePreview();
      if (onStatusUpdated) onStatusUpdated();
    } catch (_err) {
      toast.error("Failed to upload status");
    }
  };

  const handlePublishTextStatus = async () => {
    if (!statusText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    try {
      setIsPublishingText(true);
      await statusService.uploadTextStatus({
        text: statusText.trim(),
        backgroundColor: selectedBg,
        fontFamily: selectedFont,
      });
      toast.success("Status published!");
      setStatusText("");
      setShowTextStatusModal(false);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to publish text status");
    } finally {
      setIsPublishingText(false);
    }
  };

  // Separate my statuses from others
  const myStatusGroup = statuses.find((s) => s.user._id === loggedInUser?._id);
  const otherStatuses = statuses.filter(
    (s) => s.user._id !== loggedInUser?._id,
  );

  return (
    <div className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 h-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300">
        <h2 className="text-xl font-bold">Status</h2>
        <div className="flex items-center gap-1 text-base-content/70">
          {/* Create Text Status Button */}
          <button
            onClick={() => setShowTextStatusModal(true)}
            className="p-2 hover:bg-base-300 rounded-full transition-colors"
            title="Type text status"
          >
            <BsPencilFill size={16} />
          </button>
          {/* Add Image Status Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-base-300 text-primary rounded-full transition-colors"
            title="Add photo status"
            disabled={isUploading}
          >
            <BsCameraFill size={19} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div
          className="flex items-center gap-4 p-4 hover:bg-base-200 cursor-pointer transition-all duration-300 hover:px-5 active:scale-[0.98]"
          onClick={() => {
            if (myStatusGroup && myStatusGroup.statuses.length > 0) {
              onViewStatus(myStatusGroup);
            } else {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full p-0.5 ${
                myStatusGroup && myStatusGroup.statuses.length > 0
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
                  : ""
              }`}
            >
              <img
                src={
                  loggedInUser?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`
                }
                alt="My Status"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 shadow-sm border-2 border-base-100 hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
            >
              <BsPlus size={16} />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px]">My status</h3>
            <p className="text-xs text-base-content/60 truncate">
              {isUploading
                ? "Uploading..."
                : myStatusGroup
                  ? `${myStatusGroup.statuses.length} status update${
                      myStatusGroup.statuses.length > 1 ? "s" : ""
                    } · Tap to view`
                  : "Tap to add status update"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-4 py-2 bg-base-200/30">
          <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Recent updates
          </h4>
        </div>

        {/* Other Users' Statuses */}
        <div className="flex flex-col">
          {otherStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-base-content/40 text-center gap-2">
              <BsRecordCircle size={32} />
              <p className="text-sm">No recent updates</p>
              <p className="text-xs text-base-content/40">
                Status updates from your contacts will appear here
              </p>
            </div>
          ) : (
            otherStatuses.map((group) => {
              const lastStatus = group.statuses[group.statuses.length - 1];
              return (
                <div
                  key={group.user._id}
                  className="flex items-center gap-4 p-4 hover:bg-base-200 cursor-pointer transition-all duration-300 hover:px-5 active:scale-[0.98] border-b border-base-200/50"
                  onClick={() => onViewStatus(group)}
                >
                  <div className="w-12 h-12 rounded-full p-0.5 ring-2 ring-primary ring-offset-2 ring-offset-base-100 flex-shrink-0">
                    <img
                      src={
                        group.user.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.name}`
                      }
                      alt={group.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] truncate">
                      {group.user.name}
                    </h3>
                    <p className="text-xs text-base-content/60">
                      {lastStatus.type === "text"
                        ? `"${lastStatus.text?.substring(0, 24)}..."`
                        : "Photo"}
                      {" · "}
                      {new Date(lastStatus.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── TEXT STATUS COMPOSER MODAL (PRD Section 50.1 & 50.2) ── */}
      {showTextStatusModal && (
        <div className="fixed inset-0 z-10000 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col transition-colors min-h-95 justify-between text-white"
            style={{ backgroundColor: selectedBg, fontFamily: selectedFont }}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowTextStatusModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <BsX size={26} />
              </button>

              <div className="flex items-center gap-2">
                {/* Font cycle */}
                <button
                  onClick={() => {
                    const currIdx = FONTS.findIndex(
                      (f) => f.id === selectedFont,
                    );
                    const nextIdx = (currIdx + 1) % FONTS.length;
                    setSelectedFont(FONTS[nextIdx].id);
                  }}
                  className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold hover:bg-white/30"
                  title="Change font"
                >
                  {FONTS.find((f) => f.id === selectedFont)?.label}
                </button>

                {/* Color cycle */}
                <button
                  onClick={() => {
                    const currIdx = BACKGROUND_COLORS.indexOf(selectedBg);
                    const nextIdx = (currIdx + 1) % BACKGROUND_COLORS.length;
                    setSelectedBg(BACKGROUND_COLORS[nextIdx]);
                  }}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                  title="Change background color"
                >
                  <BsPaletteFill size={16} />
                </button>
              </div>
            </div>

            {/* Input Textarea */}
            <div className="flex-1 flex items-center justify-center my-6">
              <textarea
                autoFocus
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Type a status…"
                maxLength={400}
                rows={4}
                className="w-full bg-transparent text-center text-2xl sm:text-3xl font-medium outline-none resize-none placeholder:text-white/40 drop-shadow"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">
                {400 - statusText.length} left
              </span>
              <button
                onClick={handlePublishTextStatus}
                disabled={!statusText.trim() || isPublishingText}
                className="btn btn-circle btn-primary shadow-lg disabled:opacity-50"
              >
                <BsSendFill size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE STATUS CAPTION MODAL ── */}
      {pendingImageFile && imagePreviewUrl && (
        <div className="fixed inset-0 z-10000 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-base-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-base-300">
              <h3 className="font-semibold text-sm">Add Status Caption</h3>
              <button
                onClick={handleClearImagePreview}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              >
                <BsX size={20} />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-80 overflow-hidden">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="max-h-80 w-auto object-contain"
              />
            </div>

            <div className="p-4 flex items-center gap-2">
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Add a caption…"
                className="input input-bordered input-sm flex-1 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmImageStatus();
                }}
              />
              <button
                onClick={handleConfirmImageStatus}
                disabled={isUploading}
                className="btn btn-primary btn-sm btn-circle"
              >
                <BsSendFill size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSidebar;
