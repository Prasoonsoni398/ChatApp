import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as userService from "../services/userService.js";
import * as messageService from "../services/messageService.js";
import {
  playMessageChime,
  requestNotificationPermission,
  triggerDesktopNotification,
} from "../utils/notificationAudio.js";

export const usePrivacySettings = ({
  isOpen,
  loggedInUser,
  onUserUpdated,
  onAllChatsCleared,
  onClose,
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

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("privacy");
  const [settings, setSettings] = useState(defaultPrivacy);
  const [isSaving, setIsSaving] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Profile Editing State
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

  // Notification Preferences
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

  // Theme Preferences
  const [appTheme, setAppTheme] = useState(
    () => localStorage.getItem("app_theme") || "emerald",
  );

  // Media Auto-Download
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

  // Two-Step Verification & Security
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

  // Storage Management & Account Export / Deletion
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

  const handleClearAllChats = async () => {
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
  };

  return {
    currentUser,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    settings,
    isSaving,
    blockedUsers,
    loadingBlocked,
    isClearingAll,
    showClearConfirm,
    setShowClearConfirm,
    profileName,
    setProfileName,
    profileAbout,
    setProfileAbout,
    profileAvatarPreview,
    setProfileAvatarFile,
    setProfileAvatarPreview,
    cropImageSrc,
    setCropImageSrc,
    isSavingProfile,
    handleAvatarChange,
    handleSaveProfile,
    soundEnabled,
    handleToggleSound,
    reactionsAlerts,
    handleToggleReactionsAlerts,
    notifPermission,
    handleRequestPermission,
    notifsEnabled,
    handleToggleNotifications,
    appTheme,
    handleThemeChange,
    autoDownload,
    handleAutoDownloadChange,
    twoStepEnabled,
    twoStepPin,
    showPinSetup,
    setShowPinSetup,
    tempPin,
    setTempPin,
    handleToggleTwoStep,
    handleSavePin,
    securityNotifs,
    handleToggleSecurityNotifs,
    storageData,
    isLoadingStorage,
    loadStorageData,
    isExportingData,
    handleExportAccountData,
    showDeleteAccountModal,
    setShowDeleteAccountModal,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingAccount,
    handleDeleteAccount,
    handleUnblock,
    handleChange,
    handleSave,
    handleClearAllChats,
  };
};
