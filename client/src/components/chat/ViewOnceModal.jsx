import { useEffect } from "react";
import { BsX, BsCheckCircleFill } from "react-icons/bs";

/**
 * ViewOnceModal (PRD Section 34)
 * Ephemeral viewer for view-once photos/videos.
 * Automatically marks media as viewed and closes without saving.
 */
const ViewOnceModal = ({ isOpen, onClose, mediaUrl, isVideo = false }) => {
  useEffect(() => {
    // Prevent right-click save on view-once media
    const handleContext = (e) => e.preventDefault();
    if (isOpen) {
      document.addEventListener("contextmenu", handleContext);
    }
    return () => {
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [isOpen]);

  if (!isOpen || !mediaUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 select-none animate-fade-in">
      {/* Top Banner */}
      <div className="w-full max-w-2xl px-6 py-4 flex items-center justify-between text-white/90 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-white flex items-center justify-center font-bold text-xs">
            1
          </div>
          <span className="text-sm font-medium">View once message</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <BsX size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl flex items-center justify-center p-4">
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            controlsList="nodownload"
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="View Once"
            draggable={false}
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain pointer-events-none"
          />
        )}
      </div>

      {/* Bottom Dismiss Notice */}
      <div className="p-4 text-center text-xs text-white/60">
        <p>This message will disappear once you close it.</p>
      </div>
    </div>
  );
};

export default ViewOnceModal;
