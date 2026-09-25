import { useState, useEffect } from "react";
import {
  BsX,
  BsShieldLockFill,
  BsEyeFill,
  BsCheck2All,
  BsClockHistory,
  BsPersonCircle,
  BsChatDotsFill,
  BsTrash,
  BsExclamationTriangleFill,
  BsBellFill,
  BsPaletteFill,
  BsDownload,
  BsVolumeUpFill,
  BsVolumeMuteFill,
  BsKeyFill,
  BsShieldCheck,
  BsLockFill,
  BsHddNetworkFill,
  BsFileEarmarkArrowDownFill,
  BsPersonXFill,
  BsImageFill,
  BsCameraVideoFill,
  BsMicFill,
  BsFileEarmarkTextFill,
  BsArrowLeft,
  BsChevronRight,
  BsGearFill,
  BsGlobeAmericas,
  BsPeopleFill,
  BsEyeSlashFill,
  BsInfoCircleFill,
  BsCameraFill,
  BsTelephoneFill,
  BsPencilFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as userService from "../../services/userService.js";
import * as messageService from "../../services/messageService.js";
import {
  playMessageChime,
  requestNotificationPermission,
  triggerDesktopNotification,
} from "../../utils/notificationAudio.js";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import Dropdown from "../common/Dropdown.jsx";
import ToggleSwitch from "../common/ToggleSwitch.jsx";
import ImageCropView from "./ImageCropModal.jsx";

const audienceOptions = [
  {
    value: "everyone",
    label: "Everyone",
    icon: <BsGlobeAmericas size={13} />,
    description: "Visible to all users",
  },
  {
    value: "contacts",
    label: "My Contacts",
    icon: <BsPeopleFill size={13} />,
    description: "Saved contacts only",
  },
  {
    value: "nobody",
    label: "Nobody",
    icon: <BsEyeSlashFill size={13} />,
    description: "Hidden from everyone",
  },
];

const timerOptions = [
  { value: "off", label: "Off", description: "Messages do not expire" },
  { value: "24h", label: "24 hours", description: "Disappear after 1 day" },
  { value: "7d", label: "7 days", description: "Disappear after 1 week" },
  { value: "90d", label: "90 days", description: "Disappear after 3 months" },
];

/**
 * PrivacySettingsModal – WhatsApp-style Privacy, Notifications, Themes & Storage Settings (PRD Sections 61-64, 67, 73, 74-76, 81-83, 85).
 */
const PrivacySettingsModal = ({
  isOpen,
  onClose,
  loggedInUser,
  onUserUpdated,
  onAllChatsCleared,
}) => {
  const currentUser =
    loggedInUser ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "null");
      } catch (_e) {
        return null;
      }
    })();

  const defaultPrivacy = loggedInUser?.privacySettings || {
    lastSeen: "everyone",
    readReceipts: true,
    profilePhoto: "everyone",
    about: "everyone",
    disappearingMessageTimer: "off",
  };

  const [selectedCategory, setSelectedCategory] = useState(null); // null = main categories list view
  const [activeTab, setActiveTab] = useState("privacy"); // 'privacy' | 'notifications' | 'theme' | 'chats'
  const [settings, setSettings] = useState(defaultPrivacy);
  const [isSaving, setIsSaving] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Profile Editing State (for Top Name Card)
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileAbout, setProfileAbout] = useState(
    currentUser?.about || "Hey there! I am using ChatApp.",
  );
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState(
    currentUser?.avatar || "",
  );
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(null);
      setProfileName(currentUser?.name || "");
      setProfileAbout(currentUser?.about || "Hey there! I am using ChatApp.");
      setProfileAvatarFile(null);
      setProfileAvatarPreview(currentUser?.avatar || "");
      setCropImageSrc(null);
    }
  }, [isOpen, loggedInUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Profile picture must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      setIsSavingProfile(true);
      const formData = new FormData();
      formData.append("name", profileName.trim());
      formData.append("about", profileAbout.trim());
      if (profileAvatarFile) {
        formData.append("avatar", profileAvatarFile);
      }
      const updated = await userService.updateProfile(formData);
      localStorage.setItem("user", JSON.stringify(updated));
      onUserUpdated?.(updated);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Notification Preferences (PRD Section 74-76)
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("setting_sound_enabled") !== "false",
  );
  const [notifsEnabled, setNotifsEnabled] = useState(
    () => localStorage.getItem("setting_notifications_enabled") !== "false",
  );
  const [reactionsAlerts, setReactionsAlerts] = useState(
    () => localStorage.getItem("setting_reactions_alerts") !== "false",
  );
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );

  // Theme Preferences (PRD Section 85)
  const [appTheme, setAppTheme] = useState(
    () => localStorage.getItem("app_theme") || "emerald",
  );

  // Media Auto-Download (PRD Section 82-83)
  const [autoDownload, setAutoDownload] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("setting_autodownload") ||
          '{"photos":true,"audio":true,"videos":false,"docs":true}',
      );
    } catch {
      return { photos: true, audio: true, videos: false, docs: true };
    }
  });

  // Two-Step Verification & Security (PRD Section 69, 94-96)
  const [twoStepEnabled, setTwoStepEnabled] = useState(
    () => localStorage.getItem("setting_twostep_enabled") === "true",
  );
  const [twoStepPin, setTwoStepPin] = useState(
    () => localStorage.getItem("setting_twostep_pin") || "",
  );
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [tempPin, setTempPin] = useState("");
  const [securityNotifs, setSecurityNotifs] = useState(
    () => localStorage.getItem("setting_security_notifs") === "true",
  );

  // Storage Management & Account Export / Deletion (PRD Section 81, 104, 105)
  const [storageData, setStorageData] = useState(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBlocked();
      if (typeof Notification !== "undefined") {
        setNotifPermission(Notification.permission);
      }
      if (
        activeTab === "storage" ||
        activeTab === "chats" ||
        selectedCategory === "storage" ||
        selectedCategory === "chats"
      ) {
        loadStorageData();
      }
    }
  }, [isOpen, activeTab, selectedCategory]);

  const loadStorageData = async () => {
    try {
      setIsLoadingStorage(true);
      const data = await messageService.getStorageUsage();
      setStorageData(data);
    } catch (_err) {
      console.error("Failed to load storage usage:", _err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handleExportAccountData = async () => {
    try {
      setIsExportingData(true);
      const data = await userService.exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatapp_account_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Account data exported successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to export account data");
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }
    try {
      setIsDeletingAccount(true);
      await userService.deleteAccount();
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Account deleted permanently");
      window.location.href = "/login";
    } catch (err) {
      toast.error(err.message || "Failed to delete account");
      setIsDeletingAccount(false);
    }
  };

  const handleToggleTwoStep = () => {
    if (twoStepEnabled) {
      localStorage.removeItem("setting_twostep_enabled");
      localStorage.removeItem("setting_twostep_pin");
      setTwoStepEnabled(false);
      setTwoStepPin("");
      toast.success("Two-Step Verification disabled");
    } else {
      setShowPinSetup(true);
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (tempPin.length !== 6 || !/^\d+$/.test(tempPin)) {
      toast.error("PIN must be exactly 6 digits");
      return;
    }
    localStorage.setItem("setting_twostep_enabled", "true");
    localStorage.setItem("setting_twostep_pin", tempPin);
    setTwoStepEnabled(true);
    setTwoStepPin(tempPin);
    setShowPinSetup(false);
    setTempPin("");
    toast.success("Two-Step Verification enabled!");
  };

  const handleToggleSecurityNotifs = (enabled) => {
    setSecurityNotifs(enabled);
    localStorage.setItem("setting_security_notifs", enabled ? "true" : "false");
    toast.success(
      enabled
        ? "Security notifications enabled"
        : "Security notifications disabled",
    );
  };

  const loadBlocked = async () => {
    try {
      setLoadingBlocked(true);
      const data = await userService.getBlockedUsers();
      setBlockedUsers(data || []);
    } catch (_e) {
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await userService.toggleBlockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("Contact unblocked");
    } catch (_e) {
      toast.error("Failed to unblock contact");
    }
  };

  const handleThemeChange = (newTheme) => {
    setAppTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const actualTheme = isDark ? "dark" : "mintlify";
      document.documentElement.setAttribute("data-theme", actualTheme);
      window.dispatchEvent(
        new CustomEvent("app_theme_changed", { detail: actualTheme }),
      );
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
      window.dispatchEvent(
        new CustomEvent("app_theme_changed", { detail: newTheme }),
      );
    }
    toast.success(`Theme updated to ${newTheme}`);
  };

  const handleToggleSound = (val) => {
    setSoundEnabled(val);
    localStorage.setItem("setting_sound_enabled", val ? "true" : "false");
    if (val) playMessageChime();
  };

  const handleToggleNotifications = (val) => {
    setNotifsEnabled(val);
    localStorage.setItem(
      "setting_notifications_enabled",
      val ? "true" : "false",
    );
  };

  const handleToggleReactionsAlerts = (val) => {
    setReactionsAlerts(val);
    localStorage.setItem("setting_reactions_alerts", val ? "true" : "false");
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Desktop notifications enabled!");
      triggerDesktopNotification(
        "ChatApp Web",
        "Desktop notifications are now turned on.",
      );
    } else if (perm === "denied") {
      toast.error("Desktop notifications denied in browser");
    }
  };

  const handleAutoDownloadChange = (key, val) => {
    const updated = { ...autoDownload, [key]: val };
    setAutoDownload(updated);
    localStorage.setItem("setting_autodownload", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await userService.updatePrivacySettings(settings);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUserUpdated?.(updatedUser);
      toast.success("Privacy settings updated");
      onClose();
    } catch (_err) {
      toast.error("Failed to update privacy settings");
    } finally {
      setIsSaving(false);
    }
  };

  const settingCategories = [
    {
      id: "account",
      title: "Account",
      subtitle: "Security notifications, request account info, delete account",
      icon: <BsShieldCheck size={20} />,
      color: "text-info bg-info/10",
    },
    {
      id: "privacy",
      title: "Privacy",
      subtitle:
        "Last seen, profile photo, disappearing messages, blocked contacts",
      icon: <BsShieldLockFill size={20} />,
      color: "text-primary bg-primary/10",
    },
    {
      id: "security",
      title: "Security & 2FA",
      subtitle: "Two-step verification, security status",
      icon: <BsKeyFill size={20} />,
      color: "text-warning bg-warning/10",
    },
    {
      id: "chats",
      title: "Chats",
      subtitle: "Clear all chats, export messages, media settings",
      icon: <BsChatDotsFill size={20} />,
      color: "text-secondary bg-secondary/10",
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Message sounds, reaction alerts, desktop notifications",
      icon: <BsBellFill size={20} />,
      color: "text-accent bg-accent/10",
    },
    {
      id: "storage",
      title: "Storage and Data",
      subtitle: "Network usage, manage media files, clear cache",
      icon: <BsHddNetworkFill size={20} />,
      color: "text-success bg-success/10",
    },
    {
      id: "theme",
      title: "Theme & Appearance",
      subtitle: "Mintlify, Dark, Black, Luxury, Corporate, System default",
      icon: <BsPaletteFill size={20} />,
      color: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 p-0 sm:bg-black/60 bg-base-100 sm:backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 sm:rounded-2xl rounded-none w-full max-w-lg shadow-2xl overflow-hidden sm:border border-base-300 flex flex-col h-full sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            {selectedCategory ? (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer mr-0.5"
                title="Back to all settings"
              >
                <BsArrowLeft size={18} />
              </button>
            ) : null}

            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
              {!selectedCategory && <BsGearFill size={17} />}
              {selectedCategory === "profile" && <BsPersonCircle size={16} />}
              {selectedCategory === "privacy" && <BsShieldLockFill size={16} />}
              {selectedCategory === "security" && <BsKeyFill size={16} />}
              {selectedCategory === "notifications" && <BsBellFill size={16} />}
              {selectedCategory === "theme" && <BsPaletteFill size={16} />}
              {selectedCategory === "storage" && <BsHddNetworkFill size={16} />}
              {selectedCategory === "chats" && <BsChatDotsFill size={16} />}
              {selectedCategory === "account" && <BsShieldCheck size={16} />}
            </div>

            <h3 className="font-bold text-lg text-base-content">
              {selectedCategory === "profile"
                ? "Profile"
                : selectedCategory
                  ? settingCategories.find((c) => c.id === selectedCategory)
                      ?.title || "Settings"
                  : "Settings"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title="Close"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Settings Body */}
        {selectedCategory === null ? (
          /* Level 1: All Settings Options List */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* User Profile Card */}
            {currentUser && (
              <div
                onClick={() => {
                  setSelectedCategory("profile");
                  setActiveTab("profile");
                }}
                className="p-3.5 rounded-2xl bg-base-200/50 hover:bg-base-200 border border-base-300 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all flex-shrink-0">
                    <img
                      src={
                        currentUser.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`
                      }
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                      {currentUser.name}
                    </h4>
                    <p className="text-xs text-base-content/60 truncate">
                      {currentUser.about || "Hey there! I am using ChatApp."}
                    </p>
                    {currentUser.phone && (
                      <p className="text-[11px] font-mono text-base-content/50">
                        {currentUser.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    Edit Profile
                  </span>
                  <BsChevronRight
                    size={15}
                    className="text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            )}

            {/* List of Settings Types */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider px-1">
                Categories
              </p>
              {settingCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab(cat.id);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-base-200/80 active:scale-[0.99] transition-all text-left group border border-base-200 hover:border-base-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cat.color}`}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-base-content block group-hover:text-primary transition-colors">
                        {cat.title}
                      </span>
                      <span className="text-xs text-base-content/60 block truncate">
                        {cat.subtitle}
                      </span>
                    </div>
                  </div>
                  <BsChevronRight
                    size={15}
                    className="text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Level 2: Specific Setting Option Detail View */
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === "privacy" && (
              <div className="space-y-6">
                {/* Who can see my personal info */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 px-1">
                    Who can see my personal info
                  </h4>
                  <div className="rounded-2xl bg-base-200/40 border border-base-300 divide-y divide-base-300/60 overflow-visible">
                    {/* Last Seen & Online */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <BsEyeFill size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-base-content block leading-tight">
                            Last seen and online
                          </span>
                          <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                            Who can see when you are active
                          </span>
                        </div>
                      </div>
                      <Dropdown
                        value={settings.lastSeen}
                        onChange={(val) => handleChange("lastSeen", val)}
                        options={audienceOptions}
                        size="sm"
                        align="right"
                        className="min-w-[130px]"
                      />
                    </div>

                    {/* Profile Photo */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <BsPersonCircle size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-base-content block leading-tight">
                            Profile photo
                          </span>
                          <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                            Who can see your profile picture
                          </span>
                        </div>
                      </div>
                      <Dropdown
                        value={settings.profilePhoto}
                        onChange={(val) => handleChange("profilePhoto", val)}
                        options={audienceOptions}
                        size="sm"
                        align="right"
                        className="min-w-[130px]"
                      />
                    </div>

                    {/* About */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <BsInfoCircleFill size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-base-content block leading-tight">
                            About
                          </span>
                          <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                            Who can view your bio & info
                          </span>
                        </div>
                      </div>
                      <Dropdown
                        value={settings.about}
                        onChange={(val) => handleChange("about", val)}
                        options={audienceOptions}
                        size="sm"
                        align="right"
                        className="min-w-[130px]"
                      />
                    </div>

                    {/* Read Receipts */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center flex-shrink-0">
                          <BsCheck2All size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-base-content block leading-tight">
                            Read receipts
                          </span>
                          <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                            If turned off, you won't send or receive read
                            receipts
                          </span>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={settings.readReceipts}
                        onChange={(val) => handleChange("readReceipts", val)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Disappearing Messages */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 px-1">
                    Disappearing Messages
                  </h4>
                  <div className="rounded-2xl bg-base-200/40 border border-base-300 overflow-visible p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <BsClockHistory size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-base-content block leading-tight">
                          Default message timer
                        </span>
                        <p className="text-[11px] text-base-content/55 truncate mt-0.5">
                          Start new chats with disappearing messages
                        </p>
                      </div>
                    </div>
                    <Dropdown
                      value={settings.disappearingMessageTimer}
                      onChange={(val) =>
                        handleChange("disappearingMessageTimer", val)
                      }
                      options={timerOptions}
                      size="sm"
                      align="right"
                      className="min-w-[130px]"
                    />
                  </div>
                </div>

                {/* Blocked Contacts (PRD Section 67) */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                      Blocked contacts
                    </h4>
                    <span className="badge badge-sm badge-neutral font-semibold">
                      {blockedUsers.length}
                    </span>
                  </div>
                  {loadingBlocked ? (
                    <div className="p-4 rounded-2xl bg-base-200/30 border border-base-300 text-center">
                      <span className="loading loading-spinner loading-sm text-primary"></span>
                      <p className="text-xs text-base-content/50 mt-1">
                        Loading blocked contacts...
                      </p>
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-base-200/30 border border-base-300 text-center">
                      <p className="text-xs text-base-content/60 font-medium">
                        No blocked contacts
                      </p>
                      <p className="text-[11px] text-base-content/40 mt-0.5">
                        Blocked contacts cannot send you messages or view your
                        status
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {blockedUsers.map((u) => (
                        <div
                          key={u._id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                u.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`
                              }
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-base-300 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-base-content truncate block">
                                {u.name}
                              </span>
                              {u.phone && (
                                <span className="text-[10px] text-base-content/50 truncate block">
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnblock(u._id)}
                            className="btn btn-xs btn-outline btn-error rounded-lg cursor-pointer"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              /* Notification Settings (PRD Section 74-76) */
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                    Messages & Calls
                  </h4>
                  <div className="space-y-3">
                    {/* Sound Toggle */}
                    <div className="py-2 flex items-center justify-between border-b border-base-200">
                      <div>
                        <div className="flex items-center gap-2">
                          {soundEnabled ? (
                            <BsVolumeUpFill
                              className="text-primary"
                              size={16}
                            />
                          ) : (
                            <BsVolumeMuteFill
                              className="text-base-content/50"
                              size={16}
                            />
                          )}
                          <span className="text-sm font-medium">
                            Message Sounds
                          </span>
                        </div>
                        <p className="text-[11px] text-base-content/50 mt-0.5">
                          Play incoming and outgoing chimes for messages
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={playMessageChime}
                          className="btn btn-ghost btn-xs text-xs text-primary"
                          title="Test sound"
                        >
                          Test
                        </button>
                        <ToggleSwitch
                          checked={soundEnabled}
                          onChange={handleToggleSound}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Reaction Alerts */}
                    <div className="py-2 flex items-center justify-between border-b border-base-200">
                      <div>
                        <span className="text-sm font-medium block">
                          Reaction Notifications
                        </span>
                        <p className="text-[11px] text-base-content/50 mt-0.5">
                          Show notifications for reactions to messages you send
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={reactionsAlerts}
                        onChange={handleToggleReactionsAlerts}
                        size="sm"
                      />
                    </div>

                    {/* Desktop Push Notifications */}
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium block">
                          Desktop Push Notifications
                        </span>
                        <p className="text-[11px] text-base-content/50 mt-0.5">
                          Status:{" "}
                          <span
                            className={`font-semibold ${
                              notifPermission === "granted"
                                ? "text-success"
                                : notifPermission === "denied"
                                  ? "text-error"
                                  : "text-warning"
                            }`}
                          >
                            {notifPermission}
                          </span>
                        </p>
                      </div>
                      {notifPermission !== "granted" ? (
                        <button
                          type="button"
                          onClick={handleRequestPermission}
                          className="btn btn-xs btn-primary rounded-lg"
                        >
                          Enable
                        </button>
                      ) : (
                        <ToggleSwitch
                          checked={notifsEnabled}
                          onChange={handleToggleNotifications}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              /* Theme Settings (PRD Section 85) */
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                    App Appearance
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "mintlify",
                        name: "Mintlify Green",
                        bg: "bg-primary",
                        mode: "Light",
                      },
                      {
                        id: "dark",
                        name: "Dark Slate",
                        bg: "bg-neutral",
                        mode: "Dark",
                      },
                      {
                        id: "black",
                        name: "OLED Midnight",
                        bg: "bg-base-300",
                        mode: "Dark",
                      },
                      {
                        id: "luxury",
                        name: "Luxury Gold",
                        bg: "bg-secondary",
                        mode: "Dark",
                      },
                      {
                        id: "dracula",
                        name: "Dracula Purple",
                        bg: "bg-accent",
                        mode: "Dark",
                      },
                      {
                        id: "ghibli",
                        name: "Ghibli Warm",
                        bg: "bg-primary",
                        mode: "Light",
                      },
                      {
                        id: "corporate",
                        name: "Corporate Clean",
                        bg: "bg-info",
                        mode: "Light",
                      },
                      {
                        id: "light",
                        name: "Clean Light",
                        bg: "bg-base-100",
                        mode: "Light",
                      },
                      {
                        id: "soft",
                        name: "Soft Pastel",
                        bg: "bg-secondary",
                        mode: "Light",
                      },
                      {
                        id: "system",
                        name: "Match System",
                        bg: "bg-gradient-to-r from-base-200 to-base-300",
                        mode: "Auto",
                      },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          appTheme === t.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-base-300 bg-base-200/50 hover:bg-base-200"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full ${t.bg} border border-base-content/20 flex-shrink-0`}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-base-content/50">
                            {t.mode}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "storage" && (
              /* Storage & Data Management (PRD Sections 81-83) */
              <div className="space-y-5 animate-fadeIn">
                {/* Storage Overview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Storage Usage
                    </h4>
                    <button
                      type="button"
                      onClick={loadStorageData}
                      disabled={isLoadingStorage}
                      className="btn btn-ghost btn-xs text-xs text-primary"
                    >
                      {isLoadingStorage ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-base-content">
                          {storageData ? storageData.totalFormatted : "0 B"}
                        </span>
                        <span className="text-xs text-base-content/60 ml-2">
                          used by ChatApp Media
                        </span>
                      </div>
                      <span className="text-xs font-medium text-base-content/60">
                        {storageData?.totalItems || 0} media items
                      </span>
                    </div>

                    {/* Progress bar visual */}
                    <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-success h-full"
                        style={{
                          width: `${
                            storageData?.totalBytes
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((storageData?.breakdown?.photos?.bytes ||
                                      0) /
                                      storageData.totalBytes) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                        title="Photos"
                      />
                      <div
                        className="bg-info h-full"
                        style={{
                          width: `${
                            storageData?.totalBytes
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((storageData?.breakdown?.videos?.bytes ||
                                      0) /
                                      storageData.totalBytes) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                        title="Videos"
                      />
                      <div
                        className="bg-secondary h-full"
                        style={{
                          width: `${
                            storageData?.totalBytes
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((storageData?.breakdown?.audio?.bytes ||
                                      0) /
                                      storageData.totalBytes) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                        title="Audio"
                      />
                      <div
                        className="bg-warning h-full"
                        style={{
                          width: `${
                            storageData?.totalBytes
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((storageData?.breakdown?.documents
                                      ?.bytes || 0) /
                                      storageData.totalBytes) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                        title="Documents"
                      />
                    </div>

                    {/* Breakdown chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block truncate">
                            Photos
                          </span>
                          <span className="text-[10px] text-base-content/60">
                            {storageData?.breakdown?.photos?.formatted || "0 B"}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block truncate">
                            Videos
                          </span>
                          <span className="text-[10px] text-base-content/60">
                            {storageData?.breakdown?.videos?.formatted || "0 B"}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block truncate">
                            Audio
                          </span>
                          <span className="text-[10px] text-base-content/60">
                            {storageData?.breakdown?.audio?.formatted || "0 B"}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block truncate">
                            Documents
                          </span>
                          <span className="text-[10px] text-base-content/60">
                            {storageData?.breakdown?.documents?.formatted ||
                              "0 B"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Large Files Review (> 100 KB) */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Review & Clean Up Items
                  </h4>
                  <div className="p-3 rounded-2xl bg-base-200/50 border border-base-300">
                    {isLoadingStorage ? (
                      <div className="py-6 flex items-center justify-center text-xs text-base-content/60">
                        <span className="loading loading-spinner loading-xs mr-2" />
                        Calculating storage breakdown...
                      </div>
                    ) : !storageData?.largeFiles ||
                      storageData.largeFiles.length === 0 ? (
                      <p className="text-xs text-base-content/60 py-2 text-center">
                        No large media files currently stored.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto divide-y divide-base-300">
                        {storageData.largeFiles.map((file, idx) => (
                          <div
                            key={file.id || idx}
                            className="py-2 flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center flex-shrink-0 text-base-content/70">
                                {file.type === "image" && (
                                  <BsImageFill size={14} />
                                )}
                                {file.type === "video" && (
                                  <BsCameraVideoFill size={14} />
                                )}
                                {file.type === "audio" && (
                                  <BsMicFill size={14} />
                                )}
                                {file.type === "document" && (
                                  <BsFileEarmarkTextFill size={14} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold block truncate text-base-content">
                                  {file.fileName}
                                </span>
                                <span className="text-[10px] text-base-content/50">
                                  {file.createdAt
                                    ? new Date(
                                        file.createdAt,
                                      ).toLocaleDateString()
                                    : ""}{" "}
                                  • {file.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono text-[11px] font-semibold text-primary">
                                {file.sizeFormatted}
                              </span>
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 transition-colors cursor-pointer"
                                  title="Open file"
                                >
                                  <BsDownload size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Auto-Download Preferences */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Media Auto-Download
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300 divide-y divide-base-300/60">
                    {[
                      { key: "photos", label: "Photos" },
                      { key: "audio", label: "Audio & Voice Notes" },
                      { key: "videos", label: "Videos" },
                      { key: "docs", label: "Documents & Files" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1 text-xs"
                      >
                        <span className="text-sm font-medium text-base-content/90">
                          {item.label}
                        </span>
                        <ToggleSwitch
                          checked={Boolean(autoDownload[item.key])}
                          onChange={(val) =>
                            handleAutoDownloadChange(item.key, val)
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chats" && (
              /* Chats & Storage Management (PRD Section 73, 81-83) */
              <div className="space-y-5 animate-fadeIn">
                {/* Chat History & Data */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                    Chat History & Cleanup
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold block text-base-content">
                          Clear all messages
                        </span>
                        <span className="text-xs text-base-content/60 block mt-0.5">
                          Deletes all messages from all your personal and group
                          chats.
                        </span>
                      </div>
                      <RemoveActionButton
                        onClick={() => setShowClearConfirm(true)}
                        size="xs"
                        label="Clear all"
                        className="flex-shrink-0 ml-3"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300">
                      <span className="text-sm font-semibold block text-base-content">
                        Chat Exports
                      </span>
                      <span className="text-xs text-base-content/60 block mt-0.5">
                        To export individual chat history in standard
                        Guftguformat (.txt), open any chat, click the 3-dot menu
                        and select{" "}
                        <strong className="text-primary">"Export Chat"</strong>.
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300">
                      <span className="text-sm font-semibold block text-base-content">
                        Ephemeral Media Policy
                      </span>
                      <span className="text-xs text-base-content/60 block mt-0.5">
                        View-Once media burns immediately upon opening. Status
                        updates strictly expire after 24 hours. Video Status is
                        excluded per PRD.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              /* Profile Details & Editing (PRD Profile Section) */
              <div className="space-y-6 animate-fadeIn">
                {/* Avatar Section */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative group cursor-pointer w-28 h-28 rounded-full border-4 border-base-200 overflow-hidden shadow-lg transition-all">
                    <img
                      src={
                        profileAvatarPreview ||
                        currentUser?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileName || "User"}`
                      }
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <BsCameraFill className="text-white text-2xl drop-shadow" />
                      <span className="text-[11px] text-white font-medium mt-1">Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-base-content/50 mt-2">
                    Click photo to change avatar
                  </p>
                </div>

                {/* Name & About Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Your Name */}
                  <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-2">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wider block">
                      Your Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter your name"
                        className="input input-bordered input-sm w-full rounded-xl bg-base-100 pr-8"
                        maxLength={50}
                      />
                      <BsPencilFill
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                      />
                    </div>
                    <p className="text-[11px] text-base-content/50 leading-relaxed">
                      This is not your username or PIN. This name will be visible to your Guftgu contacts.
                    </p>
                  </div>

                  {/* About */}
                  <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-2.5">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wider block">
                      About
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileAbout}
                        onChange={(e) => setProfileAbout(e.target.value)}
                        placeholder="Hey there! I am using Guftgu."
                        className="input input-bordered input-sm w-full rounded-xl bg-base-100 pr-8"
                        maxLength={120}
                      />
                      <BsPencilFill
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                      />
                    </div>

                    {/* Presets */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-base-content/50 font-medium uppercase tracking-wider block">
                        Quick Status Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Available",
                          "Busy",
                          "At work",
                          "In a meeting",
                          "Can't talk, Guftgu only",
                          "Battery about to die",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProfileAbout(preset)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              profileAbout === preset
                                ? "bg-primary text-primary-content border-primary font-medium"
                                : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <BsTelephoneFill size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                          Phone Number
                        </span>
                        <span className="text-sm font-semibold text-base-content font-mono block mt-0.5">
                          {currentUser?.phone || "No phone linked"}
                        </span>
                        <p className="text-[10px] text-base-content/50 mt-0.5">
                          Linked WhatsApp Identifier (cannot be changed)
                        </p>
                      </div>
                    </div>
                    <BsLockFill size={15} className="text-base-content/40 flex-shrink-0" />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile || !profileName.trim()}
                      className="btn btn-sm btn-primary rounded-xl px-5"
                    >
                      {isSavingProfile ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Save Profile Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "account" && (
              /* Account Settings, Export Data & Danger Zone (PRD Section 104 & 105) */
              <div className="space-y-6 animate-fadeIn">
                {/* Security Notifications */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Security Notifications
                  </h4>
                  <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-info/10 text-info flex-shrink-0">
                        <BsShieldCheck size={18} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold block text-base-content">
                          Show security notifications on this device
                        </span>
                        <span className="text-xs text-base-content/60 block mt-0.5">
                          Get notified when your security code changes for a contact's phone
                        </span>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={securityNotifs}
                      onChange={handleToggleSecurityNotifs}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Request Account Info / Export Data */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Account Information & Data
                  </h4>
                  <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                        <BsFileEarmarkArrowDownFill size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block text-base-content">
                          Request Account Info (PRD Section 105)
                        </span>
                        <span className="text-xs text-base-content/60 block mt-1 leading-relaxed">
                          Create a downloadable report of your ChatApp account
                          information and settings. This export includes your
                          profile details, contacts list, group memberships, and
                          configuration data in JSON format.
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleExportAccountData}
                        disabled={isExportingData}
                        className="btn btn-sm btn-primary rounded-xl px-4 flex items-center gap-2"
                      >
                        {isExportingData ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <BsDownload size={14} />
                        )}
                        Download Account Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Account (PRD Section 104) */}
                <div>
                  <h4 className="text-xs font-semibold text-error uppercase tracking-wider mb-2">
                    Danger Zone
                  </h4>
                  <div className="p-4 rounded-2xl bg-error/10 border border-error/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-error/20 text-error mt-0.5">
                        <BsPersonXFill size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block text-base-content">
                          Delete My Account (PRD Section 104)
                        </span>
                        <span className="text-xs text-base-content/70 block mt-1 leading-relaxed">
                          Deleting your account is permanent and cannot be
                          undone:
                        </span>
                        <ul className="text-xs text-base-content/60 mt-1.5 list-disc list-inside space-y-0.5">
                          <li>Deletes your account from ChatApp entirely</li>
                          <li>
                            Wipes your message history across all personal chats
                          </li>
                          <li>Removes you from all your ChatApp groups</li>
                          <li>
                            Deletes your cloud backups and saved preferences
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <RemoveActionButton
                        onClick={() => {
                          setDeleteConfirmText("");
                          setShowDeleteAccountModal(true);
                        }}
                        size="sm"
                        label="Delete Account"
                        className="px-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY & TWO-STEP VERIFICATION (PRD Sections 69, 94-96) ── */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-fadeIn">
                {/* End-to-End Encryption Banner */}
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BsShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-base-content">
                      End-to-End Encrypted
                    </h4>
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                      Your personal messages and calls are secured with
                      end-to-end encryption. Only you and the person you're
                      communicating with can read or listen to them, not even
                      ChatApp.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-base-content/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Text & voice notes
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Audio & video calls
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Photos, video & docs
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Location & status
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two-Step Verification Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Two-Step Verification
                  </h4>

                  <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-base-300 text-base-content/80 mt-0.5">
                          <BsKeyFill size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-base-content">
                              6-Digit Security PIN
                            </span>
                            <span
                              className={`badge badge-xs font-medium ${
                                twoStepEnabled
                                  ? "badge-success text-white"
                                  : "badge-ghost"
                              }`}
                            >
                              {twoStepEnabled ? "Enabled" : "Off"}
                            </span>
                          </div>
                          <p className="text-xs text-base-content/60 mt-1">
                            For extra security, require a 6-digit PIN when
                            registering your phone number with ChatApp again.
                          </p>
                        </div>
                      </div>

                      {!showPinSetup && (
                        <button
                          type="button"
                          onClick={handleToggleTwoStep}
                          className={`btn btn-xs rounded-xl flex-shrink-0 ${
                            twoStepEnabled
                              ? "btn-outline btn-error"
                              : "btn-primary"
                          }`}
                        >
                          {twoStepEnabled ? "Turn off" : "Turn on"}
                        </button>
                      )}
                    </div>

                    {/* PIN Setup Form */}
                    {showPinSetup && (
                      <form
                        onSubmit={handleSavePin}
                        className="border-t border-base-300 pt-4 space-y-3"
                      >
                        <label className="block text-xs font-medium text-base-content/80">
                          Create a 6-digit PIN that you can remember:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            maxLength={6}
                            placeholder="••••••"
                            value={tempPin}
                            onChange={(e) =>
                              setTempPin(e.target.value.replace(/\D/g, ""))
                            }
                            className="input input-bordered input-sm rounded-xl font-mono tracking-widest text-center text-base font-bold flex-1"
                            autoFocus
                            required
                          />
                          <button
                            type="submit"
                            disabled={tempPin.length !== 6}
                            className="btn btn-sm btn-primary rounded-xl px-4"
                          >
                            Save PIN
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPinSetup(false);
                              setTempPin("");
                            }}
                            className="btn btn-sm btn-ghost rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-[11px] text-base-content/50">
                          Enter digits only (0-9).
                        </p>
                      </form>
                    )}
                  </div>
                </div>

                {/* Security Notifications Toggle */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Security Notifications
                  </h4>

                  <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-sm font-semibold text-base-content block">
                          Show security notifications
                        </span>
                        <span className="text-xs text-base-content/60 block mt-0.5">
                          Get notified when your security code changes for a
                          contact's phone.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm flex-shrink-0"
                        checked={securityNotifs}
                        onChange={(e) =>
                          handleToggleSecurityNotifs(e.target.checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal for Clearing All Chats */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl p-5 border border-error/30 shadow-2xl max-w-sm w-full space-y-4 text-center animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
                <BsExclamationTriangleFill size={22} />
              </div>
              <div>
                <h4 className="font-bold text-base">Clear all chats?</h4>
                <p className="text-xs text-base-content/60 mt-1">
                  This action will clear messages across all your conversations.
                  You will not be able to undo this operation.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearingAll}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
                <RemoveActionButton
                  onClick={async () => {
                    try {
                      setIsClearingAll(true);
                      await messageService.clearAllChats();
                      toast.success("All chats cleared");
                      setShowClearConfirm(false);
                      onAllChatsCleared?.();
                    } catch (e) {
                      toast.error(e.message || "Failed to clear chats");
                    } finally {
                      setIsClearingAll(false);
                    }
                  }}
                  disabled={isClearingAll}
                  loading={isClearingAll}
                  size="sm"
                  label="Yes, Clear All"
                  className="px-4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Deleting Account Permanently (PRD Section 104) */}
        {showDeleteAccountModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl p-5 border border-error/40 shadow-2xl max-w-sm w-full space-y-4 animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
                <BsExclamationTriangleFill size={22} />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-base text-base-content">
                  Delete Account Permanently?
                </h4>
                <p className="text-xs text-base-content/60 mt-1">
                  This action cannot be undone. All your messages, contacts, and
                  personal data will be erased immediately.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-content/70 block mb-1">
                  Type{" "}
                  <span className="text-error font-mono font-bold">DELETE</span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="input input-bordered input-sm w-full rounded-xl text-center font-mono font-bold uppercase tracking-wider"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeletingAccount}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
                <RemoveActionButton
                  onClick={handleDeleteAccount}
                  disabled={
                    isDeletingAccount ||
                    deleteConfirmText.trim().toUpperCase() !== "DELETE"
                  }
                  loading={isDeletingAccount}
                  size="sm"
                  label="Permanently Delete"
                  className="px-4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-base-300 flex justify-end items-center gap-2 bg-base-200/30">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            {selectedCategory === "privacy" ? "Cancel" : "Close"}
          </button>
          {selectedCategory === "privacy" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-sm btn-primary rounded-xl px-5"
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Save Changes"
              )}
            </button>
          )}
        </div>

        {/* Profile Picture Cropper Modal Overlay */}
        {cropImageSrc && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-base-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-base-300 animate-modal-pop">
              <ImageCropView
                imageSrc={cropImageSrc}
                onCropComplete={(croppedFile) => {
                  setProfileAvatarFile(croppedFile);
                  setProfileAvatarPreview(URL.createObjectURL(croppedFile));
                  setCropImageSrc(null);
                }}
                onCancel={() => setCropImageSrc(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettingsModal;
