import { useState, useRef, useEffect, useCallback } from "react";
import {
  BsX,
  BsCheck2,
  BsPlayFill,
  BsPauseFill,
  BsCrop,
  BsArrowRepeat,
  BsEmojiSmile,
  BsPencilFill,
  BsMusicNoteBeamed,
  BsVolumeUpFill,
  BsVolumeMuteFill,
  BsShieldLockFill,
  BsTrash3,
  BsArrowCounterclockwise,
  BsSendFill,
  BsSliders,
  BsAt,
  BsPaletteFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import SongPickerModal from "./SongPickerModal.jsx";
import StatusPrivacyModal from "./StatusPrivacyModal.jsx";
import StatusCropModal from "./StatusCropModal.jsx";
import {
  formatTimestamp,
  playStatusTrack,
  stopStatusTrack,
} from "../../../utils/statusMusic.js";
import { getContacts } from "../../../services/contactService.js";

export const STATUS_FILTERS = [
  { id: "none", name: "Original", css: "none" },
  { id: "warm", name: "Warm", css: "sepia(0.35) saturate(1.4) brightness(1.05)" },
  { id: "cool", name: "Cool", css: "hue-rotate(185deg) saturate(1.2)" },
  { id: "bright", name: "Bright", css: "brightness(1.2) contrast(1.1)" },
  { id: "mono", name: "Mono", css: "grayscale(1) contrast(1.2)" },
  { id: "vintage", name: "Vintage", css: "sepia(0.6) contrast(0.95)" },
  { id: "sunset", name: "Sunset", css: "sepia(0.4) saturate(1.8) hue-rotate(-20deg)" },
];

const PEN_COLORS = [
  "#ffffff",
  "#25d366",
  "#34b7f1",
  "#fbc02d",
  "#ff2e74",
  "#9c27b0",
  "#e53935",
  "#000000",
];

const ASPECT_RATIOS = [
  { id: "original", label: "Original" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "16:9", label: "16:9" },
];

const StatusStudioModal = ({
  isOpen,
  mediaFile,
  mediaPreviewUrl,
  isVideo,
  privacyConfig,
  onSavePrivacy,
  onClose,
  onPublish,
  uploadState, // 'idle' | 'uploading' | 'failed'
  uploadProgress,
  uploadErrorMessage,
  onRetryUpload,
}) => {
  // Media working file & URL (supports interactive cropping updates)
  const [workingMediaFile, setWorkingMediaFile] = useState(mediaFile);
  const [workingMediaUrl, setWorkingMediaUrl] = useState(mediaPreviewUrl);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    setWorkingMediaFile(mediaFile);
    setWorkingMediaUrl(mediaPreviewUrl);
  }, [mediaFile, mediaPreviewUrl]);

  // Clean up object URLs created during cropping
  useEffect(() => {
    return () => {
      if (workingMediaUrl && workingMediaUrl !== mediaPreviewUrl && workingMediaUrl.startsWith("blob:")) {
        URL.revokeObjectURL(workingMediaUrl);
      }
    };
  }, [workingMediaUrl, mediaPreviewUrl]);

  // Active tool mode: null | 'crop' | 'filter' | 'text' | 'draw' | 'sticker' | 'mix'
  const [activeTool, setActiveTool] = useState(null);

  // Video Timeline & Trim State (PRD Section 16 & 17)
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoStart, setVideoStart] = useState(0);
  const [videoEnd, setVideoEnd] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Audio Mix State (PRD Section 22)
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.85);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Song Attachment
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Visual Editing
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState("original");

  // Drawing Canvas
  const [penColor, setPenColor] = useState("#25d366");
  const [penWidth, setPenWidth] = useState(5);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Text & Sticker Overlays
  const [overlays, setOverlays] = useState([]);
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextColor, setNewTextColor] = useState("#ffffff");

  // Caption & Mentions
  const [caption, setCaption] = useState("");
  const [showEmojiPickerCaption, setShowEmojiPickerCaption] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  // Discard Confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captionInputRef = useRef(null);

  // Load Contacts for @Mentions
  useEffect(() => {
    if (isOpen) {
      getContacts()
        .then((data) => setContacts(Array.isArray(data) ? data : []))
        .catch(() => setContacts([]));
    }
  }, [isOpen]);

  // Video metadata loading
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 10;
      setVideoDuration(dur);
      setVideoStart(0);
      setVideoEnd(Math.min(dur, 30));
      videoRef.current.currentTime = 0;
      videoRef.current.volume = isVideoMuted ? 0 : videoVolume;
    }
  };

  // Video playback loop within trim boundaries
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setVideoCurrentTime(cur);

    if (videoEnd > videoStart && cur >= videoEnd) {
      videoRef.current.currentTime = videoStart;
      videoRef.current.play().catch(() => {});
    }
  };

  // Synchronize Audio & Video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isVideoMuted ? 0 : videoVolume;
    }

    if (selectedSong && !isMusicMuted && isVideoPlaying) {
      playStatusTrack(selectedSong, {
        startTime: selectedSong.startTime || 0,
        endTime: selectedSong.endTime || (selectedSong.duration || 60),
        volume: musicVolume,
      });
    } else {
      stopStatusTrack();
    }

    return () => {
      stopStatusTrack();
    };
  }, [
    selectedSong,
    isMusicMuted,
    musicVolume,
    videoVolume,
    isVideoMuted,
    isVideoPlaying,
  ]);

  // Toggle Video Play/Pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        if (videoRef.current.currentTime >= videoEnd) {
          videoRef.current.currentTime = videoStart;
        }
        videoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === "input" || targetTag === "textarea";

      if (e.key === "Escape") {
        e.preventDefault();
        if (activeTool) {
          setActiveTool(null);
        } else {
          handleAttemptClose();
        }
        return;
      }

      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndoDrawing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTool, isVideoPlaying, videoStart, videoEnd]);

  // Canvas Drawing Implementation
  const startDrawing = (e) => {
    if (activeTool !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    const newStroke = {
      color: penColor,
      width: penWidth,
      points: [{ x, y }],
    };
    setDrawingHistory((prev) => [...prev, newStroke]);
  };

  const drawMove = (e) => {
    if (!isDrawing || activeTool !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setDrawingHistory((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const current = { ...updated[updated.length - 1] };
      current.points = [...current.points, { x, y }];
      updated[updated.length - 1] = current;
      return updated;
    });

    renderCanvas();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawingHistory.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawingHistory]);

  useEffect(() => {
    renderCanvas();
  }, [drawingHistory, renderCanvas]);

  const handleUndoDrawing = () => {
    if (drawingHistory.length === 0) return;
    setDrawingHistory((prev) => prev.slice(0, -1));
  };

  const handleClearDrawing = () => {
    setDrawingHistory([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Overlay Management
  const handleAddTextOverlay = () => {
    if (!newTextContent.trim()) return;
    const newOverlay = {
      id: "overlay_" + Date.now(),
      type: "text",
      content: newTextContent.trim(),
      color: newTextColor,
      x: 50,
      y: 45,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setNewTextContent("");
    setActiveTool(null);
  };

  const handleAddEmojiOverlay = (emojiData) => {
    const newOverlay = {
      id: "overlay_" + Date.now(),
      type: "sticker",
      content: emojiData.emoji,
      x: 50,
      y: 50,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setActiveTool(null);
  };

  const handleRemoveOverlay = (id) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  };

  // Caption & Mentions
  const handleCaptionChange = (e) => {
    const text = e.target.value;
    setCaption(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const matches = contacts.filter((c) => {
        const name = (c.customName || c.name || "").toLowerCase();
        return name.includes(query);
      });
      setMentionSuggestions(matches.slice(0, 5));
    } else {
      setMentionSuggestions([]);
    }
  };

  const insertMention = (contact) => {
    const contactName = contact.customName || contact.name || "Contact";
    const cursor = captionInputRef.current?.selectionStart || caption.length;
    const textBeforeCursor = caption.slice(0, cursor);
    const textAfterCursor = caption.slice(cursor);

    const replacedBefore = textBeforeCursor.replace(/@\w*$/, `@${contactName} `);
    setCaption(replacedBefore + textAfterCursor);
    setMentionSuggestions([]);
    captionInputRef.current?.focus();
  };

  // Discard Confirmation
  const hasEdits =
    workingMediaUrl !== mediaPreviewUrl ||
    drawingHistory.length > 0 ||
    overlays.length > 0 ||
    selectedSong !== null ||
    selectedFilter !== "none" ||
    rotation !== 0 ||
    caption.trim().length > 0 ||
    (isVideo && (videoStart > 0 || (videoDuration > 30 && videoEnd < videoDuration)));

  const handleAttemptClose = () => {
    if (uploadState === "uploading") {
      toast.error("Upload is in progress. Please wait.");
      return;
    }
    if (hasEdits) {
      setShowDiscardConfirm(true);
    } else {
      stopStatusTrack();
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    stopStatusTrack();
    setShowDiscardConfirm(false);
    onClose();
  };

  // Publish
  const handlePublishClick = () => {
    if (!navigator.onLine) {
      toast.error("No internet connection.");
      return;
    }

    const payload = {
      mediaFile: workingMediaFile || mediaFile,
      isVideo,
      caption: caption.trim(),
      privacy: privacyConfig,
      song: selectedSong
        ? {
            title: selectedSong.title,
            artist: selectedSong.artist,
            audioUrl: selectedSong.audioUrl,
            audioFile: selectedSong.audioFile,
            startTime: selectedSong.startTime || 0,
            endTime: selectedSong.endTime || 0,
            volume: musicVolume,
          }
        : undefined,
      videoSelection: isVideo
        ? {
            startTime: videoStart,
            endTime: videoEnd,
            originalDuration: videoDuration,
            volume: isVideoMuted ? 0 : videoVolume,
          }
        : undefined,
      filter: selectedFilter,
      overlays,
    };

    onPublish(payload);
  };

  if (!isOpen || !mediaPreviewUrl) return null;

  const currentFilterObj =
    STATUS_FILTERS.find((f) => f.id === selectedFilter) || STATUS_FILTERS[0];

  return (
    <div className="fixed inset-0 z-10000 bg-black flex items-center justify-center select-none overflow-hidden animate-fade-in text-white">
      {/* Studio Viewport Wrapper: full screen on mobile, phone-aspect stage on desktop */}
      <div className="w-full h-full max-w-full md:max-w-md lg:max-w-lg md:max-h-[96vh] md:rounded-3xl md:shadow-2xl overflow-hidden relative flex flex-col justify-between bg-black border-0 md:border md:border-white/10">
        {/* ── TOP FLOATING TOOLBAR (AUTHENTIC WHATSAPP STYLE) ── */}
        <header className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/85 via-black/40 to-transparent pt-3 pb-6 px-4 flex items-center justify-between pointer-events-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={activeTool === "draw" ? () => setActiveTool(null) : handleAttemptClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/95 hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-xs"
            title={activeTool === "draw" ? "Done Drawing" : "Close"}
          >
            {activeTool === "draw" ? <BsCheck2 size={24} className="text-primary font-bold" /> : <BsX size={28} />}
          </button>

          {/* WhatsApp Action Icons on Right */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {activeTool === "draw" ? (
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <button
                  type="button"
                  onClick={handleUndoDrawing}
                  disabled={drawingHistory.length === 0}
                  className="p-1 text-white/80 hover:text-white disabled:opacity-40 cursor-pointer"
                  title="Undo"
                >
                  <BsArrowCounterclockwise size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleClearDrawing}
                  className="text-xs text-error font-medium px-1.5 py-0.5 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <>
                {/* Crop & Rotate */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isVideo) {
                      setShowCropModal(true);
                    } else {
                      setActiveTool((prev) => (prev === "crop" ? null : "crop"));
                    }
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTool === "crop" || showCropModal
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Crop & Rotate"
                >
                  <BsCrop size={17} />
                </button>

                {/* Stickers / Emojis */}
                <button
                  type="button"
                  onClick={() => setActiveTool((prev) => (prev === "sticker" ? null : "sticker"))}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTool === "sticker"
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Stickers & Emoji"
                >
                  <BsEmojiSmile size={19} />
                </button>

                {/* Text Tool 'T' */}
                <button
                  type="button"
                  onClick={() => setActiveTool((prev) => (prev === "text" ? null : "text"))}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTool === "text"
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Add Text"
                >
                  <span className="font-serif font-black text-xl leading-none">T</span>
                </button>

                {/* Pen Drawing */}
                <button
                  type="button"
                  onClick={() => setActiveTool((prev) => (prev === "draw" ? null : "draw"))}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTool === "draw"
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Pen Draw"
                >
                  <BsPencilFill size={16} />
                </button>

                {/* Filter Palette */}
                <button
                  type="button"
                  onClick={() => setActiveTool((prev) => (prev === "filter" ? null : "filter"))}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeTool === "filter" || selectedFilter !== "none"
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Filters"
                >
                  <BsPaletteFill size={17} />
                </button>

                {/* Music */}
                <button
                  type="button"
                  onClick={() => setShowSongPicker(true)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                    selectedSong
                      ? "bg-primary text-white shadow-md scale-105"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                  title="Add Music"
                >
                  <BsMusicNoteBeamed size={17} />
                  {selectedSong && (
                    <span className="w-2 h-2 rounded-full bg-white absolute top-1 right-1 animate-pulse" />
                  )}
                </button>

                {/* Audio Mix (if video or song) */}
                {(isVideo || selectedSong) && (
                  <button
                    type="button"
                    onClick={() => setActiveTool((prev) => (prev === "mix" ? null : "mix"))}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      activeTool === "mix"
                        ? "bg-primary text-white shadow-md scale-105"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                    title="Audio Mix"
                  >
                    <BsSliders size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {/* ── VIDEO FILMSTRIP / TRIMMER (WHATSAPP STYLE AT TOP) ── */}
        {isVideo && !activeTool && (
          <div className="absolute top-14 inset-x-4 z-30 max-w-sm mx-auto bg-black/60 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/15 flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center justify-between text-[11px] text-white/80 font-mono">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {isVideoPlaying ? <BsPauseFill size={13} /> : <BsPlayFill size={13} />}
                </button>
                <span>{formatTimestamp(videoCurrentTime)}</span>
              </div>
              <span className="text-primary font-semibold">
                Trim: {Math.max(1, Math.round(videoEnd - videoStart))}s
              </span>
              <span>{formatTimestamp(videoDuration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={Math.max(1, videoDuration - 1)}
                value={videoStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVideoStart(val);
                  if (val >= videoEnd) setVideoEnd(Math.min(videoDuration, val + 5));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="range range-xs range-primary flex-1"
              />
              <input
                type="range"
                min={videoStart + 1}
                max={videoDuration || 30}
                value={videoEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVideoEnd(val);
                }}
                className="range range-xs range-secondary flex-1"
              />
            </div>
          </div>
        )}

        {/* ── CENTER MEDIA STAGE ── */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {/* Framed Media */}
          <div
            className={`relative max-h-full max-w-full flex items-center justify-center overflow-hidden transition-all duration-200 ${
              aspectRatio === "9:16"
                ? "aspect-[9/16] h-full"
                : aspectRatio === "1:1"
                  ? "aspect-square w-full"
                  : aspectRatio === "4:5"
                    ? "aspect-[4/5] h-full"
                    : aspectRatio === "16:9"
                      ? "aspect-video w-full"
                      : "h-full w-full"
            }`}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaPreviewUrl}
                autoPlay
                playsInline
                loop={false}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onClick={togglePlayPause}
                style={{
                  filter: currentFilterObj.css,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain cursor-pointer transition-transform duration-200"
              />
            ) : (
              <img
                src={workingMediaUrl || mediaPreviewUrl}
                alt="Preview"
                style={{
                  filter: currentFilterObj.css,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
              />
            )}

            {/* Canvas Drawing Layer (Active when draw mode is on) */}
            <canvas
              ref={canvasRef}
              width={600}
              height={800}
              onMouseDown={startDrawing}
              onMouseMove={drawMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={drawMove}
              onTouchEnd={stopDrawing}
              className={`absolute inset-0 w-full h-full ${
                activeTool === "draw"
                  ? "pointer-events-auto cursor-crosshair z-25"
                  : "pointer-events-none z-10"
              }`}
            />

            {/* Overlays (Text / Stickers) */}
            {overlays.map((item) => (
              <div
                key={item.id}
                className="absolute z-20 group cursor-move select-none p-2"
                style={{ top: `${item.y}%`, left: `${item.x}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`relative px-3 py-1 rounded-2xl shadow-lg border border-white/20 backdrop-blur-xs font-semibold ${
                    item.type === "sticker"
                      ? "text-5xl bg-transparent border-none"
                      : "text-xl bg-black/60 text-white"
                  }`}
                  style={{ color: item.color || "#ffffff" }}
                >
                  {item.content}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOverlay(item.id);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                    title="Remove"
                  >
                    <BsX size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Drawing Color Palette (Vertical on right edge when drawing) */}
          {activeTool === "draw" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-35 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/20 flex flex-col items-center gap-2 animate-fade-in pointer-events-auto">
              {PEN_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setPenColor(col)}
                  className={`w-6 h-6 rounded-full transition-transform border border-white/40 cursor-pointer ${
                    penColor === col ? "scale-130 ring-2 ring-white" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          )}

          {/* Text Overlay Tool Modal */}
          {activeTool === "text" && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in pointer-events-auto">
              <input
                type="text"
                autoFocus
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTextOverlay();
                }}
                placeholder="Type status text…"
                className="w-full text-center bg-transparent text-2xl sm:text-3xl font-bold text-white outline-none border-b-2 border-primary pb-2 mb-6 placeholder:text-white/40"
              />
              <div className="flex items-center gap-2 mb-6">
                {PEN_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewTextColor(col)}
                    className={`w-6 h-6 rounded-full border border-white/30 ${
                      newTextColor === col ? "scale-125 ring-2 ring-white" : ""
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="btn btn-sm btn-ghost text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTextOverlay}
                  disabled={!newTextContent.trim()}
                  className="btn btn-sm btn-primary rounded-xl px-5"
                >
                  Add Text
                </button>
              </div>
            </div>
          )}

          {/* Stickers Popover */}
          {activeTool === "sticker" && (
            <div className="absolute bottom-20 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 shadow-2xl rounded-3xl overflow-hidden animate-slide-up pointer-events-auto">
              <EmojiPicker onEmojiClick={handleAddEmojiOverlay} width={320} height={340} />
            </div>
          )}

          {/* Filters Carousel Drawer */}
          {activeTool === "filter" && (
            <div className="absolute bottom-24 inset-x-3 z-35 bg-black/85 backdrop-blur-md rounded-2xl p-3 border border-white/20 animate-slide-up pointer-events-auto">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-white/90">Filter</span>
                <button onClick={() => setActiveTool(null)} className="text-white/60 hover:text-white">
                  <BsX size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                      selectedFilter === f.id
                        ? "bg-primary text-white font-bold ring-2 ring-primary ring-offset-2 ring-offset-black"
                        : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crop & Rotate Drawer */}
          {activeTool === "crop" && (
            <div className="absolute bottom-24 inset-x-4 z-35 bg-neutral-900/95 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-3 animate-slide-up pointer-events-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <BsCrop className="text-primary" /> Crop & Aspect Ratio
                </span>
                <button onClick={() => setActiveTool(null)} className="text-white/60 hover:text-white">
                  <BsX size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`btn btn-xs rounded-xl ${
                      aspectRatio === ratio.id ? "btn-primary text-white font-bold" : "btn-ghost text-white/70"
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-white/70">Rotate 90°</span>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="btn btn-xs btn-outline btn-primary rounded-xl gap-1"
                >
                  <BsArrowRepeat size={14} /> {rotation}°
                </button>
              </div>
            </div>
          )}

          {/* Audio Mixing Drawer */}
          {activeTool === "mix" && (
            <div className="absolute bottom-24 inset-x-4 z-35 bg-neutral-900/95 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-3.5 animate-slide-up pointer-events-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <BsSliders className="text-primary" /> Audio Volume Mix
                </span>
                <button onClick={() => setActiveTool(null)} className="text-white/60 hover:text-white">
                  <BsX size={18} />
                </button>
              </div>
              {isVideo && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsVideoMuted((prev) => !prev)}
                        className="text-primary hover:opacity-80 cursor-pointer"
                      >
                        {isVideoMuted || videoVolume === 0 ? <BsVolumeMuteFill /> : <BsVolumeUpFill />}
                      </button>
                      Video Sound
                    </span>
                    <span className="font-mono text-[10px]">
                      {isVideoMuted ? "Muted" : `${Math.round(videoVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isVideoMuted ? 0 : videoVolume}
                    onChange={(e) => {
                      setIsVideoMuted(false);
                      setVideoVolume(Number(e.target.value));
                    }}
                    className="range range-xs range-primary"
                  />
                </div>
              )}
              {selectedSong && (
                <div className="space-y-1 pt-1.5 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMusicMuted((prev) => !prev)}
                        className="text-secondary hover:opacity-80 cursor-pointer"
                      >
                        {isMusicMuted || musicVolume === 0 ? <BsVolumeMuteFill /> : <BsVolumeUpFill />}
                      </button>
                      Music Sound
                    </span>
                    <span className="font-mono text-[10px]">
                      {isMusicMuted ? "Muted" : `${Math.round(musicVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMusicMuted ? 0 : musicVolume}
                    onChange={(e) => {
                      setIsMusicMuted(false);
                      setMusicVolume(Number(e.target.value));
                    }}
                    className="range range-xs range-secondary"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BOTTOM FLOATING BAR (WHATSAPP CAPTION & SEND) ── */}
        <footer className="absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 pb-5 px-4 flex flex-col gap-2 pointer-events-auto">
          {/* Upload Progress Bar if uploading */}
          {uploadState === "uploading" && (
            <div className="bg-primary/20 backdrop-blur-md rounded-2xl p-2 border border-primary/30 flex items-center justify-between text-xs text-primary mb-1">
              <span>Uploading Status…</span>
              <span className="font-mono font-bold">{uploadProgress}%</span>
            </div>
          )}

          {/* Upload Failed Banner with Retry */}
          {uploadState === "failed" && (
            <div className="bg-error/20 backdrop-blur-md rounded-2xl p-2.5 border border-error/30 flex items-center justify-between text-xs text-error mb-1">
              <span className="truncate pr-2">{uploadErrorMessage || "Upload failed."}</span>
              <button
                type="button"
                onClick={onRetryUpload}
                className="btn btn-xs btn-error text-white rounded-xl gap-1"
              >
                <BsArrowRepeat size={12} /> Retry
              </button>
            </div>
          )}

          {/* Row 1: Attached Song Pill & Status Privacy Pill */}
          <div className="flex items-center justify-between gap-2">
            {/* WhatsApp Status Privacy Pill */}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium hover:bg-black/80 transition-all cursor-pointer shadow-md"
              title="Status privacy"
            >
              <BsShieldLockFill size={11} className="text-primary" />
              <span>
                Status (
                {privacyConfig.type === "contacts"
                  ? "Contacts"
                  : privacyConfig.type === "contacts_except"
                    ? `${privacyConfig.excludedUsers?.length || 0} excluded`
                    : `${privacyConfig.allowedUsers?.length || 0} selected`}
                )
              </span>
            </button>

            {/* Attached Song Pill */}
            {selectedSong && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-white text-[11px] max-w-[200px] truncate shadow-md">
                <BsMusicNoteBeamed className="text-primary flex-shrink-0" size={11} />
                <span className="truncate">{selectedSong.title}</span>
                <button
                  type="button"
                  onClick={() => {
                    stopStatusTrack();
                    setSelectedSong(null);
                  }}
                  className="hover:text-error ml-1 text-white/70"
                >
                  <BsX size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: WhatsApp Caption Capsule Input + Green Send Circle FAB */}
          <div className="flex items-center gap-2 relative">
            {/* Mention Suggestions Popover */}
            {mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-14 mb-2 z-50 bg-[#1f2c34] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden divide-y divide-white/5 animate-slide-up">
                {mentionSuggestions.map((c) => (
                  <button
                    key={c._id || c.phone}
                    type="button"
                    onClick={() => insertMention(c)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-white/10 text-xs transition-colors cursor-pointer"
                  >
                    <BsAt className="text-primary" />
                    <span className="font-semibold">{c.customName || c.name}</span>
                    <span className="text-white/40 text-[10px] ml-auto">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Caption Input Capsule */}
            <div className="flex-1 bg-[#1f2c34] text-white rounded-full flex items-center px-3.5 py-2 shadow-xl border border-white/10 focus-within:border-primary/60 transition-colors">
              <button
                type="button"
                onClick={() => setShowEmojiPickerCaption((prev) => !prev)}
                className="text-white/70 hover:text-white p-1 rounded-full transition-colors cursor-pointer mr-1.5"
                title="Add emoji"
              >
                <BsEmojiSmile size={19} />
              </button>

              <input
                ref={captionInputRef}
                type="text"
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Add a caption… (type @ to mention)"
                maxLength={500}
                className="bg-transparent flex-1 text-sm text-white placeholder:text-white/40 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && uploadState !== "uploading") {
                    handlePublishClick();
                  }
                }}
              />
            </div>

            {/* WhatsApp Circular Green Send FAB */}
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={uploadState === "uploading"}
              className="w-12 h-12 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
              title="Send to My Status"
            >
              {uploadState === "uploading" ? (
                <span className="loading loading-spinner loading-xs text-white" />
              ) : (
                <BsSendFill size={16} className="ml-0.5" />
              )}
            </button>
          </div>

          {/* Emoji Popover for Caption */}
          {showEmojiPickerCaption && (
            <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setCaption((prev) => prev + emojiData.emoji);
                }}
                width={300}
                height={320}
              />
            </div>
          )}
        </footer>
      </div>

      {/* ── DISCARD CONFIRMATION MODAL ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-10005 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#111B21] text-white rounded-3xl p-6 shadow-2xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
              <BsTrash3 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Discard status changes?</h3>
              <p className="text-xs text-[#8696A0] mt-1.5 leading-relaxed">
                If you go back now, all adjustments, drawings, and music will be lost.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex-1"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex-1"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        initialSong={selectedSong}
        onSelectSong={(song) => {
          setSelectedSong(song);
          if (song.volume !== undefined) setMusicVolume(song.volume);
        }}
      />

      {/* Status Privacy Modal */}
      <StatusPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSavePrivacy={(cfg) => {
          if (onSavePrivacy) onSavePrivacy(cfg);
        }}
      />

      {/* ── INTERACTIVE WHATSAPP CROP & ROTATE MODAL (react-easy-crop) ── */}
      <StatusCropModal
        isOpen={showCropModal}
        imageSrc={workingMediaUrl || mediaPreviewUrl}
        onCropDone={(croppedFile, croppedUrl) => {
          setWorkingMediaFile(croppedFile);
          setWorkingMediaUrl(croppedUrl);
          setShowCropModal(false);
          toast.success("Crop applied!");
        }}
        onCancel={() => setShowCropModal(false)}
      />
    </div>
  );
};

export default StatusStudioModal;
