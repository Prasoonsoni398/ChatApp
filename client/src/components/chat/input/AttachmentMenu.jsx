import {
  BsPaperclip,
  BsImageFill,
  BsCameraVideoFill,
  BsFileEarmarkTextFill,
  BsMusicNoteBeamed,
  BsBarChartLineFill,
  BsGeoAltFill,
  BsPersonBadgeFill,
  BsCalendarEventFill,
} from "react-icons/bs";

const AttachmentMenu = ({
  showAttachMenu,
  setShowAttachMenu,
  attachMenuRef,
  fileInputRef,
  videoInputRef,
  docInputRef,
  audioInputRef,
  onOpenCreatePoll,
  onOpenLocationShare,
  onOpenContactShare,
  onOpenCreateEvent,
  isGroup,
}) => {
  return (
    <div className="relative" ref={attachMenuRef}>
      <button
        type="button"
        onClick={() => setShowAttachMenu((v) => !v)}
        className={`p-1.5 sm:p-2 transition-colors ${
          showAttachMenu
            ? "text-primary"
            : "text-base-content/50 hover:text-primary"
        }`}
        title="Attach media or document"
      >
        <BsPaperclip size={20} />
      </button>

      {/* Attachment Menu Sheet */}
      {showAttachMenu && (
        <div className="absolute bottom-[calc(100%+12px)] left-0 bg-base-100 rounded-3xl shadow-2xl border border-base-300 p-3 z-50 flex flex-col gap-2 min-w-44 animate-slide-up origin-bottom-left">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-secondary/20 text-secondary">
              <BsImageFill size={16} />
            </div>
            <span className="text-xs font-semibold">Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              videoInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-error/20 text-error">
              <BsCameraVideoFill size={16} />
            </div>
            <span className="text-xs font-semibold">Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              docInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-info/20 text-info">
              <BsFileEarmarkTextFill size={16} />
            </div>
            <span className="text-xs font-semibold">Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-warning/20 text-warning">
              <BsMusicNoteBeamed size={16} />
            </div>
            <span className="text-xs font-semibold">Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenCreatePoll?.();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-primary/20 text-primary">
              <BsBarChartLineFill size={16} />
            </div>
            <span className="text-xs font-semibold">Poll</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenLocationShare?.();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-success/20 text-success">
              <BsGeoAltFill size={16} />
            </div>
            <span className="text-xs font-semibold">Location</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenContactShare?.();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-info/20 text-info">
              <BsPersonBadgeFill size={16} />
            </div>
            <span className="text-xs font-semibold">Contact</span>
          </button>

          {isGroup && (
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onOpenCreateEvent?.();
              }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors text-left"
            >
              <div className="p-2 rounded-full bg-accent/20 text-accent">
                <BsCalendarEventFill size={16} />
              </div>
              <span className="text-xs font-semibold">Event</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AttachmentMenu;
