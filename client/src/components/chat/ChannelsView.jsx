import { useState, useEffect } from "react";
import { BsPlus, BsX, BsMegaphoneFill, BsSearch } from "react-icons/bs";
import toast from "react-hot-toast";
import * as channelService from "../../services/channelService.js";
import socketAPI from "../../config/webSocket.js";
import ChannelListItem from "./channel/ChannelListItem.jsx";
import ChannelFeedView from "./channel/ChannelFeedView.jsx";
import CreateChannelModal from "./channel/CreateChannelModal.jsx";

/**
 * ChannelsView – Guftgu Channels 1-to-many broadcast feeds (PRD Section 49).
 */
const ChannelsView = ({ loggedInUser }) => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [activeEmojiPickerPostId, setActiveEmojiPickerPostId] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const currentUserId = (
    loggedInUser?._id ||
    loggedInUser?.id ||
    storedUser?._id ||
    storedUser?.id
  )?.toString();

  const fetchChannels = async (query = searchQuery) => {
    try {
      const data = await channelService.getChannels(query);
      setChannels(data);
      if (!selectedChannel && data.length > 0) {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
          setSelectedChannel(data[0]);
        }
      } else if (selectedChannel) {
        const refreshed = data.find((c) => c._id === selectedChannel._id);
        if (refreshed) setSelectedChannel(refreshed);
      }
    } catch (_err) {
      console.error("Failed to fetch channels:", _err);
    }
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChannels(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    const handleNewPost = ({ channelId, post }) => {
      setChannels((prev) =>
        prev.map((c) => (c._id === channelId ? { ...c, lastPost: post } : c)),
      );
      if (selectedChannel && selectedChannel._id === channelId) {
        setSelectedChannel((prev) => {
          if (!prev) return prev;
          const exists = prev.posts?.some((p) => p._id === post._id);
          if (exists) return prev;
          return {
            ...prev,
            posts: [...(prev.posts || []), post],
          };
        });
      }
    };

    const handleChannelUpdated = (updatedChannel) => {
      setChannels((prev) =>
        prev.map((c) => (c._id === updatedChannel._id ? updatedChannel : c)),
      );
      if (selectedChannel && selectedChannel._id === updatedChannel._id) {
        setSelectedChannel(updatedChannel);
      }
    };

    socketAPI.on("channelPost", handleNewPost);
    socketAPI.on("channelUpdated", handleChannelUpdated);

    return () => {
      socketAPI.off("channelPost", handleNewPost);
      socketAPI.off("channelUpdated", handleChannelUpdated);
    };
  }, [selectedChannel]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return toast.error("Channel name is required");
    try {
      const data = await channelService.createChannel({
        name: channelName.trim(),
        description: channelDesc.trim(),
      });
      toast.success("Channel created successfully!");
      setShowCreateModal(false);
      setChannelName("");
      setChannelDesc("");
      setChannels((prev) => [data, ...prev]);
      setSelectedChannel(data);
    } catch (err) {
      toast.error(err.message || "Failed to create channel");
    }
  };

  const handleToggleFollow = async () => {
    if (!selectedChannel) return;
    try {
      const res = await channelService.toggleFollowChannel(selectedChannel._id);
      setSelectedChannel((prev) => ({
        ...prev,
        isFollowing: res.isFollowing,
        followersCount: res.followersCount,
      }));
      setChannels((prev) =>
        prev.map((c) =>
          c._id === selectedChannel._id
            ? {
                ...c,
                isFollowing: res.isFollowing,
                followersCount: res.followersCount,
              }
            : c,
        ),
      );
      toast.success(
        res.isFollowing
          ? `Followed ${selectedChannel.name}`
          : `Unfollowed ${selectedChannel.name}`,
      );
    } catch (_err) {
      toast.error("Failed to update follow status");
    }
  };

  const handleToggleMute = async () => {
    if (!selectedChannel) return;
    try {
      const res = await channelService.toggleMuteChannel(selectedChannel._id);
      setSelectedChannel((prev) => ({ ...prev, isMuted: res.isMuted }));
      toast.success(
        res.isMuted ? "Channel updates muted" : "Channel updates unmuted",
      );
    } catch (_err) {
      toast.error("Failed to update mute status");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!selectedChannel || !newPostText.trim()) return;
    try {
      const post = await channelService.createChannelPost(selectedChannel._id, {
        text: newPostText.trim(),
      });
      setSelectedChannel((prev) => ({
        ...prev,
        posts: [...(prev.posts || []), post],
      }));
      setNewPostText("");
      toast.success("Update broadcasted to followers");
    } catch (err) {
      toast.error(err.message || "Failed to post update");
    }
  };

  const handleReactPost = async (postId, emoji) => {
    if (!selectedChannel) return;
    try {
      const res = await channelService.reactChannelPost(
        selectedChannel._id,
        postId,
        emoji,
      );
      setSelectedChannel((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p._id === postId ? { ...p, reactions: res.reactions } : p,
        ),
      }));
      setActiveEmojiPickerPostId(null);
    } catch (_err) {
      toast.error("Failed to react to post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!selectedChannel || !window.confirm("Delete this broadcast update?"))
      return;
    try {
      await channelService.deleteChannelPost(selectedChannel._id, postId);
      setSelectedChannel((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p._id !== postId),
      }));
      toast.success("Post deleted");
    } catch (_err) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteChannel = async () => {
    if (
      !selectedChannel ||
      !window.confirm(
        `Delete channel "${selectedChannel.name}"? This cannot be undone.`,
      )
    )
      return;
    try {
      await channelService.deleteChannel(selectedChannel._id);
      toast.success("Channel deleted");
      const remaining = channels.filter((c) => c._id !== selectedChannel._id);
      setChannels(remaining);
      setSelectedChannel(
        remaining.length > 0 && window.innerWidth >= 768 ? remaining[0] : null,
      );
    } catch (_err) {
      toast.error("Failed to delete channel");
    }
  };

  const isOwner =
    Boolean(selectedChannel?.isOwner) ||
    (Boolean(selectedChannel && currentUserId) &&
      (selectedChannel.owner?._id || selectedChannel.owner)?.toString() ===
        currentUserId);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-base-100 overflow-hidden">
      {/* Channel List Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-base-300 flex flex-col h-full bg-base-100 ${
          selectedChannel ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BsMegaphoneFill size={15} />
            </div>
            <h2 className="text-lg font-bold">Channels</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-sm btn-ghost btn-circle text-primary"
            title="Create Channel"
          >
            <BsPlus size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-base-300 flex-shrink-0">
          <div className="relative">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-xs" />
            <input
              type="text"
              placeholder="Find channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pl-8 rounded-full bg-base-200/60 text-xs focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              >
                <BsX size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-base-200">
          {channels.length === 0 ? (
            <div className="p-8 text-center text-xs text-base-content/50">
              No channels found. Create one to get started!
            </div>
          ) : (
            channels.map((ch) => (
              <ChannelListItem
                key={ch._id}
                channel={ch}
                isSelected={selectedChannel?._id === ch._id}
                onClick={() => setSelectedChannel(ch)}
              />
            ))
          )}
        </div>
      </div>

      {/* Channel Feed View */}
      <ChannelFeedView
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        isOwner={isOwner}
        handleDeleteChannel={handleDeleteChannel}
        handleToggleFollow={handleToggleFollow}
        handleToggleMute={handleToggleMute}
        activeEmojiPickerPostId={activeEmojiPickerPostId}
        setActiveEmojiPickerPostId={setActiveEmojiPickerPostId}
        handleReactPost={handleReactPost}
        handleDeletePost={handleDeletePost}
        newPostText={newPostText}
        setNewPostText={setNewPostText}
        handleCreatePost={handleCreatePost}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        channelName={channelName}
        setChannelName={setChannelName}
        channelDesc={channelDesc}
        setChannelDesc={setChannelDesc}
        handleCreateChannel={handleCreateChannel}
      />
    </div>
  );
};

export default ChannelsView;
