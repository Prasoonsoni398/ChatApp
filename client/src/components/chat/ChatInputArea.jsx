import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  BsEmojiSmile,
  BsPaperclip,
  BsFillSendFill,
  BsX,
  BsPencil,
  BsMicFill,
  BsTrash,
  BsImageFill,
  BsFileEarmarkTextFill,
  BsMusicNoteBeamed,
  BsCameraVideoFill,
  BsBarChartLineFill,
  BsGeoAltFill,
  BsPersonBadgeFill,
  BsCalendarEventFill,
} from "react-icons/bs";
import useVoiceRecorder from "../../hooks/useVoiceRecorder.js";
import RemoveActionButton from "../common/RemoveActionButton.jsx";

/**
 * ChatInputArea – WhatsApp-style message composer.
 * Includes text input, emoji picker, attachment sheet (photo, video, doc, audio),
 * and voice note recording with timer.
 */
const ChatInputArea = ({
  message,
  setMessage,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  selectedFile,
  setSelectedFile,
  replyingTo,
  setReplyingTo,
  editingMessageId,
  setEditingMessageId,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  emojiToggleBtnRef,
  fileInputRef,
  handleImageSelect,
  handleSendMessage,
  handleSendVoice,
  handleTypingEvent,
  showMentionPopup,
  mentionFilter,
  selectedChat,
  loggedInUser,
  handleInsertMention,
  onOpenCreatePoll,
  onOpenLocationShare,
  onOpenContactShare,
  onOpenCreateEvent,
}) => {
  const voiceRecorder = useVoiceRecorder();
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const attachMenuRef = useRef(null);
  const docInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const textareaRef = useRef(null);
  const userPrefersLowercaseRef = useRef(false);
  const wasAutoCapitalizedRef = useRef(false);

  // Auto-focus chat input when selecting a person / conversation
  useEffect(() => {
    userPrefersLowercaseRef.current = false;
    wasAutoCapitalizedRef.current = false;
    if (selectedChat) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedChat?.id, selectedChat?._id]);

  // Smart capitalization: capitalize the first word's first letter by default like WhatsApp.
  // If the user switches to lowercase (e.g. backspaces and re-types lowercase), allow it effortlessly.
  const handleSmartInputChange = (e) => {
    let val = e.target.value;
    const prevVal = message || "";
    const cursor = e.target.selectionStart;

    // Typing first character into empty input
    if (val.length === 1 && prevVal.length === 0) {
      if (!userPrefersLowercaseRef.current) {
        const firstChar = val.charAt(0);
        if (firstChar >= "a" && firstChar <= "z") {
          val = firstChar.toUpperCase();
          wasAutoCapitalizedRef.current = true;
        }
      }
    } else if (val.length > prevVal.length && val.length - prevVal.length === 1) {
      // Single character typed after sentence-ending punctuation (e.g. ". ", "! ", "? ")
      const charTyped = val.charAt(cursor - 1);
      const textBefore = val.slice(0, cursor - 1);
      if (/(?:^|[.!?]\s+)$/.test(textBefore)) {
        if (!userPrefersLowercaseRef.current && charTyped >= "a" && charTyped <= "z") {
          val = textBefore + charTyped.toUpperCase() + val.slice(cursor);
          wasAutoCapitalizedRef.current = true;
        }
      }
    } else if (val.length === 0) {
      if (!wasAutoCapitalizedRef.current) {
        userPrefersLowercaseRef.current = false;
      }
    }

    e.target.value = val;
    handleTypingEvent(e);
  };

  // Close attachment menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (setSelectedFile) setSelectedFile(file);
    setShowAttachMenu(false);
    e.target.value = null;
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (setSelectedFile) setSelectedFile(file);
    setShowAttachMenu(false);
    e.target.value = null;
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (setSelectedFile) setSelectedFile(file);
    setShowAttachMenu(false);
    e.target.value = null;
  };

  const handleStopAndSendVoice = async () => {
    const res = await voiceRecorder.stopRecording();
    if (res && res.blob && handleSendVoice) {
      handleSendVoice(res.blob, res.duration);
    }
  };

  return (
    <div className="bg-base-100 px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 border-t border-base-300 relative">
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

      {/* Emoji Picker Dropdown */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-[100%] left-4 mb-2 z-50 shadow-xl animate-modal-pop origin-bottom-left"
        >
          <EmojiPicker
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageSelect}
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        className="hidden"
        ref={docInputRef}
        onChange={handleDocSelect}
      />
      <input
        type="file"
        accept="video/*"
        className="hidden"
        ref={videoInputRef}
        onChange={handleVideoSelect}
      />
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={audioInputRef}
        onChange={handleAudioSelect}
      />

      {/* ── LIVE VOICE RECORDING BAR (PRD Section 29) ── */}
      {voiceRecorder.isRecording ? (
        <div className="flex items-center justify-between gap-3 py-1 animate-fade-in bg-base-200/80 px-4 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-error animate-ping"></span>
            <span className="text-sm font-semibold text-error">
              {voiceRecorder.formattedTime}
            </span>
            <span className="text-xs text-base-content/60 hidden sm:inline">
              Recording audio note…
            </span>
          </div>

          <div className="flex items-center gap-2">
            <RemoveActionButton
              onClick={voiceRecorder.cancelRecording}
              size="sm"
              label="Cancel"
              title="Cancel recording"
            />
            <button
              type="button"
              onClick={handleStopAndSendVoice}
              className="btn btn-sm btn-primary rounded-xl gap-1 shadow-sm"
              title="Send voice note"
            >
              <BsFillSendFill size={14} />
              <span>Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── STANDARD INPUT BAR ── */
        <div className="flex items-end gap-1 sm:gap-2">
          {/* Emoji Toggle */}
          <button
            ref={emojiToggleBtnRef}
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`p-1.5 sm:p-2 transition-colors ${
              showEmojiPicker
                ? "text-primary"
                : "text-base-content/50 hover:text-primary"
            }`}
            title="Emoji"
          >
            <BsEmojiSmile size={20} />
          </button>

          {/* Attachment Paperclip & Popup */}
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

            {/* GuftguAttachment Menu Sheet */}
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

                {selectedChat?.isGroup && (
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

          {/* Text Message Input */}
          <form
            onSubmit={(e) => {
              if (e) e.preventDefault();
              handleSendMessage(e, isViewOnce);
              setIsViewOnce(false);
            }}
            className="flex-1 flex items-end gap-2 relative"
          >
            {/* Mention Popup */}
            {showMentionPopup && selectedChat?.isGroup && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-xl shadow-2xl z-[150] animate-fade-in py-1">
                {(selectedChat.members || [])
                  .filter((m) => m && m._id !== loggedInUser?._id && m.name)
                  .filter((m) =>
                    m.name
                      .toLowerCase()
                      .includes((mentionFilter || "").toLowerCase()),
                  )
                  .map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 cursor-pointer transition-colors"
                      onClick={() => handleInsertMention(member)}
                    >
                      <img
                        src={
                          member.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
                        }
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-base-300"
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                  ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleSmartInputChange}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.senderName}…`
                  : "Type a message"
              }
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck="true"
              className="textarea textarea-bordered w-full rounded-xl bg-base-200 min-h-[44px] max-h-32 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none py-3 text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  if (
                    (message.length === 1 || textareaRef.current?.selectionStart === 1) &&
                    wasAutoCapitalizedRef.current
                  ) {
                    userPrefersLowercaseRef.current = true;
                    wasAutoCapitalizedRef.current = false;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  userPrefersLowercaseRef.current = false;
                  wasAutoCapitalizedRef.current = false;
                  handleSendMessage(e, isViewOnce);
                  setIsViewOnce(false);
                }
              }}
            />

            {/* Dynamic Send / Mic Button */}
            {message.trim() || selectedImage || selectedFile ? (
              <button
                type="submit"
                className="btn btn-circle btn-primary btn-sm sm:btn-md shadow-sm active:scale-95 transition-transform"
                title="Send message"
              >
                <BsFillSendFill size={15} className="ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={voiceRecorder.startRecording}
                className="btn btn-circle btn-primary btn-sm sm:btn-md shadow-sm hover:scale-110 active:scale-95 transition-transform"
                title="Record voice message"
              >
                <BsMicFill size={16} />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInputArea;
