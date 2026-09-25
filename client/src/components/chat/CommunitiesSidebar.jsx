import { useState, useEffect } from "react";
import {
  BsPlus,
  BsPeopleFill,
  BsMegaphoneFill,
  BsChevronRight,
  BsX,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as communityService from "../../services/communityService.js";

/**
 * CommunitiesSidebar – GuftguCommunities tab (PRD Section 48).
 * Groups related chats under an umbrella with an announcement feed.
 */
const CommunitiesSidebar = ({ chats = [], onSelectChat }) => {
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const userGroups = chats.filter((c) => c.isGroup);

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const data = await communityService.getCommunities();
      setCommunities(data);
    } catch (_err) {
      console.error("Failed to fetch communities:", _err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a community name");
      return;
    }
    try {
      await communityService.createCommunity({
        name: name.trim(),
        description: description.trim(),
        groupIds: selectedGroupIds,
      });
      toast.success("Community created!");
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setSelectedGroupIds([]);
      fetchCommunities();
    } catch (_err) {
      toast.error("Failed to create community");
    }
  };

  const toggleGroupSelect = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  return (
    <div className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 h-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300">
        <h2 className="text-xl font-bold">Communities</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 hover:bg-base-300 text-primary rounded-full transition-all duration-200"
          title="New Community"
        >
          <BsPlus size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Intro Banner */}
        <div className="p-4 border-b border-base-200 bg-base-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <BsPeopleFill size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">
              Stay connected with a Community
            </h4>
            <p className="text-xs text-base-content/60">
              Communities bring members together in topic-based groups.
            </p>
          </div>
        </div>

        {/* Community List */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        ) : communities.length === 0 ? (
          <div className="p-8 text-center text-base-content/50">
            <p className="text-sm font-medium">No communities yet</p>
            <p className="text-xs text-base-content/40 mt-1">
              Create a community to group related discussions together.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-sm btn-primary rounded-xl mt-4"
            >
              Start a Community
            </button>
          </div>
        ) : (
          communities.map((comm) => (
            <div key={comm._id} className="border-b border-base-300">
              {/* Community Header Card */}
              <div className="p-3.5 bg-base-200/40 flex items-center gap-3">
                <img
                  src={comm.avatar}
                  alt={comm.name}
                  className="w-11 h-11 rounded-2xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{comm.name}</h3>
                  <p className="text-xs text-base-content/60 truncate">
                    {comm.description || "Community"}
                  </p>
                </div>
              </div>

              {/* Sub-groups */}
              <div className="divide-y divide-base-200 pl-4 bg-base-100">
                {/* Announcements entry */}
                <div
                  onClick={() => {
                    const firstG = comm.groups?.[0];
                    if (firstG) {
                      const gid = firstG._id || firstG.id;
                      const chatMatch = chats.find(
                        (c) => c.id === gid || c._id === gid,
                      );
                      if (chatMatch) {
                        onSelectChat(chatMatch);
                      } else {
                        onSelectChat({
                          id: gid,
                          _id: gid,
                          name: `${comm.name} Announcements`,
                          isGroup: true,
                          avatar: comm.avatar || firstG.avatar,
                          members: firstG.members || comm.members || [],
                        });
                      }
                    } else {
                      onSelectChat({
                        id: comm._id,
                        _id: comm._id,
                        name: `${comm.name} Announcements`,
                        isGroup: true,
                        avatar: comm.avatar,
                        members: comm.members || [],
                      });
                    }
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-warning/20 text-warning flex items-center justify-center flex-shrink-0">
                    <BsMegaphoneFill size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs">{comm.name} Announcements</h5>
                    <p className="text-[11px] text-base-content/50 truncate">
                      Community admin messages
                    </p>
                  </div>
                  <BsChevronRight
                    size={12}
                    className="text-base-content/40 mr-2"
                  />
                </div>

                {/* Linked topic groups */}
                {comm.groups?.map((g) => {
                  const gid = g._id || g.id;
                  return (
                    <div
                      key={gid}
                      onClick={() => {
                        const chatMatch = chats.find(
                          (c) => c.id === gid || c._id === gid,
                        );
                        if (chatMatch) {
                          onSelectChat(chatMatch);
                        } else {
                          onSelectChat({
                            id: gid,
                            _id: gid,
                            name: g.name,
                            isGroup: true,
                            avatar:
                              g.avatar ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
                            members: g.members || [],
                          });
                        }
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-colors"
                    >
                      <img
                        src={
                          g.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`
                        }
                        alt={g.name}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-xs truncate">
                          {g.name}
                        </h5>
                        <p className="text-[11px] text-base-content/50">
                          {g.members?.length || 0} members
                        </p>
                      </div>
                      <BsChevronRight
                        size={12}
                        className="text-base-content/40 mr-2"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
              <h3 className="font-bold text-base">New Community</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              >
                <BsX size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCommunity}
              className="p-5 overflow-y-auto space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. University Batch 2026"
                  className="input input-bordered w-full rounded-xl bg-base-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this community for?"
                  rows={2}
                  className="textarea textarea-bordered w-full rounded-xl bg-base-200"
                />
              </div>

              {userGroups.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1.5">
                    Add Existing Groups
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border border-base-300 rounded-xl p-2 bg-base-200/50">
                    {userGroups.map((g) => {
                      const gid = g.id || g._id;
                      const isChecked = selectedGroupIds.includes(gid);
                      return (
                        <div
                          key={gid}
                          onClick={() => toggleGroupSelect(gid)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={g.avatar}
                              alt={g.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <span className="text-xs font-medium truncate">
                              {g.name}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="checkbox checkbox-primary checkbox-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesSidebar;
