import { useState, useEffect, useRef } from "react";
import {
  BsX,
  BsEye,
  BsMusicNoteBeamed,
  BsVolumeUpFill,
  BsVolumeMuteFill,
  BsTrash3,
  BsPlayFill,
  BsPauseFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as statusService from "../../services/statusService.js";
import { playStatusTrack, stopStatusTrack } from "../../utils/statusMusic.js";
import { STATUS_FILTERS } from "./status/StatusStudioModal.jsx";

const StatusViewer = ({ group, loggedInUser, onClose, onStatusDeleted }) => {
  const [statuses, setStatuses] = useState(group.statuses || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const progressStartTimeRef = useRef(Date.now());
  const elapsedBeforePauseRef = useRef(0);

  const currentStatus = statuses[currentIndex];
  const isMyStatus = group.user._id === loggedInUser?._id;

  // Calculate slide duration (PRD Section 40)
  const currentDuration =
    currentStatus?.type === "video" && currentStatus?.videoSelection
      ? Math.max(
          2,
          (currentStatus.videoSelection.endTime || 10) -
            (currentStatus.videoSelection.startTime || 0),
        ) * 1000
      : 5000; // 5 seconds for photos/text

  // Mark as viewed when active status changes
  useEffect(() => {
    if (currentStatus && !isMyStatus) {
      statusService.markStatusViewed(currentStatus._id);
    }
  }, [currentStatus?._id, isMyStatus]);

  // Synchronize audio mix and song playback
  useEffect(() => {
    if (!currentStatus) return;

    if (currentStatus.song && !isMuted && !isPaused) {
      playStatusTrack(currentStatus.song, {
        startTime: currentStatus.song.startTime || 0,
        endTime: currentStatus.song.endTime || 0,
        volume: currentStatus.song.volume !== undefined ? currentStatus.song.volume : 0.85,
      });
    } else {
      stopStatusTrack();
    }

    if (videoRef.current) {
      if (currentStatus.videoSelection) {
        videoRef.current.currentTime = currentStatus.videoSelection.startTime || 0;
        const targetVol =
          currentStatus.videoSelection.volume !== undefined
            ? currentStatus.videoSelection.volume
            : 1;
        videoRef.current.volume = isMuted ? 0 : targetVol;
      }
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }

    return () => {
      stopStatusTrack();
    };
  }, [currentIndex, currentStatus?._id, currentStatus?.song, isMuted, isPaused]);

  // Video loop handling within trim bounds
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !currentStatus?.videoSelection) return;
    const { startTime, endTime } = currentStatus.videoSelection;
    if (endTime > startTime && videoRef.current.currentTime >= endTime) {
      videoRef.current.currentTime = startTime || 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Progress Bar Animation
  useEffect(() => {
    if (!currentStatus || isPaused || showDeleteConfirm || showViewersSheet) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    progressStartTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const animate = () => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      elapsedBeforePauseRef.current = elapsed;
      const p = Math.min(100, (elapsed / currentDuration) * 100);
      setProgress(p);

      if (p >= 100) {
        if (currentIndex < statuses.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
          elapsedBeforePauseRef.current = 0;
          progressStartTimeRef.current = Date.now();
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          stopStatusTrack();
          onClose();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentIndex, statuses.length, currentDuration, isPaused, showDeleteConfirm, showViewersSheet, onClose]);

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else {
      stopStatusTrack();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    }
  };

  const handleClose = () => {
    stopStatusTrack();
    onClose();
  };

  // Delete Status Handler (PRD Section 46 & 57)
  const handleDeleteStatus = async () => {
    if (!currentStatus?._id) return;
    try {
      setIsDeleting(true);
      await statusService.deleteStatus(currentStatus._id);
      toast.success("Status deleted");

      const remaining = statuses.filter((s) => s._id !== currentStatus._id);
      if (remaining.length === 0) {
        stopStatusTrack();
        if (onStatusDeleted) onStatusDeleted();
        onClose();
      } else {
        setStatuses(remaining);
        setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
        setProgress(0);
        elapsedBeforePauseRef.current = 0;
        setShowDeleteConfirm(false);
        if (onStatusDeleted) onStatusDeleted();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete status");
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleClose();
      else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, statuses.length]);

  if (!currentStatus) return null;

  const filterObj =
    STATUS_FILTERS.find((f) => f.id === currentStatus.filter) || STATUS_FILTERS[0];

  return (
    <div
      className="fixed inset-0 z-9999 bg-black flex flex-col justify-between animate-fade-in select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── SEGMENTED PROGRESS BARS (PRD Section 40) ── */}
      <div className="flex gap-1.5 p-2 pt-3 w-full max-w-xl mx-auto absolute top-0 left-0 right-0 z-30">
        {statuses.map((s, idx) => (
          <div
            key={s._id}
            className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-75"
              style={{
                width:
                  idx < currentIndex
                    ? "100%"
                    : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* ── TOP HEADER (User Info, Mute, Delete, Close) ── */}
      <div className="absolute top-7 left-0 right-0 w-full max-w-xl mx-auto px-4 flex justify-between items-center z-30 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-base-100 p-0.5 shadow-md">
            <img
              src={
                group.user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.name}`
              }
              alt={group.user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="text-white drop-shadow-md">
            <p className="font-bold text-sm leading-tight">{group.user.name}</p>
            <p className="text-[11px] text-white/70">
              {new Date(currentStatus.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-white">
          {/* Audio Mute / Unmute */}
          {(currentStatus.song || currentStatus.type === "video") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <BsVolumeMuteFill size={19} /> : <BsVolumeUpFill size={19} />}
            </button>
          )}

          {/* Delete Option for Status Owner (PRD Section 46 & 57) */}
          {isMyStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white hover:text-error cursor-pointer"
              title="Delete this status"
            >
              <BsTrash3 size={18} />
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Close viewer"
          >
            <BsX size={28} />
          </button>
        </div>
      </div>

      {/* ── ATTACHED SONG BADGE (PRD Section 18) ── */}
      {currentStatus?.song && (
        <div className="absolute top-20 left-0 right-0 w-full max-w-xl mx-auto px-4 z-30 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs shadow-xl animate-fade-in pointer-events-auto">
            <BsMusicNoteBeamed
              className={`text-primary flex-shrink-0 ${!isMuted && !isPaused ? "animate-bounce" : ""}`}
              size={13}
            />
            <span className="font-semibold max-w-[130px] truncate">
              {currentStatus.song.title}
            </span>
            {currentStatus.song.artist && (
              <span className="text-white/70 max-w-[100px] truncate">
                • {currentStatus.song.artist}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN STATUS MEDIA CANVAS ── */}
      <div className="flex-1 relative flex items-center justify-center h-full max-w-xl mx-auto w-full overflow-hidden">
        {/* Navigation tap targets (Left 35% / Right 65%) */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        />

        {currentStatus.type === "text" ? (
          <div
            className="w-full h-full flex items-center justify-center p-8 text-center"
            style={{
              backgroundColor: currentStatus.backgroundColor || "#075e54",
              fontFamily: currentStatus.fontFamily || "sans-serif",
            }}
          >
            <p className="text-white text-2xl sm:text-3xl font-medium max-w-md leading-relaxed whitespace-pre-wrap wrap-break-word drop-shadow-md">
              {currentStatus.text}
            </p>
          </div>
        ) : currentStatus.type === "video" ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              src={currentStatus.video || currentStatus.mediaUrl || currentStatus.image}
              autoPlay
              playsInline
              loop={false}
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              style={{ filter: filterObj.css }}
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
            {/* Visual Overlays */}
            {currentStatus.overlays?.map((item) => (
              <div
                key={item.id}
                className="absolute z-20 pointer-events-none"
                style={{ top: `${item.y}%`, left: `${item.x}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`px-3 py-1.5 rounded-2xl font-semibold ${
                    item.type === "sticker"
                      ? "text-4xl"
                      : "text-lg bg-black/50 text-white shadow-lg border border-white/20"
                  }`}
                  style={{ color: item.color || "#ffffff" }}
                >
                  {item.content}
                </div>
              </div>
            ))}
            {currentStatus.caption && (
              <div className="absolute bottom-14 left-0 right-0 px-6 py-3 bg-black/60 backdrop-blur-xs text-center z-15">
                <p className="text-white text-sm sm:text-base leading-snug drop-shadow-md">
                  {currentStatus.caption}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img
              src={currentStatus.image || currentStatus.mediaUrl || currentStatus.video}
              alt="Status"
              style={{ filter: filterObj.css }}
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
            {/* Visual Overlays */}
            {currentStatus.overlays?.map((item) => (
              <div
                key={item.id}
                className="absolute z-20 pointer-events-none"
                style={{ top: `${item.y}%`, left: `${item.x}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`px-3 py-1.5 rounded-2xl font-semibold ${
                    item.type === "sticker"
                      ? "text-4xl"
                      : "text-lg bg-black/50 text-white shadow-lg border border-white/20"
                  }`}
                  style={{ color: item.color || "#ffffff" }}
                >
                  {item.content}
                </div>
              </div>
            ))}
            {currentStatus.caption && (
              <div className="absolute bottom-14 left-0 right-0 px-6 py-3 bg-black/60 backdrop-blur-xs text-center z-15">
                <p className="text-white text-sm sm:text-base leading-snug drop-shadow-md">
                  {currentStatus.caption}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── OWNER VIEWERS SHEET TRIGGER (PRD Section 40 & 53) ── */}
      {isMyStatus && (
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-30 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowViewersSheet(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition-colors shadow-md cursor-pointer"
          >
            <BsEye size={14} />
            <span>{currentStatus.viewers?.length || 0} views</span>
          </button>
        </div>
      )}

      {/* ── VIEWERS BOTTOM SHEET (PRD Section 40) ── */}
      {showViewersSheet && (
        <div
          className="absolute inset-x-0 bottom-0 max-w-xl mx-auto bg-[#111B21] text-white rounded-t-3xl p-5 z-40 max-h-80 flex flex-col shadow-2xl animate-slide-up border-t border-white/10 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
              <BsEye className="text-[#25D366]" /> Viewed by (
              {currentStatus.viewers?.length || 0})
            </h4>
            <button
              onClick={() => setShowViewersSheet(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <BsX size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 mt-2">
            {!currentStatus.viewers || currentStatus.viewers.length === 0 ? (
              <p className="text-xs text-[#8696A0] text-center py-6">
                No views yet
              </p>
            ) : (
              currentStatus.viewers.map((v, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <img
                    src={
                      v.userId?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.userId?.name || "User"}`
                    }
                    alt={v.userId?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {v.userId?.name || "Contact"}
                    </p>
                    <p className="text-[10px] text-[#8696A0]">
                      {new Date(v.viewedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── DELETE STATUS CONFIRMATION MODAL (PRD Section 46 & 57) ── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-10006 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pointer-events-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm bg-[#111B21] text-white rounded-3xl p-6 shadow-2xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
              <BsTrash3 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Delete this status update?</h3>
              <p className="text-xs text-[#8696A0] mt-1.5 leading-relaxed">
                It will be deleted for everyone who received it across all your devices.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStatus}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex-1"
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs text-white" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusViewer;
