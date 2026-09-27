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
  BsMagic,
  BsCheck2,
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import * as statusService from "../../services/statusService.js";
import { playStatusTrack, stopStatusTrack } from "../../utils/statusMusic.js";
import SongPickerModal from "./status/SongPickerModal.jsx";
import StatusPrivacyModal, {
  getStoredPrivacy,
} from "./status/StatusPrivacyModal.jsx";
import StatusStudioModal from "./status/StatusStudioModal.jsx";
import {
  SOLID_BACKGROUNDS,
  GRADIENT_BACKGROUNDS,
  CREATIVE_PATTERNS,
  STATUS_TEXT_COLORS,
  getPatternStyle,
} from "../../utils/statusBackgrounds.js";

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
  const [selectedBg, setSelectedBg] = useState(GRADIENT_BACKGROUNDS[0].value);
  const [selectedTextColor, setSelectedTextColor] = useState("#ffffff");
  const [selectedPattern, setSelectedPattern] = useState("none");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [textAlign, setTextAlign] = useState("center"); // 'center' | 'left' | 'right'
  const [showEmojiPickerText, setShowEmojiPickerText] = useState(false);
  const [showBgDrawer, setShowBgDrawer] = useState(false);
  const [bgDrawerTab, setBgDrawerTab] = useState("gradients"); // "gradients" | "solid" | "patterns" | "text_color"
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
  // Upload Media Status with Progress & Failure Handling (PRD Section 9, 10, 16, 20, 22)
  const handleConfirmMediaStatus = async (studioPayload) => {
    const fileToUpload = studioPayload?.mediaFile || pendingMediaFile;
    if (!fileToUpload) return;

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
      formData.append("file", fileToUpload);
      if (isPendingVideo) {
        formData.append("video", fileToUpload);
      } else {
        formData.append("image", fileToUpload);
      }

      const finalCaption =
        studioPayload?.caption !== undefined
          ? studioPayload.caption
          : imageCaption;
      if (finalCaption.trim()) {
        formData.append("caption", finalCaption.trim());
      }

      // Privacy settings (PRD FR-08)
      const finalPrivacy = studioPayload?.privacy || privacyConfig;
      formData.append("privacy", JSON.stringify(finalPrivacy));

      // Video Selection & Trimming (PRD Section 16 & 17)
      if (studioPayload?.videoSelection) {
        formData.append(
          "videoSelection",
          JSON.stringify(studioPayload.videoSelection),
        );
        formData.append(
          "videoStart",
          studioPayload.videoSelection.startTime || 0,
        );
        formData.append("videoEnd", studioPayload.videoSelection.endTime || 0);
        formData.append(
          "videoVolume",
          studioPayload.videoSelection.volume !== undefined
            ? studioPayload.videoSelection.volume
            : 1,
        );
      }

      // Filter & Overlays (PRD Section 15, 25, 26, 27, 28)
      if (studioPayload?.filter) {
        formData.append("filter", studioPayload.filter);
      }
      if (studioPayload?.overlays) {
        formData.append("overlays", JSON.stringify(studioPayload.overlays));
      }

      // Attached song (PRD Section 18, 19, 20)
      const songToAttach = studioPayload?.song || selectedSong;
      if (songToAttach) {
        if (songToAttach.audioFile) {
          formData.append("audio", songToAttach.audioFile);
        }
        formData.append("songTitle", songToAttach.title || "");
        formData.append("songArtist", songToAttach.artist || "");
        formData.append("songAudioUrl", songToAttach.audioUrl || "");
        formData.append("songStartTime", songToAttach.startTime || 0);
        formData.append("songEndTime", songToAttach.endTime || 0);
        formData.append(
          "songVolume",
          songToAttach.volume !== undefined ? songToAttach.volume : 1,
        );
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
        textColor: selectedTextColor,
        bgPattern: selectedPattern,
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
      setSelectedTextColor("#ffffff");
      setSelectedPattern("none");
      setShowBgDrawer(false);
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

  // Magic creativity randomizer
  const handleMagicShuffle = () => {
    const useGradient = Math.random() > 0.25;
    const bgList = useGradient ? GRADIENT_BACKGROUNDS : SOLID_BACKGROUNDS;
    const randomBg = bgList[Math.floor(Math.random() * bgList.length)].value;
    const randomPattern =
      CREATIVE_PATTERNS[Math.floor(Math.random() * CREATIVE_PATTERNS.length)].id;
    const randomTextColor =
      STATUS_TEXT_COLORS[
        Math.floor(Math.random() * (STATUS_TEXT_COLORS.length - 1))
      ].value;
    setSelectedBg(randomBg);
    setSelectedPattern(randomPattern);
    setSelectedTextColor(randomTextColor);
    toast.success("Creative background & text applied!", { icon: "✨" });
  };

  // Separate my statuses from others
  const myStatusGroup = statuses.find((s) => s.user._id === loggedInUser?._id);
  const otherStatuses = statuses.filter(
    (s) => s.user._id !== loggedInUser?._id,
  );

  const isUploading = parentIsUploading || uploadState === "uploading";

  return (
    <div
      className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-r-theme-soothing chat-sidebar-panel h-full relative"
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
      <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-b-theme-soothing flex-shrink-0">
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
      <div className="fixed md:absolute bottom-20 md:bottom-6 right-5 flex flex-col items-center gap-2.5 z-30 pointer-events-auto">
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
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col transition-all min-h-95 justify-between relative overflow-hidden text-white"
            style={{ background: selectedBg, fontFamily: selectedFont }}
          >
            {/* Pattern / Texture Overlay */}
            {selectedPattern && selectedPattern !== "none" && (
              <div
                className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity"
                style={getPatternStyle(selectedPattern)}
              />
            )}

            {/* Top Toolbar */}
            <div className="flex items-center justify-between relative z-20">
              <button
                onClick={() => {
                  stopStatusTrack();
                  setSelectedSong(null);
                  setIsSongPlaying(true);
                  setShowTextStatusModal(false);
                  setShowEmojiPickerText(false);
                  setShowBgDrawer(false);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Discard status"
              >
                <BsX size={26} />
              </button>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Magic Shuffle Button */}
                <button
                  type="button"
                  onClick={handleMagicShuffle}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white cursor-pointer active:scale-95 transition-transform"
                  title="Surprise me with magic background creativity!"
                >
                  <BsMagic size={15} />
                </button>

                {/* Emoji Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPickerText((prev) => !prev);
                    setShowBgDrawer(false);
                  }}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showEmojiPickerText
                      ? "bg-white text-primary"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title="Add emoji"
                >
                  <BsEmojiSmile size={15} />
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
                    <BsTextCenter size={15} />
                  ) : textAlign === "left" ? (
                    <BsTextLeft size={15} />
                  ) : (
                    <BsTextRight size={15} />
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
                  <BsMusicNoteBeamed size={15} />
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
                  className="px-2.5 py-1 bg-white/20 rounded-full text-[11px] font-semibold hover:bg-white/30 cursor-pointer"
                  title="Change font"
                >
                  {FONTS.find((f) => f.id === selectedFont)?.label}
                </button>

                {/* Text Color Picker Quick Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPickerText(false);
                    setBgDrawerTab("text_color");
                    setShowBgDrawer((prev) => !prev || bgDrawerTab !== "text_color");
                  }}
                  className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    showBgDrawer && bgDrawerTab === "text_color"
                      ? "bg-white ring-2 ring-white"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                  title="Change text color (live preview)"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: selectedTextColor }}
                  />
                </button>

                {/* Background Creativity Palette Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPickerText(false);
                    if (showBgDrawer && bgDrawerTab !== "text_color") {
                      setShowBgDrawer(false);
                    } else {
                      setBgDrawerTab("gradients");
                      setShowBgDrawer(true);
                    }
                  }}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    showBgDrawer && bgDrawerTab !== "text_color"
                      ? "bg-white text-primary ring-2 ring-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title="Background Creativity (Gradients, Solid, Patterns)"
                >
                  <BsPaletteFill size={15} />
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
              <div className="flex items-center justify-between px-3.5 py-2 bg-black/40 backdrop-blur-md rounded-2xl text-xs text-white max-w-full my-2 border border-white/20 animate-fade-in shadow-md relative z-10">
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

            {/* Input Textarea (Live Preview in Selected Text Color) */}
            <div className="flex-1 flex items-center justify-center my-6 relative z-10">
              <textarea
                ref={textInputRef}
                autoFocus
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Type a status…"
                maxLength={400}
                rows={4}
                style={{ textAlign, color: selectedTextColor }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-medium outline-none resize-none placeholder:text-white/40 drop-shadow transition-colors"
              />
            </div>

            {/* ── BACKGROUND CREATIVITY & TEXT COLOR DRAWER ── */}
            {showBgDrawer && (
              <div className="absolute inset-x-3 bottom-16 z-30 bg-black/85 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl animate-slide-up flex flex-col gap-2.5">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      type="button"
                      onClick={() => setBgDrawerTab("gradients")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        bgDrawerTab === "gradients"
                          ? "bg-primary text-white shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      🎨 Gradients
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgDrawerTab("solid")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        bgDrawerTab === "solid"
                          ? "bg-primary text-white shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      🟦 Solid
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgDrawerTab("patterns")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        bgDrawerTab === "patterns"
                          ? "bg-primary text-white shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      ✨ Patterns
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgDrawerTab("text_color")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        bgDrawerTab === "text_color"
                          ? "bg-primary text-white shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      🔤 Text Color
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBgDrawer(false)}
                    className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                  >
                    <BsX size={18} />
                  </button>
                </div>

                {/* Tab: Gradients */}
                {bgDrawerTab === "gradients" && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
                    {GRADIENT_BACKGROUNDS.map((g) => {
                      const isSelected = selectedBg === g.value;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedBg(g.value)}
                          title={g.label}
                          className={`w-9 h-9 rounded-xl flex-shrink-0 transition-transform cursor-pointer flex items-center justify-center border border-white/20 ${
                            isSelected ? "scale-110 ring-2 ring-white shadow-lg" : "hover:scale-105"
                          }`}
                          style={{ background: g.value }}
                        >
                          {isSelected && <BsCheck2 size={16} className="text-white drop-shadow-md stroke-[1]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab: Solid Colors */}
                {bgDrawerTab === "solid" && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
                    {SOLID_BACKGROUNDS.map((c) => {
                      const isSelected = selectedBg === c.value;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedBg(c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform cursor-pointer flex items-center justify-center border border-white/20 ${
                            isSelected ? "scale-115 ring-2 ring-white shadow-lg" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.value }}
                        >
                          {isSelected && <BsCheck2 size={15} className="text-white drop-shadow-md stroke-[1]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab: Patterns */}
                {bgDrawerTab === "patterns" && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
                    {CREATIVE_PATTERNS.map((p) => {
                      const isSelected = selectedPattern === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPattern(p.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#25D366] text-[#0B141A] font-bold shadow-md"
                              : "bg-white/10 hover:bg-white/20 text-white/80"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab: Text Color */}
                {bgDrawerTab === "text_color" && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
                    {STATUS_TEXT_COLORS.map((tc) => {
                      const isSelected = selectedTextColor === tc.value;
                      return (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => setSelectedTextColor(tc.value)}
                          title={tc.label}
                          className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform cursor-pointer flex items-center justify-center border border-white/20 ${
                            isSelected ? "scale-115 ring-2 ring-white shadow-lg" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: tc.value }}
                        >
                          {isSelected && (
                            <BsCheck2
                              size={15}
                              className={tc.value === "#ffffff" || tc.value === "#ffeb3b" || tc.value === "#00e5ff" ? "text-black stroke-[1]" : "text-white stroke-[1]"}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions with Privacy Pill */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-20">
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

      {/* ── PHOTO & VIDEO STATUS CREATION STUDIO (PRD Section 12, 16, 20, 22, 36) ── */}
      <StatusStudioModal
        isOpen={Boolean(pendingMediaFile && mediaPreviewUrl)}
        mediaFile={pendingMediaFile}
        mediaPreviewUrl={mediaPreviewUrl}
        isVideo={isPendingVideo}
        privacyConfig={privacyConfig}
        onSavePrivacy={(cfg) => setPrivacyConfig(cfg)}
        onClose={handleClearMediaPreview}
        onPublish={handleConfirmMediaStatus}
        uploadState={uploadState}
        uploadProgress={uploadProgress}
        uploadErrorMessage={uploadErrorMessage}
        onRetryUpload={() => handleConfirmMediaStatus()}
      />

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
