import { useState, useRef, useEffect } from "react";
import {
  BsPlus,
  BsRecordCircle,
  BsPencilFill,
  BsCameraFill,
  BsPaletteFill,
  BsX,
  BsSendFill,
  BsMusicNoteBeamed,
  BsPlayFill,
  BsPauseFill,
  BsShieldLockFill,
  BsTextLeft,
  BsTextCenter,
  BsTextRight,
  BsEmojiSmile,
  BsArrowCounterclockwise,
  BsCloudArrowUpFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import * as statusService from "../../services/statusService.js";
import { playStatusTrack, stopStatusTrack } from "../../utils/statusMusic.js";
import SongPickerModal from "./status/SongPickerModal.jsx";
import StatusPrivacyModal, {
  getStoredPrivacy,
} from "./status/StatusPrivacyModal.jsx";

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
  isUploading: parentIsUploading,
  onStatusUpdated,
}) => {
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Modals state
  const [showTextStatusModal, setShowTextStatusModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyConfig, setPrivacyConfig] = useState(getStoredPrivacy());

  // Text Status State (PRD FR-05 & FR-06)
  const [statusText, setStatusText] = useState("");
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [textAlign, setTextAlign] = useState("center"); // 'center' | 'left' | 'right'
  const [showEmojiPickerText, setShowEmojiPickerText] = useState(false);
  const [isPublishingText, setIsPublishingText] = useState(false);

  // Media Status State (PRD FR-03, FR-04, FR-14)
  const [pendingMediaFile, setPendingMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [isPendingVideo, setIsPendingVideo] = useState(false);
  const [imageCaption, setImageCaption] = useState("");
  const [showEmojiPickerMedia, setShowEmojiPickerMedia] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Upload progress & retry states (PRD Section 9 & 10)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'uploading' | 'failed'
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");

  // Song status state
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(true);

  // Keep song audible while uploading/previewing status
  useEffect(() => {
    const isModalOpen =
      Boolean(pendingMediaFile && mediaPreviewUrl) || showTextStatusModal;
    if (selectedSong && isModalOpen && isSongPlaying) {
      playStatusTrack(selectedSong);
    } else {
      stopStatusTrack();
    }

    return () => {
      stopStatusTrack();
    };
  }, [
    selectedSong,
    pendingMediaFile,
    mediaPreviewUrl,
    showTextStatusModal,
    isSongPlaying,
  ]);

  const handleClearMediaPreview = () => {
    stopStatusTrack();
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setPendingMediaFile(null);
    setMediaPreviewUrl(null);
    setIsPendingVideo(false);
    setImageCaption("");
    setSelectedSong(null);
    setIsSongPlaying(true);
    setUploadState("idle");
    setUploadProgress(0);
    setUploadErrorMessage("");
    setShowEmojiPickerMedia(false);
  };

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  // Validate and process media file (Photo or Video - PRD FR-03 & FR-04)
  const processMediaFile = (file) => {
    if (!file) return;

    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(file.name || "");
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name || "");

    if (!isImage && !isVideo) {
      toast.error(
        "Unsupported file type. Please choose a photo (JPEG, PNG, WebP) or video (MP4, WebM, MOV).",
      );
      return;
    }

    // Maximum file size: 5MB restriction
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `${isVideo ? "Video" : "Photo"} exceeds the 5MB size limit. Please select a smaller file.`,
      );
      return;
    }

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    setPendingMediaFile(file);
    setIsPendingVideo(isVideo);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setUploadState("idle");
    setUploadProgress(0);
    setUploadErrorMessage("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processMediaFile(file);
    }
    e.target.value = null;
  };

  // Drag and drop handlers on Web (PRD Section 14.2)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processMediaFile(file);
    }
  };

  // Upload Media Status with Progress & Failure Handling (PRD Section 9, 10, AC-01, AC-02, AC-05)
  const handleConfirmMediaStatus = async () => {
    if (!pendingMediaFile) return;

    // Check offline status
    if (!navigator.onLine) {
      setUploadState("failed");
      setUploadErrorMessage(
        "No internet connection. Please check your network and retry.",
      );
      toast.error("No internet connection");
      return;
    }

    setUploadState("uploading");
    setUploadProgress(5);

    try {
      const formData = new FormData();
      formData.append("file", pendingMediaFile);
      if (isPendingVideo) {
        formData.append("video", pendingMediaFile);
      } else {
        formData.append("image", pendingMediaFile);
      }

      if (imageCaption.trim()) {
        formData.append("caption", imageCaption.trim());
      }

      // Privacy settings (PRD FR-08)
      formData.append("privacy", JSON.stringify(privacyConfig));

      // Attached song
      if (selectedSong) {
        if (selectedSong.audioFile) {
          formData.append("audio", selectedSong.audioFile);
        }
        formData.append("songTitle", selectedSong.title || "");
        formData.append("songArtist", selectedSong.artist || "");
        formData.append("songAudioUrl", selectedSong.audioUrl || "");
      }

      // Upload with real progress percentage
      await statusService.uploadStatusWithProgress(formData, (percent) => {
        setUploadProgress(Math.max(5, Math.min(99, percent)));
      });

      setUploadProgress(100);
      toast.success(`${isPendingVideo ? "Video" : "Photo"} status published!`);
      stopStatusTrack();
      handleClearMediaPreview();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setUploadState("failed");
      setUploadErrorMessage(
        err.message || "Status upload failed. Click retry to try again.",
      );
      toast.error(err.message || "Failed to upload status");
    }
  };

  // Publish Text Status (PRD FR-05, AC-03)
  const handlePublishTextStatus = async () => {
    if (!statusText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if (!navigator.onLine) {
      toast.error("No internet connection. Please reconnect to upload status.");
      return;
    }

    try {
      setIsPublishingText(true);
      await statusService.uploadTextStatus({
        text: statusText.trim(),
        backgroundColor: selectedBg,
        fontFamily: selectedFont,
        song: selectedSong
          ? {
              title: selectedSong.title,
              artist: selectedSong.artist,
              audioUrl: selectedSong.audioUrl,
            }
          : undefined,
        privacy: privacyConfig,
      });

      toast.success("Text status published!");
      stopStatusTrack();
      setStatusText("");
      setSelectedSong(null);
      setIsSongPlaying(true);
      setShowTextStatusModal(false);
      setShowEmojiPickerText(false);
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

  const isUploading = parentIsUploading || uploadState === "uploading";

  return (
    <div
      className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Web Drag & Drop Overlay Indicator (PRD Section 14.2) */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-content flex items-center justify-center shadow-xl mb-3 animate-bounce">
            <BsCloudArrowUpFill size={32} />
          </div>
          <h3 className="font-bold text-base text-base-content">
            Drop Photo or Video
          </h3>
          <p className="text-xs text-base-content/70 mt-1">
            Release to open Status media editor
          </p>
        </div>
      )}

      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 flex-shrink-0">
        <h2 className="text-xl font-bold">Status</h2>
        <div className="flex items-center gap-1 text-base-content/70">
          {/* Status Privacy Settings (PRD FR-08) */}
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="p-2 hover:bg-base-300 rounded-full transition-colors"
            title="Status Privacy Settings"
          >
            <BsShieldLockFill size={17} />
          </button>
          {/* Create Text Status Button (PRD FR-05) */}
          <button
            onClick={() => {
              setSelectedSong(null);
              setShowTextStatusModal(true);
            }}
            className="p-2 hover:bg-base-300 rounded-full transition-colors"
            title="Type text status"
          >
            <BsPencilFill size={16} />
          </button>
          {/* Add Photo/Video Status Button (PRD FR-03, FR-04) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-base-300 text-primary rounded-full transition-colors"
            title="Add photo or video status"
            disabled={isUploading}
          >
            <BsCameraFill size={19} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* My Status (PRD FR-12) */}
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
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 shadow-sm border-2 border-base-100 hover:scale-110 transition-transform cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              title="Add status update"
            >
              <BsPlus size={16} />
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px]">My status</h3>
            <p className="text-xs text-base-content/60 truncate">
              {isUploading
                ? `Uploading ${uploadProgress}%...`
                : myStatusGroup && myStatusGroup.statuses.length > 0
                  ? `${myStatusGroup.statuses.length} status update${
                      myStatusGroup.statuses.length > 1 ? "s" : ""
                    } · Tap to view`
                  : "Tap or drop media to add update"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-4 py-2 bg-base-200/30 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Recent updates
          </h4>
          <span className="text-[10px] text-base-content/40">
            Expires in 24h
          </span>
        </div>

        {/* Other Users' Statuses */}
        <div className="flex flex-col">
          {otherStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-base-content/40 text-center gap-2">
              <BsRecordCircle size={32} />
              <p className="text-sm font-medium">No recent updates</p>
              <p className="text-xs text-base-content/40 max-w-[220px]">
                Status updates from your contacts will appear here for 24 hours.
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
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-[15px] truncate">
                        {group.user.name}
                      </h3>
                      {lastStatus.song && (
                        <BsMusicNoteBeamed
                          className="text-primary flex-shrink-0"
                          size={12}
                          title={`Song: ${lastStatus.song.title}`}
                        />
                      )}
                    </div>
                    <p className="text-xs text-base-content/60">
                      {lastStatus.type === "text"
                        ? `"${lastStatus.text?.substring(0, 24)}..."`
                        : lastStatus.type === "video"
                          ? "Video"
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

      {/* Floating Action Bubbles to Add More Status (WhatsApp Style FAB) */}
      <div className="absolute bottom-6 right-5 flex flex-col items-center gap-2.5 z-30 pointer-events-auto">
        {/* Floating Text Status Bubble (Pencil) */}
        <button
          type="button"
          onClick={() => {
            setSelectedSong(null);
            setShowTextStatusModal(true);
          }}
          className="w-10 h-10 rounded-full bg-base-200/95 hover:bg-base-300 text-base-content/80 hover:text-base-content shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border border-base-300 cursor-pointer group relative backdrop-blur-xs"
          title="Create text status"
          aria-label="Create text status"
        >
          <BsPencilFill size={15} />
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-neutral text-neutral-content text-[11px] rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
            Text status
          </span>
        </button>

        {/* Floating Media Status Bubble (Camera / Photo & Video) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-13 h-13 rounded-full bg-primary text-primary-content shadow-lg hover:shadow-xl hover:bg-primary/90 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group relative"
          title="Add photo or video status"
          aria-label="Add photo or video status"
        >
          <BsCameraFill size={21} />
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-neutral text-neutral-content text-[11px] rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
            Photo or Video
          </span>
        </button>
      </div>

      {/* ── TEXT STATUS COMPOSER MODAL (PRD FR-05 & FR-06) ── */}
      {showTextStatusModal && (
        <div className="fixed inset-0 z-10000 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col transition-colors min-h-95 justify-between text-white relative"
            style={{ backgroundColor: selectedBg, fontFamily: selectedFont }}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  stopStatusTrack();
                  setSelectedSong(null);
                  setIsSongPlaying(true);
                  setShowTextStatusModal(false);
                  setShowEmojiPickerText(false);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Discard status"
              >
                <BsX size={26} />
              </button>

              <div className="flex items-center gap-2">
                {/* Emoji Trigger */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPickerText((prev) => !prev)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showEmojiPickerText
                      ? "bg-white text-primary"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title="Add emoji"
                >
                  <BsEmojiSmile size={16} />
                </button>

                {/* Text Alignment (PRD FR-05 & FR-06) */}
                <button
                  type="button"
                  onClick={() => {
                    setTextAlign((prev) =>
                      prev === "center"
                        ? "left"
                        : prev === "left"
                          ? "right"
                          : "center",
                    );
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white cursor-pointer"
                  title={`Align text (${textAlign})`}
                >
                  {textAlign === "center" ? (
                    <BsTextCenter size={16} />
                  ) : textAlign === "left" ? (
                    <BsTextLeft size={16} />
                  ) : (
                    <BsTextRight size={16} />
                  )}
                </button>

                {/* Music Song Button */}
                <button
                  type="button"
                  onClick={() => setShowSongPicker(true)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    selectedSong
                      ? "bg-primary text-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title="Add Song"
                >
                  <BsMusicNoteBeamed size={16} />
                </button>

                {/* Font cycle */}
                <button
                  onClick={() => {
                    const currIdx = FONTS.findIndex(
                      (f) => f.id === selectedFont,
                    );
                    const nextIdx = (currIdx + 1) % FONTS.length;
                    setSelectedFont(FONTS[nextIdx].id);
                  }}
                  className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold hover:bg-white/30 cursor-pointer"
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
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"
                  title="Change background color"
                >
                  <BsPaletteFill size={16} />
                </button>
              </div>
            </div>

            {/* Emoji Picker Popover for Text Status */}
            {showEmojiPickerText && (
              <div className="absolute top-16 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setStatusText((prev) => prev + emojiData.emoji);
                    textInputRef.current?.focus();
                  }}
                  width={300}
                  height={350}
                />
              </div>
            )}

            {/* Song Pill Indicator if chosen */}
            {selectedSong && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-black/40 backdrop-blur-md rounded-2xl text-xs text-white max-w-full my-2 border border-white/20 animate-fade-in shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsSongPlaying((prev) => !prev)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 cursor-pointer ${
                      isSongPlaying
                        ? "bg-primary text-primary-content"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    title={isSongPlaying ? "Pause preview" : "Play preview"}
                  >
                    {isSongPlaying ? (
                      <BsPauseFill size={14} />
                    ) : (
                      <BsPlayFill size={14} className="ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0 flex items-center gap-1.5 truncate">
                    <span className="font-semibold truncate">
                      {selectedSong.title}
                    </span>
                    <span className="text-white/70 truncate">
                      • {selectedSong.artist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {isSongPlaying ? (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-primary/30 text-primary-content rounded-full text-[10px] font-semibold">
                      <span className="w-1 h-2 bg-white rounded-full animate-pulse" />
                      <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" />
                      <span className="w-1 h-2 bg-white rounded-full animate-pulse" />
                      <span className="ml-1 hidden sm:inline">Audible</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/60 px-1.5 py-0.5 bg-white/10 rounded-full">
                      Paused
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      stopStatusTrack();
                      setSelectedSong(null);
                    }}
                    className="hover:text-error text-white/70 p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
                    title="Remove song"
                  >
                    <BsX size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Input Textarea */}
            <div className="flex-1 flex items-center justify-center my-6">
              <textarea
                ref={textInputRef}
                autoFocus
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Type a status…"
                maxLength={400}
                rows={4}
                style={{ textAlign }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-medium outline-none resize-none placeholder:text-white/40 drop-shadow"
              />
            </div>

            {/* Bottom Actions with Privacy Pill */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              {/* Privacy Pill (PRD FR-08) */}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Change status audience"
              >
                <BsShieldLockFill size={11} />
                <span>
                  Status (
                  {privacyConfig.type === "contacts"
                    ? "contacts"
                    : privacyConfig.type === "contacts_except"
                      ? `${privacyConfig.excludedUsers?.length || 0} excluded`
                      : `${privacyConfig.allowedUsers?.length || 0} included`}
                  )
                </span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">
                  {400 - statusText.length}
                </span>
                <button
                  onClick={handlePublishTextStatus}
                  disabled={!statusText.trim() || isPublishingText}
                  className="btn btn-circle btn-primary shadow-lg disabled:opacity-50 cursor-pointer"
                  title="Send status"
                >
                  {isPublishingText ? (
                    <span className="loading loading-spinner loading-xs text-white" />
                  ) : (
                    <BsSendFill size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO & VIDEO STATUS PREVIEW MODAL (PRD FR-03, FR-04, FR-09) ── */}
      {pendingMediaFile && mediaPreviewUrl && (
        <div className="fixed inset-0 z-10000 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-base-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-base-300">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  {isPendingVideo ? "Add Video Status" : "Add Photo Status"}
                </h3>
                <span className="badge badge-xs badge-primary font-mono">
                  {(pendingMediaFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <button
                onClick={handleClearMediaPreview}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
                title="Discard"
              >
                <BsX size={20} />
              </button>
            </div>

            {/* Media Preview Box (Photo or Video - FR-03 & FR-04) */}
            <div className="relative bg-black flex items-center justify-center max-h-80 overflow-hidden min-h-60">
              {isPendingVideo ? (
                <video
                  src={mediaPreviewUrl}
                  className="max-h-80 w-auto object-contain"
                  autoPlay
                  loop
                  playsInline
                  muted={Boolean(selectedSong && isSongPlaying)}
                />
              ) : (
                <img
                  src={mediaPreviewUrl}
                  alt="Preview"
                  className="max-h-80 w-auto object-contain"
                />
              )}
            </div>

            {/* Song Pill / Add Song Button */}
            <div className="px-4 pt-2.5">
              {selectedSong ? (
                <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/25 rounded-2xl text-xs animate-fade-in shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsSongPlaying((prev) => !prev)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 cursor-pointer ${
                        isSongPlaying
                          ? "bg-primary text-primary-content"
                          : "bg-base-300 text-base-content hover:bg-primary/20 hover:text-primary"
                      }`}
                      title={isSongPlaying ? "Pause preview" : "Play preview"}
                    >
                      {isSongPlaying ? (
                        <BsPauseFill size={14} />
                      ) : (
                        <BsPlayFill size={14} className="ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0 flex items-center gap-1.5 truncate">
                      <span className="font-semibold truncate">
                        {selectedSong.title}
                      </span>
                      <span className="text-base-content/60 truncate">
                        • {selectedSong.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Audible indicator */}
                    {isSongPlaying ? (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-semibold tracking-wide">
                        <span className="w-1 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="w-1 h-3.5 bg-primary rounded-full animate-bounce" />
                        <span className="w-1 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="ml-1 hidden sm:inline">Audible</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-base-content/50 px-1.5 py-0.5 bg-base-300/60 rounded-full">
                        Paused
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        stopStatusTrack();
                        setSelectedSong(null);
                      }}
                      className="hover:text-error text-base-content/60 p-1 rounded-full hover:bg-base-200 transition-colors flex-shrink-0 cursor-pointer"
                      title="Remove song"
                    >
                      <BsX size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSongPicker(true)}
                  className="btn btn-ghost btn-xs text-primary gap-1.5 font-medium cursor-pointer"
                >
                  <BsMusicNoteBeamed size={14} /> Add Song to Status
                </button>
              )}
            </div>

            {/* Uploading progress bar (PRD Section 9.2) */}
            {uploadState === "uploading" && (
              <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Uploading {isPendingVideo ? "video" : "photo"}...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Failure Banner with Retry (PRD Section 9.4, 10, AC-05) */}
            {uploadState === "failed" && (
              <div className="px-4 py-2.5 bg-error/10 border-t border-error/20 flex items-center justify-between text-xs text-error animate-fade-in">
                <span className="truncate pr-2">
                  {uploadErrorMessage || "Upload failed."}
                </span>
                <button
                  type="button"
                  onClick={handleConfirmMediaStatus}
                  className="btn btn-xs btn-error text-white rounded-xl gap-1 flex-shrink-0 cursor-pointer"
                >
                  <BsArrowCounterclockwise size={13} /> Retry
                </button>
              </div>
            )}

            {/* Emoji Popover for Media Caption */}
            {showEmojiPickerMedia && (
              <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setImageCaption((prev) => prev + emojiData.emoji);
                  }}
                  width={300}
                  height={340}
                />
              </div>
            )}

            {/* Caption & Send */}
            <div className="p-4 flex items-center gap-2 border-t border-base-200">
              <button
                type="button"
                onClick={() => setShowEmojiPickerMedia((prev) => !prev)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showEmojiPickerMedia
                    ? "text-primary bg-primary/10"
                    : "text-base-content/60 hover:text-base-content"
                }`}
                title="Add emoji to caption"
              >
                <BsEmojiSmile size={18} />
              </button>

              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Add a caption…"
                className="input input-bordered input-sm flex-1 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && uploadState !== "uploading") {
                    handleConfirmMediaStatus();
                  }
                }}
              />

              {/* Status Privacy Pill in Media Modal */}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="btn btn-ghost btn-xs text-base-content/70 hover:text-primary gap-1 font-normal flex-shrink-0"
                title="Change status privacy"
              >
                <BsShieldLockFill size={12} className="text-primary" />
                <span className="capitalize hidden sm:inline">
                  {privacyConfig.type === "contacts"
                    ? "Contacts"
                    : privacyConfig.type === "contacts_except"
                      ? `${privacyConfig.excludedUsers?.length || 0} Excluded`
                      : `${privacyConfig.allowedUsers?.length || 0} Included`}
                </span>
              </button>

              <button
                onClick={handleConfirmMediaStatus}
                disabled={uploadState === "uploading"}
                className="btn btn-primary btn-sm btn-circle cursor-pointer flex-shrink-0"
                title="Post status"
              >
                {uploadState === "uploading" ? (
                  <span className="loading loading-spinner loading-xs text-white" />
                ) : (
                  <BsSendFill size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        onSelectSong={(song) => {
          setSelectedSong(song);
          setIsSongPlaying(true);
        }}
      />

      {/* Status Privacy Modal (PRD FR-08) */}
      <StatusPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSavePrivacy={(cfg) => setPrivacyConfig(cfg)}
      />
    </div>
  );
};

export default StatusSidebar;
