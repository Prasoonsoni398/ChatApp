import { useState, useEffect } from "react";

export const useChatModalsState = (loggedInUser) => {
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeModalConfig, setPasscodeModalConfig] = useState({
    mode: "verify",
    targetChatId: null,
  });

  const [lockedChatIds, setLockedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_lock_ids") || "[]");
    } catch {
      return [];
    }
  });
  const [isLockedSectionUnlocked, setIsLockedSectionUnlocked] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isArchivedViewOpen, setIsArchivedViewOpen] = useState(false);

  const [archivedChatIds, setArchivedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_archived_ids") || "[]");
    } catch {
      return [];
    }
  });

  const [mutedChatIds, setMutedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_muted_ids") || "[]");
    } catch {
      return [];
    }
  });

  const [showGroupInviteModal, setShowGroupInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLinkedDevicesModal, setShowLinkedDevicesModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [activeViewOnceMsg, setActiveViewOnceMsg] = useState(null);

  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    return (loggedInUser?.blockedUsers || []).map((u) => u._id || u);
  });

  useEffect(() => {
    if (loggedInUser?.blockedUsers) {
      setBlockedUserIds(loggedInUser.blockedUsers.map((u) => u._id || u));
    }
  }, [loggedInUser]);

  useEffect(() => {
    try {
      localStorage.setItem("chat_archived_ids", JSON.stringify(archivedChatIds));
    } catch (_e) {}
  }, [archivedChatIds]);

  useEffect(() => {
    try {
      localStorage.setItem("chat_muted_ids", JSON.stringify(mutedChatIds));
    } catch (_e) {}
  }, [mutedChatIds]);

  return {
    showStarredModal,
    setShowStarredModal,
    showCreatePollModal,
    setShowCreatePollModal,
    showPrivacyModal,
    setShowPrivacyModal,
    showPasscodeModal,
    setShowPasscodeModal,
    passcodeModalConfig,
    setPasscodeModalConfig,
    lockedChatIds,
    setLockedChatIds,
    isLockedSectionUnlocked,
    setIsLockedSectionUnlocked,
    showLocationModal,
    setShowLocationModal,
    showContactModal,
    setShowContactModal,
    isArchivedViewOpen,
    setIsArchivedViewOpen,
    archivedChatIds,
    setArchivedChatIds,
    mutedChatIds,
    setMutedChatIds,
    showGroupInviteModal,
    setShowGroupInviteModal,
    showReportModal,
    setShowReportModal,
    showLinkedDevicesModal,
    setShowLinkedDevicesModal,
    showCreateEventModal,
    setShowCreateEventModal,
    showShortcutsModal,
    setShowShortcutsModal,
    showAddContactModal,
    setShowAddContactModal,
    showContactInfoModal,
    setShowContactInfoModal,
    showGroupInfoModal,
    setShowGroupInfoModal,
    activeViewOnceMsg,
    setActiveViewOnceMsg,
    blockedUserIds,
    setBlockedUserIds,
  };
};
