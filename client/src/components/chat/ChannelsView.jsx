import { useState, useEffect } from "react";
import {
  BsCheckCircleFill,
  BsPlus,
  BsBellFill,
  BsBellSlashFill,
  BsSendFill,
  BsX,
  BsArrowLeft,
  BsMegaphoneFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as channelService from "../../services/channelService.js";

/**
 * ChannelsView – GuftguChannels 1-to-many broadcast feeds (PRD Section 49).
 */
const ChannelsView = ({ loggedInUser }) => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newPostText, setNewPostText] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");

  const fetchChannels = async () => {
    try {
      const data = await channelService.getChannels();
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
    // eslint-disable-next-line
  }, []);

  const handleToggleFollow = async (channelId) => {
    try {
      const res = await channelService.toggleFollowChannel(channelId);
      setChannels((prev) =>
        prev.map((c) =>
          c._id === channelId
            ? {
                ...c,
                isFollowing: res.isFollowing,
                followerCount: res.followerCount,
              }
            : c,
        ),
      );
      if (selectedChannel?._id === channelId) {
        setSelectedChannel((prev) => ({
          ...prev,
          isFollowing: res.isFollowing,
          followerCount: res.followerCount,
        }));
      }
      toast.success(
        res.isFollowing ? "Followed channel" : "Unfollowed channel",
      );
    } catch (_err) {
      toast.error("Failed to update follow status");
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    try {
      const created = await channelService.createChannel({
        name: channelName.trim(),
        description: channelDesc.trim(),
      });
      toast.success("Channel created!");
      setShowCreateModal(false);
      setChannelName("");
      setChannelDesc("");
      fetchChannels();
      setSelectedChannel(created);
    } catch (_err) {
      toast.error("Failed to create channel");
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() || !selectedChannel) return;
    try {
      const updated = await channelService.postToChannel(selectedChannel._id, {
        text: newPostText.trim(),
      });
      setNewPostText("");
      setSelectedChannel(updated);
      fetchChannels();
      toast.success("Broadcast posted!");
    } catch (_err) {
      toast.error("Failed to post update");
    }
  };

  const isOwner =
    Boolean(selectedChannel && loggedInUser) &&
    (selectedChannel.owner?._id || selectedChannel.owner)?.toString() ===
      (loggedInUser._id || loggedInUser.id)?.toString();

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-base-100 overflow-hidden">
      {/* Channel List Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-base-300 flex flex-col h-full bg-base-100 ${
          selectedChannel ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 flex-shrink-0">
          <h2 className="text-xl font-bold">Channels</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-base-300 text-primary rounded-full transition-colors"
            title="Create Channel"
          >
            <BsPlus size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-base-200">
          {channels.map((ch) => {
            const isSelected = selectedChannel?._id === ch._id;
            return (
              <div
                key={ch._id}
                onClick={() => setSelectedChannel(ch)}
                className={`flex items-center justify-between p-3.5 hover:bg-base-200 cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={ch.avatar}
                    alt={ch.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-sm truncate">
                        {ch.name}
                      </h4>
                      {ch.verified && (
                        <BsCheckCircleFill className="text-primary flex-shrink-0" size={13} />
                      )}
                    </div>
                    <p className="text-xs text-base-content/60 truncate">
                      {ch.followerCount} followers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFollow(ch._id);
                  }}
                  className={`btn btn-xs rounded-full px-3 flex-shrink-0 ${
                    ch.isFollowing
                      ? "btn-ghost border border-base-300 text-base-content/70"
                      : "btn-primary"
                  }`}
                >
                  {ch.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Feed View */}
      {selectedChannel ? (
        <div className="flex-1 flex flex-col h-full bg-base-200/40">
          {/* Header */}
          <div className="h-16 px-3 sm:px-5 flex items-center justify-between bg-base-100 border-b border-base-300 shadow-xs flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedChannel(null)}
                className="md:hidden p-1.5 -ml-1 text-base-content/60 hover:text-primary rounded-lg transition-colors flex-shrink-0"
                title="Back to Channels"
              >
                <BsArrowLeft size={20} />
              </button>
              <img
                src={selectedChannel.avatar}
                alt={selectedChannel.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight truncate">
                    {selectedChannel.name}
                  </h3>
                  {selectedChannel.verified && (
                    <BsCheckCircleFill className="text-primary flex-shrink-0" size={13} />
                  )}
                </div>
                <p className="text-[11px] text-base-content/60">
                  {selectedChannel.followerCount} followers
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleFollow(selectedChannel._id)}
              className={`btn btn-sm rounded-full gap-1.5 flex-shrink-0 ${
                selectedChannel.isFollowing
                  ? "btn-ghost bg-base-200"
                  : "btn-primary"
              }`}
            >
              {selectedChannel.isFollowing ? (
                <>
                  <BsBellSlashFill size={14} /> Unfollow
                </>
              ) : (
                <>
                  <BsBellFill size={14} /> Follow
                </>
              )}
            </button>
          </div>

          {/* Posts Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {selectedChannel.posts?.length === 0 ? (
              <p className="text-center text-xs text-base-content/40 py-12">
                No updates posted in this channel yet.
              </p>
            ) : (
              selectedChannel.posts?.map((post, idx) => (
                <div
                  key={idx}
                  className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-300/80 max-w-xl mx-auto"
                >
                  <p className="text-sm text-base-content whitespace-pre-wrap leading-relaxed">
                    {post.text}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-200 text-[11px] text-base-content/50">
                    <span>
                      {new Date(post.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="badge badge-ghost badge-sm text-[10px]">
                      Broadcast
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Broadcast composer for channel owner */}
          {isOwner && (
            <form
              onSubmit={handlePost}
              className="p-3 bg-base-100 border-t border-base-300 flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Broadcast an update to followers…"
                className="input input-sm input-bordered flex-1 rounded-full bg-base-200"
              />
              <button
                type="submit"
                disabled={!newPostText.trim()}
                className="btn btn-sm btn-circle btn-primary shadow-sm"
              >
                <BsSendFill size={13} />
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-base-200/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BsMegaphoneFill size={28} />
          </div>
          <h3 className="font-bold text-lg">Stay updated with Channels</h3>
          <p className="text-xs text-base-content/60 max-w-sm mt-1">
            Follow channels to get real-time broadcasts, announcements, and updates on topics you care about.
          </p>
        </div>
      )}


      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-300">
            <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
              <h3 className="font-bold text-base">New Channel</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              >
                <BsX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Daily Motivation"
                  className="input input-bordered w-full rounded-xl bg-base-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="Describe your channel…"
                  rows={2}
                  className="textarea textarea-bordered w-full rounded-xl bg-base-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-xl px-4"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsView;
