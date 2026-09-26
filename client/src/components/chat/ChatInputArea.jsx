import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  BsEmojiSmile,
  BsFillSendFill,
  BsMicFill,
} from "react-icons/bs";
import useVoiceRecorder from "../../hooks/useVoiceRecorder.js";
import InputPreviews from "./input/InputPreviews.jsx";
import VoiceRecordingBar from "./input/VoiceRecordingBar.jsx";
import AttachmentMenu from "./input/AttachmentMenu.jsx";
import MentionPopup from "./input/MentionPopup.jsx";

/**
 * ChatInputArea – WhatsApp-style message composer.
 * Includes text input, emoji picker, attachment sheet, and voice note recording.
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
  const handleSmartInputChange = (e) => {
    let val = e.target.value;
    const prevVal = message || "";
    const cursor = e.target.selectionStart;

    if (val.length === 1 && prevVal.length === 0) {
      if (!userPrefersLowercaseRef.current) {
        const firstChar = val.charAt(0);
        if (firstChar >= "a" && firstChar <= "z") {
          val = firstChar.toUpperCase();
          wasAutoCapitalizedRef.current = true;
        }
      }
    } else if (val.length > prevVal.length && val.length - prevVal.length === 1) {
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

  const currentUserId = (loggedInUser?._id || loggedInUser?.id)?.toString();
  const isAnnouncementAdmin =
    !selectedChat?.onlyAdminsCanMessage ||
    (selectedChat?.admin?._id || selectedChat?.admin)?.toString() === currentUserId ||
    (selectedChat?.admins || []).some((a) => (a?._id || a)?.toString() === currentUserId);

  if (selectedChat?.isGroup && selectedChat?.onlyAdminsCanMessage && !isAnnouncementAdmin) {
    return (
      <div className="bg-base-200/60 px-4 py-3.5 border-t border-base-300 text-center text-xs text-base-content/60 flex items-center justify-center gap-2">
        <span className="text-warning">🔒</span>
        <span>Only community admins can send messages to this announcement group.</span>
      </div>
    );
  }

  return (
    <div className="bg-base-100 px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 border-t border-base-300 relative">
      {/* Community Announcement Admin Banner */}
      {selectedChat?.isGroup && selectedChat?.onlyAdminsCanMessage && isAnnouncementAdmin && (
        <div className="px-3 py-1 bg-warning/10 border border-warning/20 rounded-lg text-[11px] text-warning flex items-center gap-1.5 self-center">
          <span className="font-semibold">📢 Announcement Group:</span>
          <span>Only you and community admins can send messages here.</span>
        </div>
      )}

      {/* Input Previews (Reply, Edit, Image, Generic File) */}
      <InputPreviews
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        setMessage={setMessage}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        setSelectedImage={setSelectedImage}
        isViewOnce={isViewOnce}
        setIsViewOnce={setIsViewOnce}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
      />

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

      {/* Live Voice Recording Bar */}
      {voiceRecorder.isRecording ? (
        <VoiceRecordingBar
          voiceRecorder={voiceRecorder}
          onStopAndSend={handleStopAndSendVoice}
        />
      ) : (
        /* Standard Input Bar */
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
          <AttachmentMenu
            showAttachMenu={showAttachMenu}
            setShowAttachMenu={setShowAttachMenu}
            attachMenuRef={attachMenuRef}
            fileInputRef={fileInputRef}
            videoInputRef={videoInputRef}
            docInputRef={docInputRef}
            audioInputRef={audioInputRef}
            onOpenCreatePoll={onOpenCreatePoll}
            onOpenLocationShare={onOpenLocationShare}
            onOpenContactShare={onOpenContactShare}
            onOpenCreateEvent={onOpenCreateEvent}
            isGroup={selectedChat?.isGroup}
          />

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
            <MentionPopup
              show={showMentionPopup && selectedChat?.isGroup}
              members={selectedChat?.members}
              currentUserId={loggedInUser?._id}
              mentionFilter={mentionFilter}
              onInsertMention={handleInsertMention}
            />

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
