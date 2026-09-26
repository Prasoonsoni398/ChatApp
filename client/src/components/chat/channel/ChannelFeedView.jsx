import React from "react";
import {
  BsArrowLeft,
  BsMegaphoneFill,
  BsCheckCircleFill,
  BsTrash,
  BsBellFill,
  BsBellSlashFill,
  BsSendFill,
} from "react-icons/bs";
import ChannelPostItem from "./ChannelPostItem.jsx";

const ChannelFeedView = ({
  selectedChannel,
  setSelectedChannel,
  isOwner,
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
}) => {
  if (!selectedChannel) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-base-200/30">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BsMegaphoneFill size={28} />
        </div>
        <h3 className="font-bold text-lg mb-1">Stay updated on topics you care about</h3>
        <p className="text-xs text-base-content/60 max-w-sm">
          Find channels to follow or create your own to share updates with followers.
        </p>
      </div>
    );
  }

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
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm truncate">
                {selectedChannel.name}
              </h3>
              {selectedChannel.isVerified && (
                <BsCheckCircleFill className="text-primary flex-shrink-0" size={13} />
              )}
            </div>
            <p className="text-[11px] text-base-content/50 truncate">
              {selectedChannel.followersCount || 0} followers • {selectedChannel.description || "Official Channel"}
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
          {selectedChannel.isFollowing && (
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
          <button
            onClick={handleToggleFollow}
            className={`btn btn-sm rounded-full px-4 text-xs font-semibold ${
              selectedChannel.isFollowing
                ? "btn-outline border-base-300 hover:btn-error"
                : "btn-primary"
            }`}
          >
            {selectedChannel.isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedChannel.posts?.length === 0 ? (
          <div className="text-center py-12 text-base-content/40 text-xs">
            No updates posted to this channel yet.
            {isOwner && (
              <p className="mt-2 text-primary font-semibold">
                You are the admin. Use the box below to post the first update!
              </p>
            )}
          </div>
        ) : (
          selectedChannel.posts?.map((post) => (
            <ChannelPostItem
              key={post._id}
              post={post}
              isOwner={isOwner}
              activeEmojiPickerPostId={activeEmojiPickerPostId}
              setActiveEmojiPickerPostId={setActiveEmojiPickerPostId}
              onReact={handleReactPost}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Owner Post Composer Bar */}
      {isOwner ? (
        <form
          onSubmit={handleCreatePost}
          className="p-3 bg-base-100 border-t border-base-300 flex items-center gap-2 flex-shrink-0"
        >
          <input
            type="text"
            placeholder="Broadcast an update to followers..."
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className="input input-sm input-bordered flex-1 rounded-full bg-base-200/50 text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newPostText.trim()}
            className="btn btn-sm btn-circle btn-primary"
            title="Post update"
          >
            <BsSendFill size={13} />
          </button>
        </form>
      ) : (
        <div className="p-2.5 bg-base-200/60 border-t border-base-300 text-center text-[11px] text-base-content/50">
          Only channel admins can post updates. Reactions are private to followers.
        </div>
      )}
    </div>
  );
};

export default ChannelFeedView;
