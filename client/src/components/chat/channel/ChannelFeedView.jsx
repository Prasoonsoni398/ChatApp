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
  BsX,
  BsPlusCircleFill,
} from "react-icons/bs";
import ChannelPostItem from "./ChannelPostItem.jsx";

const ChannelFeedView = ({
  selectedChannel,
  setSelectedChannel,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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
        <h3 className="font-bold text-lg mb-1">Stay updated on topics you care about</h3>
        <p className="text-xs text-base-content/60 max-w-sm mb-4">
          Follow channels for announcements or create your own channel to broadcast updates to followers.
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <div className="flex-1 flex flex-col h-full bg-base-200/20 overflow-hidden">
      {/* Channel Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-100 border-b border-base-300 flex-shrink-0">
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
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm truncate">
                {selectedChannel.name}
              </h3>
              {(selectedChannel.verified || selectedChannel.isVerified) && (
                <BsCheckCircleFill className="text-primary flex-shrink-0" size={13} />
              )}
              {isOwner && (
                <span className="badge badge-primary badge-xs py-1.5 px-2 text-[10px] font-semibold">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-base-content/50 truncate">
              {followerCount} follower{followerCount === 1 ? "" : "s"} • {selectedChannel.description || "Broadcast Channel"}
            </p>
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
              title={selectedChannel.isMuted ? "Unmute updates" : "Mute updates"}
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
                  Use the broadcast box below to post your first message or photo to your followers.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-sm text-base-content mb-1">
                  No broadcasts yet
                </p>
                <p className="text-xs text-base-content/60">
                  When the admin posts updates or announcements, they will appear here.
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

      {/* Owner Post Composer Bar or Follower Guidance Bar */}
      {isOwner ? (
        <div className="bg-base-100 border-t border-base-300 p-3 flex-shrink-0">
          {/* Attachment Preview */}
          {filePreview && (
            <div className="mb-2 relative inline-block">
              <div className="relative rounded-xl overflow-hidden border border-base-300 max-w-[120px] max-h-[80px]">
                <img
                  src={filePreview}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                  title="Remove attachment"
                >
                  <BsX size={14} />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={onSubmitPost} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`btn btn-sm btn-ghost btn-circle ${
                selectedFile ? "text-primary" : "text-base-content/60"
              }`}
              title="Attach photo"
            >
              <BsImage size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              type="text"
              placeholder="Broadcast an update to followers..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="input input-sm input-bordered flex-1 rounded-full bg-base-200/50 text-xs focus:outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={(!newPostText.trim() && !selectedFile) || isSubmitting}
              className="btn btn-sm btn-circle btn-primary"
              title="Post update"
            >
              <BsSendFill size={13} />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-3 bg-base-200/60 border-t border-base-300 flex items-center justify-between gap-3 text-xs text-base-content/70 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span>Only channel admins can post updates.</span>
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="btn btn-xs btn-primary rounded-full px-3 gap-1 font-medium"
          >
            <BsPlusCircleFill size={11} />
            Create Your Channel to Post
          </button>
        </div>
      )}
    </div>
  );
};

export default ChannelFeedView;
