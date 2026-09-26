import { useState, useRef, useEffect } from "react";
import {
  BsArrowLeft,
  BsMegaphoneFill,
  BsCheckCircleFill,
  BsTrash,
  BsBellFill,
  BsBellSlashFill,
  BsSendFill,
  BsImage,
  BsCameraVideoFill,
  BsMusicNoteBeamed,
  BsFileEarmarkTextFill,
  BsX,
  BsPlusCircleFill,
  BsPaperclip,
  BsChevronDown,
  BsEmojiSmile,
  BsCheck2,
} from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import ChannelPostItem from "./ChannelPostItem.jsx";
import toast from "react-hot-toast";

const ChannelFeedView = ({
  selectedChannel,
  setSelectedChannel,
  myChannels = [],
  channels = [],
  isOwner,
  currentUserId,
  handleDeleteChannel,
  handleToggleFollow,
  handleToggleMute,
  activeEmojiPickerPostId,
  setActiveEmojiPickerPostId,
  handleReactPost,
  handleDeletePost,
  newPostText,
  setNewPostText,
  handleCreatePost,
  onOpenCreateModal,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [fileType, setFileType] = useState(""); // "image" | "video" | "audio" | "document"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);

  const fileInputImageRef = useRef(null);
  const fileInputVideoRef = useRef(null);
  const fileInputAudioRef = useRef(null);
  const fileInputDocRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const channelDropdownRef = useRef(null);
  const textInputRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        channelDropdownRef.current &&
        !channelDropdownRef.current.contains(e.target)
      ) {
        setShowChannelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  if (!selectedChannel) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-base-200/30">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BsMegaphoneFill size={28} />
        </div>
        <h3 className="font-bold text-lg mb-1">
          Stay updated on topics you care about
        </h3>
        <p className="text-xs text-base-content/60 max-w-sm mb-4">
          Follow channels for announcements or create your own channel to
          broadcast updates, photos, videos, or documents to followers.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="btn btn-sm btn-primary rounded-full px-5 gap-2"
        >
          <BsPlusCircleFill size={15} />
          Create a Channel
        </button>
      </div>
    );
  }

  const followerCount =
    selectedChannel.followerCount ??
    selectedChannel.followersCount ??
    selectedChannel.followers?.length ??
    0;

  const handleSelectFile = (file, type) => {
    if (!file) return;

    const isAudioOrVideo =
      type === "video" ||
      type === "audio" ||
      file.type?.startsWith("audio/") ||
      file.type?.startsWith("video/") ||
      /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba|mp4|webm|mov|mkv|avi|3gp|m4v)$/i.test(
        file.name || "",
      );

    if (isAudioOrVideo && file.size > 5 * 1024 * 1024) {
      toast.error("Audio and video uploads cannot exceed 5MB.");
      return;
    }

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    let detectedType = type;
    if (!detectedType) {
      if (file.type?.startsWith("image/")) detectedType = "image";
      else if (file.type?.startsWith("video/")) detectedType = "video";
      else if (file.type?.startsWith("audio/")) detectedType = "audio";
      else detectedType = "document";
    }

    setSelectedFile(file);
    setFileType(detectedType);
    setFilePreview(URL.createObjectURL(file));
    setShowAttachMenu(false);
  };

  const handleClearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview("");
    setFileType("");
    if (fileInputImageRef.current) fileInputImageRef.current.value = "";
    if (fileInputVideoRef.current) fileInputVideoRef.current.value = "";
    if (fileInputAudioRef.current) fileInputAudioRef.current.value = "";
    if (fileInputDocRef.current) fileInputDocRef.current.value = "";
  };

  const onSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedFile) return;
    setIsSubmitting(true);
    try {
      await handleCreatePost(e, selectedFile);
      handleClearFile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewPostText((prev) => prev + (emojiData.emoji || ""));
    textInputRef.current?.focus();
  };

  // Find a managed channel to recommend if currently viewing another channel
  const primaryAdminChannel = myChannels.find(
    (c) => c._id !== selectedChannel._id,
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-base-200/20 overflow-hidden">
      {/* Channel Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-100 border-b border-base-300 flex-shrink-0 z-30 relative">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSelectedChannel(null)}
            className="md:hidden btn btn-sm btn-ghost btn-circle"
          >
            <BsArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 border border-primary/20 flex items-center justify-center">
            {selectedChannel.avatar ? (
              <img
                src={selectedChannel.avatar}
                alt={selectedChannel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <BsMegaphoneFill className="text-primary" size={18} />
            )}
          </div>

          <div className="min-w-0 relative" ref={channelDropdownRef}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowChannelDropdown((v) => !v)}
                className="font-bold text-sm truncate flex items-center gap-1 hover:text-primary transition-colors text-left"
                title="Switch channel"
              >
                <span>{selectedChannel.name}</span>
                <BsChevronDown size={11} className="opacity-60 flex-shrink-0" />
              </button>
              {(selectedChannel.verified || selectedChannel.isVerified) && (
                <BsCheckCircleFill
                  className="text-primary flex-shrink-0"
                  size={13}
                />
              )}
              {isOwner && (
                <span className="badge badge-primary badge-xs py-1.5 px-2 text-[10px] font-semibold">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-base-content/50 truncate">
              {followerCount} follower{followerCount === 1 ? "" : "s"} •{" "}
              {selectedChannel.description || "Broadcast Channel"}
            </p>

            {/* Channels Switcher Dropdown */}
            {showChannelDropdown && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-2 z-50 animate-slide-up origin-top-left">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-base-content/50 flex items-center justify-between">
                  <span>Channels You Admin</span>
                  <span className="badge badge-xs badge-primary font-mono">
                    {myChannels.length}
                  </span>
                </div>
                {myChannels.length === 0 ? (
                  <div className="p-3 text-xs text-base-content/50 text-center">
                    No channels created yet
                  </div>
                ) : (
                  myChannels.map((ch) => (
                    <button
                      key={ch._id}
                      type="button"
                      onClick={() => {
                        setSelectedChannel(ch);
                        setShowChannelDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors hover:bg-base-200 ${
                        selectedChannel._id === ch._id
                          ? "bg-primary/10 text-primary font-semibold"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <BsMegaphoneFill size={12} className="flex-shrink-0" />
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {selectedChannel._id === ch._id && (
                        <BsCheck2
                          size={15}
                          className="text-primary flex-shrink-0"
                        />
                      )}
                    </button>
                  ))
                )}

                <div className="divider my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChannelDropdown(false);
                    onOpenCreateModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-primary font-semibold hover:bg-primary/10 transition-colors"
                >
                  <BsPlusCircleFill size={14} />
                  <span>Create New Channel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOwner && (
            <button
              onClick={handleDeleteChannel}
              className="btn btn-sm btn-ghost text-error btn-circle"
              title="Delete Channel"
            >
              <BsTrash size={16} />
            </button>
          )}
          {selectedChannel.isFollowing && !isOwner && (
            <button
              onClick={handleToggleMute}
              className="btn btn-sm btn-ghost btn-circle text-base-content/70"
              title={
                selectedChannel.isMuted ? "Unmute updates" : "Mute updates"
              }
            >
              {selectedChannel.isMuted ? (
                <BsBellSlashFill size={16} className="text-warning" />
              ) : (
                <BsBellFill size={16} />
              )}
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleToggleFollow}
              className={`btn btn-sm rounded-full px-4 text-xs font-semibold ${
                selectedChannel.isFollowing
                  ? "btn-outline border-base-300 hover:btn-error hover:text-white"
                  : "btn-primary"
              }`}
            >
              {selectedChannel.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Feed Posts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedChannel.posts?.length === 0 ? (
          <div className="text-center py-16 px-4 text-base-content/50 text-xs max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-base-300/50 flex items-center justify-center mx-auto mb-3 text-base-content/40">
              <BsMegaphoneFill size={20} />
            </div>
            {isOwner ? (
              <div>
                <p className="font-semibold text-sm text-base-content mb-1">
                  You are the channel admin!
                </p>
                <p className="text-xs text-base-content/60">
                  Use the broadcast box below to post your first message, photo,
                  video, or audio update to your followers.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-sm text-base-content mb-1">
                  No broadcasts yet
                </p>
                <p className="text-xs text-base-content/60">
                  When the admin posts updates or announcements, they will
                  appear here.
                </p>
              </div>
            )}
          </div>
        ) : (
          selectedChannel.posts?.map((post) => (
            <ChannelPostItem
              key={post._id}
              post={post}
              isOwner={isOwner}
              currentUserId={currentUserId}
              activeEmojiPickerPostId={activeEmojiPickerPostId}
              setActiveEmojiPickerPostId={setActiveEmojiPickerPostId}
              onReact={handleReactPost}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Owner Post Composer Bar or Follower Quick-Switch Bar */}
      {isOwner ? (
        <div className="bg-base-100 border-t border-base-300 p-3 flex-shrink-0 relative">
          {/* Attachment Preview Card */}
          {filePreview && (
            <div className="mb-2 relative inline-flex items-center gap-3 p-2 bg-base-200/80 rounded-2xl border border-base-300 max-w-md animate-fade-in">
              {fileType === "image" ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : fileType === "video" ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex items-center justify-center text-white flex-shrink-0">
                  <BsCameraVideoFill size={20} />
                </div>
              ) : fileType === "audio" ? (
                <div className="w-14 h-14 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                  <BsMusicNoteBeamed size={20} />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-base-300 flex items-center justify-center text-base-content flex-shrink-0">
                  <BsFileEarmarkTextFill size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-semibold truncate">
                  {selectedFile?.name || "Attachment"}
                </p>
                <p className="text-[10px] text-base-content/60">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • `
                    : ""}
                  {fileType.toUpperCase()}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearFile}
                className="w-6 h-6 rounded-full bg-base-300 hover:bg-error hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <BsX size={16} />
              </button>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 left-3 z-50 shadow-2xl rounded-2xl overflow-hidden animate-slide-up"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={320}
                height={380}
              />
            </div>
          )}

          <form onSubmit={onSubmitPost} className="flex items-center gap-2">
            {/* Attachment Dropdown Menu */}
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setShowAttachMenu((v) => !v)}
                className={`btn btn-sm btn-ghost btn-circle ${
                  selectedFile ? "text-primary" : "text-base-content/70"
                }`}
                title="Add attachment"
              >
                <BsPaperclip size={19} />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-base-100 rounded-2xl shadow-xl border border-base-300 p-1.5 z-50 animate-slide-up origin-bottom-left">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputImageRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-base-200 transition-colors text-left"
                  >
                    <BsImage size={15} className="text-primary" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputVideoRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-base-200 transition-colors text-left"
                  >
                    <BsCameraVideoFill size={15} className="text-secondary" />
                    <span>Video (Max 5MB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputAudioRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-base-200 transition-colors text-left"
                  >
                    <BsMusicNoteBeamed size={15} className="text-accent" />
                    <span>Audio (Max 5MB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputDocRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-base-200 transition-colors text-left"
                  >
                    <BsFileEarmarkTextFill size={15} className="text-info" />
                    <span>Document / File</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden specialized file inputs */}
            <input
              ref={fileInputImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSelectFile(e.target.files?.[0], "image")}
            />
            <input
              ref={fileInputVideoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleSelectFile(e.target.files?.[0], "video")}
            />
            <input
              ref={fileInputAudioRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              className="hidden"
              onChange={(e) => handleSelectFile(e.target.files?.[0], "audio")}
            />
            <input
              ref={fileInputDocRef}
              type="file"
              className="hidden"
              onChange={(e) =>
                handleSelectFile(e.target.files?.[0], "document")
              }
            />

            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="btn btn-sm btn-ghost btn-circle text-base-content/70"
              title="Insert emoji"
            >
              <BsEmojiSmile size={18} />
            </button>

            {/* Message input */}
            <input
              ref={textInputRef}
              type="text"
              placeholder={`Broadcast update to ${selectedChannel.name}...`}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="input input-sm input-bordered flex-1 rounded-full bg-base-200/50 text-xs focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={(!newPostText.trim() && !selectedFile) || isSubmitting}
              className="btn btn-sm btn-circle btn-primary"
              title="Post broadcast"
            >
              <BsSendFill size={13} />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-3 bg-base-200/60 border-t border-base-300 flex items-center justify-between gap-3 text-xs text-base-content/70 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span>Only channel admins can post updates to this channel.</span>
          </div>

          {primaryAdminChannel ? (
            <button
              type="button"
              onClick={() => setSelectedChannel(primaryAdminChannel)}
              className="btn btn-xs btn-primary rounded-full px-3 gap-1 font-semibold"
            >
              <BsMegaphoneFill size={11} />
              Switch to {primaryAdminChannel.name} to Broadcast
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="btn btn-xs btn-primary rounded-full px-3 gap-1 font-medium"
            >
              <BsPlusCircleFill size={11} />
              Create Your Channel to Broadcast
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelFeedView;
