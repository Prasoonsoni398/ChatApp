import { useState, useEffect } from "react";
import { BsPlus, BsX, BsMegaphoneFill, BsSearch, BsPlusCircleFill } from "react-icons/bs";
import toast from "react-hot-toast";
import * as channelService from "../../services/channelService.js";
import socketAPI from "../../config/webSocket.js";
import ChannelListItem from "./channel/ChannelListItem.jsx";
import ChannelFeedView from "./channel/ChannelFeedView.jsx";
import CreateChannelModal from "./channel/CreateChannelModal.jsx";

/**
 * ChannelsView – Guftgu Channels 1-to-many broadcast feeds.
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
        if (refreshed) {
          setSelectedChannel((prev) => ({
            ...prev,
            ...refreshed,
          }));
        }
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
            posts: [post, ...(prev.posts || [])],
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

  const handleCreateChannel = async (e, avatarFile = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!channelName.trim()) return toast.error("Channel name is required");
    try {
      let payload;
      if (avatarFile) {
        payload = new FormData();
        payload.append("name", channelName.trim());
        payload.append("description", channelDesc.trim());
        payload.append("file", avatarFile);
      } else {
        payload = {
          name: channelName.trim(),
          description: channelDesc.trim(),
        };
      }
      const data = await channelService.createChannel(payload);
      toast.success("Channel created successfully! You can now post updates.");
      setShowCreateModal(false);
      setChannelName("");
      setChannelDesc("");

      const channelWithOwnership = {
        ...data,
        isOwner: true,
        followerCount: data.followerCount || 1,
        posts: data.posts || [],
      };
      setChannels((prev) => [
        channelWithOwnership,
        ...prev.filter((c) => c._id !== data._id),
      ]);
      setSelectedChannel(channelWithOwnership);
    } catch (err) {
      toast.error(err.message || "Failed to create channel");
    }
  };

  const handleToggleFollow = async (channelId = selectedChannel?._id) => {
    if (!channelId) return;
    try {
      const res = await channelService.toggleFollowChannel(channelId);
      const count = res.followerCount ?? res.followersCount ?? 0;
      setSelectedChannel((prev) => {
        if (!prev || prev._id !== channelId) return prev;
        return {
          ...prev,
          isFollowing: res.isFollowing,
          followerCount: count,
          followersCount: count,
        };
      });
      setChannels((prev) =>
        prev.map((c) =>
          c._id === channelId
            ? {
                ...c,
                isFollowing: res.isFollowing,
                followerCount: count,
                followersCount: count,
              }
            : c,
        ),
      );
      toast.success(
        res.isFollowing ? "Followed channel" : "Unfollowed channel",
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

  const handleCreatePost = async (e, mediaFile = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedChannel) return;
    if (!newPostText.trim() && !mediaFile) return;

    try {
      let postPayload;
      if (mediaFile) {
        postPayload = new FormData();
        postPayload.append("text", newPostText.trim());
        postPayload.append("file", mediaFile);
      } else {
        postPayload = {
          text: newPostText.trim(),
        };
      }

      const res = await channelService.postToChannel(selectedChannel._id, postPayload);
      const newPost = res.post || (Array.isArray(res.posts) ? res.posts[0] : res);

      setSelectedChannel((prev) => {
        if (!prev) return prev;
        const exists = prev.posts?.some((p) => p._id === newPost._id);
        if (exists) return prev;
        return {
          ...prev,
          posts: [newPost, ...(prev.posts || [])],
        };
      });

      setChannels((prev) =>
        prev.map((c) =>
          c._id === selectedChannel._id
            ? { ...c, lastPost: newPost }
            : c,
        ),
      );

      setNewPostText("");
      toast.success("Broadcast posted to channel!");
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

  const isChannelOwner = (ch) => {
    if (!ch) return false;
    if (ch.isOwner) return true;
    const ownerId = (ch.owner?._id || ch.owner)?.toString();
    return Boolean(ownerId && currentUserId && ownerId === currentUserId);
  };

  const isSelectedOwner = isChannelOwner(selectedChannel);

  // Group channels into "Channels You Admin" and "Other Channels"
  const myChannels = channels.filter((ch) => isChannelOwner(ch));
  const otherChannels = channels.filter((ch) => !isChannelOwner(ch));

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
            className="btn btn-sm btn-primary rounded-full px-3 gap-1 text-xs shadow-sm"
            title="Create Channel"
          >
            <BsPlus size={18} />
            <span>New Channel</span>
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

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto divide-y divide-base-200">
          {/* Quick Creator CTA Card if user hasn't created a channel yet */}
          {myChannels.length === 0 && (
            <div className="p-3.5 m-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <BsMegaphoneFill size={13} />
                <span>Want to post updates?</span>
              </div>
              <p className="text-[11px] text-base-content/70 leading-relaxed">
                Create your own broadcast channel to share news, updates, and photos with followers.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-xs btn-primary rounded-full px-3 gap-1 w-full font-semibold"
              >
                <BsPlusCircleFill size={12} />
                Create Your Channel
              </button>
            </div>
          )}

          {/* Section: Your Channels */}
          {myChannels.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-base-200/40 text-[11px] font-bold text-base-content/60 uppercase tracking-wider flex items-center justify-between">
                <span>Channels You Manage</span>
                <span className="badge badge-xs badge-primary font-mono">{myChannels.length}</span>
              </div>
              {myChannels.map((ch) => (
                <ChannelListItem
                  key={ch._id}
                  channel={ch}
                  isSelected={selectedChannel?._id === ch._id}
                  onSelect={() => setSelectedChannel(ch)}
                  onClick={() => setSelectedChannel(ch)}
                  onToggleFollow={handleToggleFollow}
                  isOwner={true}
                />
              ))}
            </div>
          )}

          {/* Section: Other Channels */}
          <div>
            {myChannels.length > 0 && (
              <div className="px-4 py-2 bg-base-200/40 text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                <span>Discover & Followed Channels</span>
              </div>
            )}
            {otherChannels.length === 0 && myChannels.length === 0 ? (
              <div className="p-8 text-center text-xs text-base-content/50">
                No channels found. Click &quot;New Channel&quot; above to create the first one!
              </div>
            ) : (
              otherChannels.map((ch) => (
                <ChannelListItem
                  key={ch._id}
                  channel={ch}
                  isSelected={selectedChannel?._id === ch._id}
                  onSelect={() => setSelectedChannel(ch)}
                  onClick={() => setSelectedChannel(ch)}
                  onToggleFollow={handleToggleFollow}
                  isOwner={false}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Channel Feed View */}
      <ChannelFeedView
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        isOwner={isSelectedOwner}
        currentUserId={currentUserId}
        handleDeleteChannel={handleDeleteChannel}
        handleToggleFollow={() => handleToggleFollow(selectedChannel?._id)}
        handleToggleMute={handleToggleMute}
        activeEmojiPickerPostId={activeEmojiPickerPostId}
        setActiveEmojiPickerPostId={setActiveEmojiPickerPostId}
        handleReactPost={handleReactPost}
        handleDeletePost={handleDeletePost}
        newPostText={newPostText}
        setNewPostText={setNewPostText}
        handleCreatePost={handleCreatePost}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateModal}
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        channelName={channelName}
        setChannelName={setChannelName}
        channelDesc={channelDesc}
        setChannelDesc={setChannelDesc}
        onSubmit={handleCreateChannel}
        handleCreateChannel={handleCreateChannel}
      />
    </div>
  );
};

export default ChannelsView;
