import {
  BsX,
  BsPencil,
  BsCameraVideoFill,
  BsMusicNoteBeamed,
  BsFileEarmarkTextFill,
} from "react-icons/bs";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const InputPreviews = ({
  replyingTo,
  setReplyingTo,
  editingMessageId,
  setEditingMessageId,
  setMessage,
  imagePreview,
  setImagePreview,
  setSelectedImage,
  isViewOnce,
  setIsViewOnce,
  selectedFile,
  setSelectedFile,
}) => {
  return (
    <>
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-primary bg-primary/5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">
              Replying to {replyingTo.senderName}
            </p>
            <p className="text-xs text-base-content/60 truncate">
              {replyingTo.text || "Attachment"}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-2 text-base-content/40 hover:text-base-content/70"
          >
            <BsX size={18} />
          </button>
        </div>
      )}

      {/* Edit Indicator */}
      {editingMessageId && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-warning bg-warning/5">
          <p className="text-xs font-semibold text-warning flex items-center gap-1">
            <BsPencil size={10} /> Editing message
          </p>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setMessage("");
            }}
            className="ml-2 text-base-content/40 hover:text-base-content/70"
          >
            <BsX size={18} />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-base-300 shadow-sm self-start group">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <RemoveActionButton
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              setIsViewOnce(false);
            }}
            variant="circle"
            size="xs"
            icon={<BsX size={15} />}
            title="Remove image"
            className="absolute top-1.5 right-1.5 shadow-md !w-6 !h-6"
          />
          <button
            type="button"
            onClick={() => setIsViewOnce((v) => !v)}
            className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
              isViewOnce
                ? "bg-primary text-primary-content ring-2 ring-primary ring-offset-1"
                : "bg-base-200/90 text-base-content/80 border border-base-300 hover:bg-base-300 hover:text-base-content"
            }`}
            title={isViewOnce ? "View once enabled" : "Set to view once"}
          >
            1
          </button>
        </div>
      )}

      {/* Generic File Attachment Preview (Video / Audio / Doc) */}
      {selectedFile && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-base-200 border border-base-300 self-start max-w-sm">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            {selectedFile.type.startsWith("video/") ? (
              <BsCameraVideoFill size={18} />
            ) : selectedFile.type.startsWith("audio/") ? (
              <BsMusicNoteBeamed size={18} />
            ) : (
              <BsFileEarmarkTextFill size={18} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">
              {selectedFile.name}
            </p>
            <p className="text-[10px] text-base-content/50">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {selectedFile.type.startsWith("video/") && (
            <button
              type="button"
              onClick={() => setIsViewOnce((v) => !v)}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                isViewOnce
                  ? "bg-primary text-primary-content ring-2 ring-primary"
                  : "bg-base-300 text-base-content hover:bg-base-200"
              }`}
              title={isViewOnce ? "View once enabled" : "Set to view once"}
            >
              1
            </button>
          )}
          <RemoveActionButton
            onClick={() => {
              setSelectedFile(null);
              setIsViewOnce(false);
            }}
            variant="circle"
            size="xs"
            icon={<BsX size={15} />}
            title="Remove attachment"
            className="ml-1 !w-6 !h-6"
          />
        </div>
      )}
    </>
  );
};

export default InputPreviews;
