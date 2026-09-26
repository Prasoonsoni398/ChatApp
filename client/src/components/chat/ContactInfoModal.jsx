import { useState, useEffect } from "react";
import {
  BsX,
  BsTelephoneFill,
  BsCameraVideoFill,
  BsSearch,
  BsShieldCheck,
  BsSlashCircle,
  BsShieldExclamation,
  BsImage,
  BsArrowsFullscreen,
  BsPencilFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as userService from "../../services/userService.js";
import * as contactService from "../../services/contactService.js";
import ProfilePhotoViewerModal from "./ProfilePhotoViewerModal.jsx";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import ContactChatSettings from "./contact/ContactChatSettings.jsx";
import CommonGroupsList from "./contact/CommonGroupsList.jsx";

/**
 * ContactInfoModal — WhatsApp-style Contact Details Drawer / Modal.
 * Opens when clicking on contact's DP or Name in the chat header.
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
      setCustomNameInput(
        contact.customName || contact.displayName || contact.name || "",
      );
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
          : prev,
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
    } catch (_err) {
      setProfile(contact);
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
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-base-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50 flex-shrink-0">
            <h3 className="font-bold text-lg text-base-content">
              Contact Info
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
            {/* Contact Banner / Avatar & Name */}
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
                      alt={contact.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <BsArrowsFullscreen size={20} />
                </div>
              </div>

              {isEditingCustomName ? (
                <form
                  onSubmit={handleSaveCustomName}
                  className="flex items-center gap-2 mt-1"
                >
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="Enter custom name"
                    className="input input-bordered input-sm rounded-lg"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingCustomName}
                    className="btn btn-sm btn-primary rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomName(false)}
                    className="btn btn-sm btn-ghost rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 mt-1">
                  <h2 className="text-xl font-bold text-base-content">
                    {profile?.displayName ||
                      profile?.customName ||
                      profile?.name ||
                      contact.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingCustomName(true)}
                    className="text-base-content/40 hover:text-primary transition-colors p-1"
                    title="Edit contact name"
                  >
                    <BsPencilFill size={13} />
                  </button>
                </div>
              )}

              {Boolean(
                profile?.displayName && profile?.displayName !== profile?.name,
              ) && (
                <p className="text-xs text-base-content/50">
                  Original: {profile?.name || contact.name}
                </p>
              )}

              <p className="text-sm text-base-content/60 mt-0.5">
                {profile?.phone ||
                  contact.phone ||
                  profile?.email ||
                  contact.email}
              </p>

              {/* Quick Actions: Audio Call, Video Call, Search */}
              <div className="flex items-center gap-6 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall?.(contact, "voice");
                  }}
                  className="flex flex-col items-center gap-1 text-primary hover:opacity-80 transition-opacity"
                  title="Audio call"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsTelephoneFill size={16} />
                  </div>
                  <span className="text-xs font-medium">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall?.(contact, "video");
                  }}
                  className="flex flex-col items-center gap-1 text-primary hover:opacity-80 transition-opacity"
                  title="Video call"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsCameraVideoFill size={17} />
                  </div>
                  <span className="text-xs font-medium">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSearch?.();
                  }}
                  className="flex flex-col items-center gap-1 text-primary hover:opacity-80 transition-opacity"
                  title="Search messages"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsSearch size={16} />
                  </div>
                  <span className="text-xs font-medium">Search</span>
                </button>
              </div>
            </div>

            {/* About / Bio Section */}
            <div className="p-4 bg-base-100">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                About
              </span>
              <p className="text-sm text-base-content leading-relaxed">
                {profile?.about ||
                  contact.about ||
                  "Hey there! I am using ChatApp."}
              </p>
            </div>

            {/* Media, Links & Docs shortcut */}
            <div className="p-4 bg-base-100">
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
            <ContactChatSettings
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              disappearingTimer={disappearingTimer}
              setDisappearingTimer={setDisappearingTimer}
              isLocked={isLocked}
              onToggleLock={onToggleLock}
              onOpenStarred={onOpenStarred}
              onClose={onClose}
            />

            {/* Encryption Notice */}
            <div className="p-4 bg-base-100 flex items-start gap-3">
              <BsShieldCheck className="text-primary text-xl flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-base-content block">
                  Encryption
                </span>
                <p className="text-xs text-base-content/60 mt-0.5 leading-relaxed">
                  Messages and calls are end-to-end encrypted. No one outside of
                  this chat, not even ChatApp, can read or listen to them.
                </p>
              </div>
            </div>

            {/* Groups in Common */}
            <CommonGroupsList groups={profile?.commonGroups || []} />

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
