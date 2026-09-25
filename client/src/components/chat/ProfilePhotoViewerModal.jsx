import { useState } from "react";
import {
  BsX,
  BsDownload,
  BsZoomIn,
  BsZoomOut,
  BsPersonFill,
  BsPeopleFill,
} from "react-icons/bs";

/**
 * ProfilePhotoViewerModal — Full-screen lightbox for viewing profile pictures
 * and group icons, with zoom and download capabilities.
 */
const ProfilePhotoViewerModal = ({ isOpen, onClose, avatarUrl, name, isGroup }) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.75));

  const handleClose = () => {
    setScale(1);
    onClose();
  };

  const handleDownload = () => {
    if (!avatarUrl) return;
    const a = document.createElement("a");
    a.href = avatarUrl;
    a.download = `${name || "profile"}_photo.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-150 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
      onClick={handleClose}
    >
      {/* Top action bar */}
      <div
        className="w-full max-w-4xl flex items-center justify-between py-2 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-base-300/30 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : isGroup ? (
              <BsPeopleFill size={20} />
            ) : (
              <BsPersonFill size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{name}</h3>
            <p className="text-xs text-white/60">Profile photo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.75}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
            title="Zoom Out"
          >
            <BsZoomOut size={18} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
            title="Zoom In"
          >
            <BsZoomIn size={18} />
          </button>
          {avatarUrl && (
            <button
              onClick={handleDownload}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Download Photo"
            >
              <BsDownload size={17} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <BsX size={26} />
          </button>
        </div>
      </div>

      {/* Main photo display */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{ transform: `scale(${scale})` }}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200 select-none"
          />
        ) : (
          <div className="w-64 h-64 rounded-full bg-base-300/20 border-2 border-white/20 flex items-center justify-center text-white/40">
            {isGroup ? <BsPeopleFill size={90} /> : <BsPersonFill size={90} />}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="text-xs text-white/40 py-2 select-none">
        Click anywhere outside to close · Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default ProfilePhotoViewerModal;
