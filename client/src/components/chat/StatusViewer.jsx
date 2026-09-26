import { useState, useEffect } from "react";
import {
  BsX,
  BsEye,
  BsMusicNoteBeamed,
  BsVolumeUpFill,
  BsVolumeMuteFill,
} from "react-icons/bs";
import * as statusService from "../../services/statusService.js";
import { playStatusTrack, stopStatusTrack } from "../../utils/statusMusic.js";

const StatusViewer = ({ group, loggedInUser, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const STATUS_DURATION = 4000; // 4 seconds per status
  const statuses = group.statuses;
  const currentStatus = statuses[currentIndex];
  const isMyStatus = group.user._id === loggedInUser?._id;

  // Handle music playback for the active status
  useEffect(() => {
    if (currentStatus?.song && !isMuted) {
      playStatusTrack(currentStatus.song);
    } else {
      stopStatusTrack();
    }

    return () => {
      stopStatusTrack();
    };
  }, [currentIndex, currentStatus?._id, currentStatus?.song, isMuted]);

  // Mark as viewed when active status changes
  useEffect(() => {
    if (currentStatus && !isMyStatus) {
      statusService.markStatusViewed(currentStatus._id);
    }
  }, [currentStatus?._id, isMyStatus]);

  useEffect(() => {
    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = (elapsed / STATUS_DURATION) * 100;

      if (p >= 100) {
        if (currentIndex < statuses.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
          startTime = Date.now();
          animationFrame = requestAnimationFrame(animate);
        } else {
          stopStatusTrack();
          onClose();
        }
      } else {
        setProgress(p);
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, statuses.length, onClose]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      stopStatusTrack();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    stopStatusTrack();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 bg-black flex flex-col animate-fade-in select-none">
      {/* Progress Bars */}
      <div className="flex gap-1.5 p-2 pt-4 w-full max-w-xl mx-auto absolute top-0 left-0 right-0 z-20">
        {statuses.map((s, idx) => (
          <div
            key={s._id}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
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

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 w-full max-w-xl mx-auto px-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-base-100 p-0.5">
            <img
              src={
                group.user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.name}`
              }
              alt={group.user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="text-white">
            <p className="font-semibold text-sm leading-tight">
              {group.user.name}
            </p>
            <p className="text-xs text-white/70">
              {new Date(currentStatus.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <BsX size={28} />
        </button>
      </div>

      {/* Song Sticker Badge if status has a song */}
      {currentStatus?.song && (
        <div className="absolute top-22 left-0 right-0 w-full max-w-xl mx-auto px-4 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs shadow-xl animate-fade-in pointer-events-auto">
            <BsMusicNoteBeamed
              className={`text-primary flex-shrink-0 ${
                !isMuted ? "animate-bounce" : ""
              }`}
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors text-white/90"
              title={isMuted ? "Unmute song" : "Mute song"}
            >
              {isMuted ? (
                <BsVolumeMuteFill size={14} />
              ) : (
                <BsVolumeUpFill size={14} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Content (Text or Image — Video is Strictly Excluded per PRD) */}
      <div className="flex-1 relative flex items-center justify-center h-full max-w-xl mx-auto w-full">
        {/* Navigation tap targets */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
          onClick={handleNext}
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
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img
              src={currentStatus.image}
              alt="Status"
              className="max-h-full max-w-full object-contain"
            />
            {currentStatus.caption && (
              <div className="absolute bottom-12 left-0 right-0 px-6 py-3 bg-black/60 backdrop-blur-xs text-center z-10">
                <p className="text-white text-sm sm:text-base leading-snug">
                  {currentStatus.caption}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Viewers bar for status owner (PRD Section 53) */}
      {isMyStatus && (
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-30">
          <button
            onClick={() => setShowViewersSheet(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium hover:bg-white/30 transition-colors"
          >
            <BsEye size={14} />
            <span>{currentStatus.viewers?.length || 0} views</span>
          </button>
        </div>
      )}

      {/* Viewers Bottom Sheet */}
      {showViewersSheet && (
        <div className="absolute inset-x-0 bottom-0 max-w-xl mx-auto bg-base-100 rounded-t-3xl p-5 z-40 max-h-80 flex flex-col shadow-2xl animate-slide-up text-base-content">
          <div className="flex items-center justify-between pb-3 border-b border-base-300">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <BsEye className="text-primary" /> Viewed by (
              {currentStatus.viewers?.length || 0})
            </h4>
            <button
              onClick={() => setShowViewersSheet(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            >
              <BsX size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-base-200 mt-2">
            {!currentStatus.viewers || currentStatus.viewers.length === 0 ? (
              <p className="text-xs text-base-content/50 text-center py-6">
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
                    <p className="text-xs font-medium truncate">
                      {v.userId?.name || "Contact"}
                    </p>
                    <p className="text-[10px] text-base-content/50">
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
    </div>
  );
};

export default StatusViewer;
