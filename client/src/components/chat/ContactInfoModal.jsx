import { useState, useEffect } from "react";
import {
  BsX,
  BsTelephoneFill,
  BsCameraVideoFill,
  BsSearch,
  BsShieldCheck,
  BsBellFill,
  BsClockHistory,
  BsLockFill,
  BsUnlockFill,
  BsStarFill,
  BsSlashCircle,
  BsShieldExclamation,
  BsPeopleFill,
  BsImage,
  BsPersonFill,
  BsArrowsFullscreen,
  BsPencilFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as userService from "../../services/userService.js";
import * as contactService from "../../services/contactService.js";
import ProfilePhotoViewerModal from "./ProfilePhotoViewerModal.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import Dropdown from "../common/Dropdown.jsx";
import ToggleSwitch from "../common/ToggleSwitch.jsx";

/**
 * ContactInfoModal — WhatsApp-style Contact Details Drawer / Modal.
 * Opens when clicking on contact's DP or Name in the chat header.
 * Displays large photo, phone number, bio, common groups, shared media,
 * and individual chat settings (mute, lock, block, report, disappearing messages).
 */
const ContactInfoModal = ({
  isOpen,
  onClose,
  contact,
  loggedInUser,
  isMuted,
  onToggleMute,
  isLocked,
  onToggleLock,
  isBlocked,
  onToggleBlock,
  onOpenReport,
  onOpenStarred,
  onStartCall,
  onOpenSearch,
  onUpdateContactName,
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState("off");
  const [isEditingCustomName, setIsEditingCustomName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");
  const [savingCustomName, setSavingCustomName] = useState(false);

  useEffect(() => {
    if (contact) {
      setCustomNameInput(contact.customName || contact.displayName || contact.name || "");
    }
  }, [contact]);

  const handleSaveCustomName = async (e) => {
    e.preventDefault();
    const targetId = contact?.id || contact?._id;
    if (!targetId) return;
    try {
      setSavingCustomName(true);
      const trimmed = customNameInput.trim();
      await contactService.updateContactName(targetId, trimmed);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              customName: trimmed,
              displayName: trimmed || prev.name,
            }
          : prev
      );
      contact.customName = trimmed;
      contact.displayName = trimmed || contact.name;
      onUpdateContactName?.(targetId, trimmed);
      setIsEditingCustomName(false);
      toast.success("Contact name updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update contact name");
    } finally {
      setSavingCustomName(false);
    }
  };

  useEffect(() => {
    if (isOpen && contact?.id) {
      loadProfile();
    }
  }, [isOpen, contact?.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile(contact.id);
      setProfile(data);
      if (data.privacySettings?.disappearingMessageTimer) {
        setDisappearingTimer(data.privacySettings.disappearingMessageTimer);
      }
    } catch (_err) {
      // Fallback to contact prop details
      setProfile({
        name: contact.name,
        phone: contact.phone || "Not shared",
        avatar: contact.avatar,
        about: "Hey there! I am using ChatApp.",
        commonGroups: [],
        mediaCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !contact) return null;

  const avatarSrc =
    profile?.avatar ||
    contact.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end sm:bg-black/50 sm:backdrop-blur-xs bg-base-100 animate-fadeIn">
        <div className="bg-base-100 w-full sm:max-w-md h-full shadow-2xl flex flex-col sm:border-l border-base-300 overflow-hidden animate-slide-left">
          {/* Header */}
          <div className="h-16 px-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <BsPersonFill className="text-primary text-lg" />
              Contact Info
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
            {/* Profile Overview Card */}
            <div className="p-6 flex flex-col items-center text-center bg-base-100">
              <div
                className="relative group cursor-pointer"
                onClick={() => setShowPhotoViewer(true)}
                title="Click to view full photo"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-2 border-primary/20 group-hover:border-primary transition-all">
                  <img
                    src={avatarSrc}
                    alt={contact.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <BsArrowsFullscreen className="text-white text-xl" />
                </div>
              </div>

              {isEditingCustomName ? (
                <form
                  onSubmit={handleSaveCustomName}
                  className="mt-3 w-full max-w-xs space-y-2 animate-fadeIn"
                >
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="Enter custom nickname..."
                    className="input input-bordered input-sm w-full rounded-xl text-center font-semibold"
                    autoFocus
                  />
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCustomName(false);
                        setCustomNameInput(
                          contact.customName || contact.displayName || contact.name || ""
                        );
                      }}
                      className="btn btn-xs btn-ghost rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCustomName}
                      className="btn btn-xs btn-primary rounded-lg px-3"
                    >
                      {savingCustomName ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <h2 className="text-xl font-bold text-base-content truncate">
                    {profile?.customName ||
                      contact.customName ||
                      profile?.displayName ||
                      contact.displayName ||
                      profile?.name ||
                      contact.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomNameInput(
                        profile?.customName ||
                          contact.customName ||
                          profile?.displayName ||
                          contact.displayName ||
                          profile?.name ||
                          contact.name ||
                          ""
                      );
                      setIsEditingCustomName(true);
                    }}
                    className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer flex-shrink-0"
                    title="Edit contact name"
                  >
                    <BsPencilFill size={12} />
                  </button>
                </div>
              )}

              {/* Show original registered name if a nickname is set */}
              {(profile?.customName || contact.customName) && (
                <p className="text-[11px] text-base-content/50">
                  Registered name: {profile?.name || contact.name}
                </p>
              )}

              <p className="text-sm font-medium text-base-content/70 mt-0.5">
                {profile?.phone || contact.phone || "No phone number"}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-5 w-full">
                <button
                  onClick={() => onStartCall?.(contact, "voice")}
                  className="flex flex-col items-center gap-1 text-primary hover:text-primary-focus transition-colors"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                    <BsTelephoneFill size={18} />
                  </div>
                  <span className="text-[11px] font-medium">Audio</span>
                </button>

                <button
                  onClick={() => onStartCall?.(contact, "video")}
                  className="flex flex-col items-center gap-1 text-primary hover:text-primary-focus transition-colors"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                    <BsCameraVideoFill size={19} />
                  </div>
                  <span className="text-[11px] font-medium">Video</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSearch?.();
                  }}
                  className="flex flex-col items-center gap-1 text-primary hover:text-primary-focus transition-colors"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                    <BsSearch size={18} />
                  </div>
                  <span className="text-[11px] font-medium">Search</span>
                </button>
              </div>
            </div>

            {/* About / Bio Status */}
            <div className="p-4 bg-base-100 space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                About
              </span>
              <p className="text-sm text-base-content/90 font-medium">
                {profile?.about || "Hey there! I am using ChatApp."}
              </p>
            </div>

            {/* Media & Docs Exchanged */}
            <div className="p-4 bg-base-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-base-200 flex items-center justify-center text-base-content/70">
                  <BsImage size={16} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-base-content block">
                    Media, links and docs
                  </span>
                  <span className="text-xs text-base-content/50">
                    {profile?.mediaCount !== undefined
                      ? `${profile.mediaCount} shared items`
                      : "Shared items"}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Chat Settings */}
            <div className="p-4 bg-base-100 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                Chat Settings
              </span>

              {/* Mute Notifications */}
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

              {/* Disappearing Messages */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <BsClockHistory className="text-base-content/50" size={17} />
                  <div>
                    <span className="text-sm font-medium text-base-content block">
                      Disappearing messages
                    </span>
                    <span className="text-xs text-base-content/50">
                      {disappearingTimer === "off" ? "Off" : disappearingTimer}
                    </span>
                  </div>
                </div>
                <Dropdown
                  value={disappearingTimer}
                  onChange={(val) => {
                    setDisappearingTimer(val);
                    toast.success(`Disappearing messages set to ${val}`);
                  }}
                  options={[
                    { value: "off", label: "Off", description: "Messages do not expire" },
                    { value: "24h", label: "24 hours", description: "Disappear after 1 day" },
                    { value: "7d", label: "7 days", description: "Disappear after 1 week" },
                    { value: "90d", label: "90 days", description: "Disappear after 3 months" },
                  ]}
                  size="sm"
                  align="right"
                  className="min-w-[110px]"
                />
              </div>

              {/* Chat Lock */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  {isLocked ? (
                    <BsLockFill className="text-primary" size={17} />
                  ) : (
                    <BsUnlockFill className="text-base-content/50" size={17} />
                  )}
                  <div>
                    <span className="text-sm font-medium text-base-content block">
                      Lock chat
                    </span>
                    <span className="text-xs text-base-content/50">
                      {isLocked ? "Locked with passcode" : "Unlocked"}
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={Boolean(isLocked)}
                  onChange={() => onToggleLock?.()}
                  size="sm"
                />
              </div>

              {/* Starred Messages */}
              <div
                className="flex items-center justify-between py-1 cursor-pointer hover:bg-base-200/50 rounded-lg p-1 -mx-1"
                onClick={() => {
                  onClose();
                  onOpenStarred?.();
                }}
              >
                <div className="flex items-center gap-3">
                  <BsStarFill className="text-warning" size={17} />
                  <span className="text-sm font-medium text-base-content">
                    Starred messages
                  </span>
                </div>
                <span className="text-xs text-base-content/50">›</span>
              </div>
            </div>

            {/* Encryption Notice */}
            <div className="p-4 bg-base-100 flex items-start gap-3">
              <BsShieldCheck className="text-primary text-xl flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-base-content block">
                  Encryption
                </span>
                <p className="text-xs text-base-content/60 mt-0.5 leading-relaxed">
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even ChatApp, can read or listen to them.
                </p>
              </div>
            </div>

            {/* Groups in Common */}
            <div className="p-4 bg-base-100 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                Groups in Common ({profile?.commonGroups?.length || 0})
              </span>
              {profile?.commonGroups && profile.commonGroups.length > 0 ? (
                <div className="space-y-2">
                  {profile.commonGroups.map((grp) => (
                    <div
                      key={grp._id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-base-200/50"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                        {grp.avatar ? (
                          <img src={grp.avatar} alt={grp.name} className="w-full h-full object-cover" />
                        ) : (
                          <BsPeopleFill className="text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{grp.name}</p>
                        <p className="text-xs text-base-content/50">
                          {grp.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-base-content/50 italic">
                  No groups in common
                </p>
              )}
            </div>

            {/* Danger Zone: Block & Report */}
            <div className="p-4 bg-base-100 space-y-2">
              <RemoveActionButton
                onClick={() => onToggleBlock?.()}
                fullWidth
                variant="row"
                size="md"
                icon={<BsSlashCircle size={17} />}
                label={
                  isBlocked
                    ? `Unblock ${profile?.displayName || profile?.name || contact.name}`
                    : `Block ${profile?.displayName || profile?.name || contact.name}`
                }
              />

              <RemoveActionButton
                onClick={() => onOpenReport?.()}
                fullWidth
                variant="row"
                size="md"
                icon={<BsShieldExclamation size={17} />}
                label={`Report ${profile?.displayName || profile?.name || contact.name}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Photo Viewer */}
      <ProfilePhotoViewerModal
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        avatarUrl={avatarSrc}
        name={profile?.name || contact.name}
        isGroup={false}
      />
    </>
  );
};

export default ContactInfoModal;
