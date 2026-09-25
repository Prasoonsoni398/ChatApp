import { useState, useEffect } from "react";
import {
  BsX,
  BsPeopleFill,
  BsPersonPlusFill,
  BsShieldCheck,
  BsBellFill,
  BsLink45Deg,
  BsShieldExclamation,
  BsBoxArrowRight,
  BsSearch,
  BsArrowsFullscreen,
  BsPersonFill,
  BsCheckCircleFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as groupService from "../../services/groupService.js";
import ProfilePhotoViewerModal from "./ProfilePhotoViewerModal.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import ToggleSwitch from "../common/ToggleSwitch.jsx";

/**
 * GroupInfoModal — WhatsApp-style Group Details Drawer / Modal.
 * Opens when clicking on Group DP or Group Name in the chat header.
 * Displays group avatar (with zoom), participants list, WHO added each member,
 * creation details, group settings, and invite links.
 */
const GroupInfoModal = ({
  isOpen,
  onClose,
  group,
  loggedInUser,
  allContacts = [],
  isMuted,
  onToggleMute,
  onOpenInviteLink,
  onLeaveGroup,
  onOpenReport,
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && group?.id) {
      loadGroupDetails();
    }
  }, [isOpen, group?.id]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupDetails(group.id);
      setDetails(data);
    } catch (_err) {
      // Fallback to basic group info
      setDetails(group);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  const currentUserId = loggedInUser?._id;
  const adminId = details?.admin?._id || details?.admin || group.admin;
  const isAdmin =
    adminId?.toString() === currentUserId?.toString() ||
    (details?.admins || []).some(
      (a) => (a._id || a).toString() === currentUserId?.toString(),
    );

  const avatarSrc =
    details?.avatar ||
    group.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`;

  // Filter members by search input
  const members = details?.members || group.members || [];
  const memberDetails = details?.memberDetails || [];

  const filteredMembers = members.filter((m) => {
    const name = m.name || "";
    const phone = m.phone || "";
    const q = memberSearch.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q);
  });

  // Contacts that can be added (not currently members)
  const availableContactsToAdd = (allContacts || []).filter(
    (c) => !members.some((m) => (m._id || m).toString() === c._id.toString()),
  );

  const handleAddMembersSubmit = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setIsAdding(true);
      const updated = await groupService.addMembersToGroup(group.id, selectedToAdd);
      setDetails(updated);
      setSelectedToAdd([]);
      setShowAddMemberModal(false);
      toast.success("Members added successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to add members");
    } finally {
      setIsAdding(false);
    }
  };

  // Helper to determine who added a member
  const getWhoAddedInfo = (member) => {
    const memId = (member._id || member).toString();
    if (memId === adminId?.toString()) {
      return "Group Creator";
    }

    const detail = memberDetails.find(
      (d) => (d.user?._id || d.user)?.toString() === memId,
    );

    if (detail) {
      if (detail.addedBy) {
        const adderName =
          detail.addedBy._id?.toString() === currentUserId?.toString()
            ? "You"
            : detail.addedBy.name || "Admin";
        return `Added by ${adderName}`;
      } else {
        return "Joined via invite link";
      }
    }

    // Default if not recorded yet
    const creatorName =
      adminId?.toString() === currentUserId?.toString()
        ? "You"
        : details?.admin?.name || "Admin";
    return `Added by ${creatorName}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end sm:bg-black/50 sm:backdrop-blur-xs bg-base-100 animate-fadeIn">
        <div className="bg-base-100 w-full sm:max-w-md h-full shadow-2xl flex flex-col sm:border-l border-base-300 overflow-hidden animate-slide-left">
          {/* Header */}
          <div className="h-16 px-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <BsPeopleFill className="text-primary text-lg" />
              Group Info
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              title="Close"
            >
              <BsX size={24} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-base-300">
            {/* Overview Card */}
            <div className="p-6 flex flex-col items-center text-center bg-base-100">
              <div
                className="relative group cursor-pointer"
                onClick={() => setShowPhotoViewer(true)}
                title="Click to view full photo"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-2 border-primary/20 group-hover:border-primary transition-all">
                  <img
                    src={avatarSrc}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <BsArrowsFullscreen className="text-white text-xl" />
                </div>
              </div>

              <h2 className="text-xl font-bold mt-4 text-base-content">
                {details?.name || group.name}
              </h2>
              <p className="text-xs font-medium text-base-content/60 mt-1">
                Group · {members.length} participant{members.length > 1 ? "s" : ""}
              </p>

              {/* Group Description */}
              {details?.description && (
                <div className="mt-3 p-3 rounded-xl bg-base-200/50 border border-base-300 text-xs text-base-content/80 text-left w-full leading-relaxed">
                  <span className="font-semibold block text-base-content/60 mb-0.5">
                    Description:
                  </span>
                  {details.description}
                </div>
              )}

              {/* Group Creator & Date info */}
              <p className="text-[11px] text-base-content/50 mt-3">
                Created by{" "}
                <span className="font-semibold text-base-content/80">
                  {details?.admin?._id === currentUserId
                    ? "You"
                    : details?.admin?.name || "Admin"}
                </span>{" "}
                {details?.createdAt
                  ? `on ${new Date(details.createdAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>

            {/* Media & Docs Exchanged */}
            <div className="p-4 bg-base-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-base-content block">
                  Media, links and docs
                </span>
                <span className="text-xs text-base-content/50">
                  {details?.mediaCount !== undefined
                    ? `${details.mediaCount} shared items`
                    : "Shared media"}
                </span>
              </div>
            </div>

            {/* Group Settings / Mute */}
            <div className="p-4 bg-base-100 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                Group Settings
              </span>

              {/* Mute toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <BsBellFill
                    className={isMuted ? "text-primary" : "text-base-content/50"}
                    size={17}
                  />
                  <div>
                    <span className="text-sm font-medium text-base-content block">
                      Mute notifications
                    </span>
                    <span className="text-xs text-base-content/50">
                      {isMuted ? "Muted" : "Unmuted"}
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={Boolean(isMuted)}
                  onChange={() => onToggleMute?.()}
                  size="sm"
                />
              </div>

              {/* Invite via Link */}
              <div
                className="flex items-center justify-between py-2 cursor-pointer hover:bg-base-200/50 rounded-xl p-2 -mx-2 transition-colors"
                onClick={() => onOpenInviteLink?.()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <BsLink45Deg size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-base-content block">
                      Invite via link
                    </span>
                    <span className="text-xs text-base-content/50">
                      Share link to join this group
                    </span>
                  </div>
                </div>
                <span className="text-xs text-base-content/50">›</span>
              </div>
            </div>

            {/* Participants Section */}
            <div className="p-4 bg-base-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {members.length} Participants
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn btn-xs btn-primary rounded-xl flex items-center gap-1.5"
                  >
                    <BsPersonPlusFill size={13} />
                    Add Member
                  </button>
                )}
              </div>

              {/* Search members in group */}
              {members.length > 4 && (
                <div className="relative">
                  <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search participants..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="input input-bordered input-xs w-full pl-8 rounded-lg"
                  />
                </div>
              )}

              {/* Member list */}
              <div className="space-y-1.5 mt-2">
                {filteredMembers.map((member) => {
                  const mId = (member._id || member).toString();
                  const isMemberAdmin =
                    mId === adminId?.toString() ||
                    (details?.admins || []).some(
                      (a) => (a._id || a).toString() === mId,
                    );
                  const isSelf = mId === currentUserId?.toString();
                  const whoAddedText = getWhoAddedInfo(member);

                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} />
                            ) : (
                              <BsPersonFill className="text-2xl text-base-content/40 m-auto mt-2" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-base-content truncate">
                              {isSelf ? "You" : member.name || "Member"}
                            </span>
                            {isMemberAdmin && (
                              <span className="badge badge-xs badge-primary font-medium text-[10px]">
                                Group Admin
                              </span>
                            )}
                          </div>
                          {/* WHO ADDED THEM TO THE GROUP */}
                          <p className="text-xs text-primary/80 font-medium truncate mt-0.5">
                            {whoAddedText}
                          </p>
                        </div>
                      </div>

                      {member.phone && (
                        <span className="text-[11px] text-base-content/40 flex-shrink-0 ml-2">
                          {member.phone}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone: Leave Group & Report */}
            <div className="p-4 bg-base-100 space-y-2">
              <RemoveActionButton
                onClick={() => onLeaveGroup?.()}
                fullWidth
                variant="row"
                size="md"
                icon={<BsBoxArrowRight size={17} />}
                label="Exit group"
              />

              <RemoveActionButton
                onClick={() => onOpenReport?.()}
                fullWidth
                variant="row"
                size="md"
                icon={<BsShieldExclamation size={17} />}
                label="Report group"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-base-300">
            <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
              <h4 className="font-bold text-base flex items-center gap-2">
                <BsPersonPlusFill className="text-primary" />
                Add Participants
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
                title="Close"
              >
                <BsX size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-base-content/60">
                Select from your added contacts to add to this group:
              </p>

              {availableContactsToAdd.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-base-300 rounded-xl p-2">
                  {availableContactsToAdd.map((contact) => {
                    const isChecked = selectedToAdd.includes(contact._id);
                    return (
                      <label
                        key={contact._id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={isChecked}
                            onChange={(e) => {
                              setSelectedToAdd((prev) =>
                                e.target.checked
                                  ? [...prev, contact._id]
                                  : prev.filter((id) => id !== contact._id),
                              );
                            }}
                          />
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full bg-base-300">
                              <img src={contact.avatar} alt={contact.name} />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{contact.name}</p>
                            <p className="text-[11px] text-base-content/50">
                              {contact.phone || contact.email}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-center text-base-content/50 py-4 italic">
                  All your added contacts are already members of this group.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn btn-sm btn-ghost flex-1 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMembersSubmit}
                  disabled={selectedToAdd.length === 0 || isAdding}
                  className="btn btn-sm btn-primary flex-1 rounded-xl"
                >
                  {isAdding ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    `Add (${selectedToAdd.length})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Photo Viewer */}
      <ProfilePhotoViewerModal
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        avatarUrl={avatarSrc}
        name={details?.name || group.name}
        isGroup={true}
      />
    </>
  );
};

export default GroupInfoModal;
