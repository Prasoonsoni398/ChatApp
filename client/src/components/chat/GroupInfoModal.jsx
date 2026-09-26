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
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as groupService from "../../services/groupService.js";
import ProfilePhotoViewerModal from "./ProfilePhotoViewerModal.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import ToggleSwitch from "../common/ToggleSwitch.jsx";
import AddGroupMembersModal from "./group/AddGroupMembersModal.jsx";
import GroupParticipantItem from "./group/GroupParticipantItem.jsx";

/**
 * GroupInfoModal — WhatsApp-style Group Details Drawer / Modal.
 * Opens when clicking on Group DP or Group Name in the chat header.
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

  const members = details?.members || group.members || [];
  const memberDetails = details?.memberDetails || [];

  const filteredMembers = members.filter((m) => {
    const name = m.name || "";
    const phone = m.phone || "";
    const q = memberSearch.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q);
  });

  const availableContactsToAdd = (allContacts || []).filter(
    (c) => !members.some((m) => (m._id || m).toString() === c._id.toString()),
  );

  const handleAddMembersSubmit = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setIsAdding(true);
      await groupService.addMembersToGroup(group.id, selectedToAdd);
      toast.success("Members added successfully!");
      setShowAddMemberModal(false);
      setSelectedToAdd([]);
      loadGroupDetails();
    } catch (_err) {
      toast.error("Failed to add members");
    } finally {
      setIsAdding(false);
    }
  };

  const getWhoAddedInfo = (member) => {
    const memberId = (member._id || member).toString();
    const detail = memberDetails.find(
      (md) => (md.userId?._id || md.userId)?.toString() === memberId,
    );
    if (!detail) {
      if (adminId?.toString() === memberId) {
        return "Group Creator";
      }
      return "Added by Admin";
    }

    const addedByObj = detail.addedBy;
    if (!addedByObj) {
      return "Joined via invite link";
    }

    const addedById = (addedByObj._id || addedByObj).toString();
    if (addedById === currentUserId?.toString()) {
      return "Added by you";
    }
    const adderName = addedByObj.name || "Admin";
    return `Added by ${adderName}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-base-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50 flex-shrink-0">
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <BsPeopleFill className="text-primary" /> Group Info
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
              title="Close"
            >
              <BsX size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-base-200">
            {/* Group Banner / Avatar & Name */}
            <div className="p-6 flex flex-col items-center text-center bg-base-100">
              <div
                className="relative group cursor-pointer mb-3"
                onClick={() => setShowPhotoViewer(true)}
                title="Click to view full photo"
              >
                <div className="avatar">
                  <div className="w-24 h-24 rounded-full ring ring-primary/20 ring-offset-base-100 ring-offset-2 overflow-hidden shadow-lg">
                    <img
                      src={avatarSrc}
                      alt={details?.name || group.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <BsArrowsFullscreen size={20} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-base-content">
                {details?.name || group.name}
              </h2>
              <p className="text-xs text-base-content/60 mt-1">
                Group • {members.length} participants
              </p>

              {details?.description && (
                <div className="mt-3 p-3 bg-base-200/60 rounded-xl text-xs text-base-content/80 text-left w-full border border-base-300/50">
                  <span className="font-semibold text-primary block mb-0.5">
                    Description:
                  </span>
                  {details.description}
                </div>
              )}

              {details?.createdAt && (
                <p className="text-[11px] text-base-content/40 mt-2">
                  Created{" "}
                  {new Date(details.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {details.creator?.name ? ` by ${details.creator.name}` : ""}
                </p>
              )}
            </div>

            {/* Quick Settings: Mute & Invite Link */}
            <div className="p-4 bg-base-100 space-y-3">
              {/* Mute toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-base-content/70">
                    <BsBellFill size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-base-content block">
                      Mute notifications
                    </span>
                    <span className="text-xs text-base-content/50">
                      Silence alerts from this group
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
                    <GroupParticipantItem
                      key={mId}
                      member={member}
                      isMemberAdmin={isMemberAdmin}
                      isSelf={isSelf}
                      whoAddedText={whoAddedText}
                    />
                  );
                })}
              </div>
            </div>

            {/* Danger Actions: Leave Group, Report Group */}
            <div className="p-4 bg-base-100 space-y-2">
              <RemoveActionButton
                onClick={() => {
                  onClose();
                  onLeaveGroup?.();
                }}
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
      <AddGroupMembersModal
        show={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        availableContacts={availableContactsToAdd}
        selectedToAdd={selectedToAdd}
        setSelectedToAdd={setSelectedToAdd}
        isAdding={isAdding}
        onSubmit={handleAddMembersSubmit}
      />

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
