import toast from "react-hot-toast";
import * as groupService from "../services/groupService.js";
import * as userService from "../services/userService.js";

export const useChatSecurityAndSettings = ({ state, modals }) => {
  const handleToggleLockChat = (customId) => {
    const chatId = customId || state.selectedChat?.id;
    if (!chatId) return;
    const isLocked = modals.lockedChatIds.includes(chatId);

    if (isLocked) {
      const updated = modals.lockedChatIds.filter((id) => id !== chatId);
      modals.setLockedChatIds(updated);
      localStorage.setItem("chat_lock_ids", JSON.stringify(updated));
      toast.success("Chat unlocked from locked list");
    } else {
      const existingPin = localStorage.getItem("chat_lock_pin");
      if (!existingPin) {
        modals.setPasscodeModalConfig({ mode: "setup", targetChatId: chatId });
        modals.setShowPasscodeModal(true);
      } else {
        const updated = [...modals.lockedChatIds, chatId];
        modals.setLockedChatIds(updated);
        localStorage.setItem("chat_lock_ids", JSON.stringify(updated));
        toast.success("Chat locked! Moved to Locked chats");
      }
    }
  };

  const handleOpenLockedChats = () => {
    if (modals.isLockedSectionUnlocked) {
      modals.setIsLockedSectionUnlocked(false);
    } else {
      modals.setPasscodeModalConfig({ mode: "verify", targetChatId: null });
      modals.setShowPasscodeModal(true);
    }
  };

  const handlePasscodeSuccess = () => {
    if (
      modals.passcodeModalConfig.mode === "setup" &&
      modals.passcodeModalConfig.targetChatId
    ) {
      const updated = [
        ...modals.lockedChatIds,
        modals.passcodeModalConfig.targetChatId,
      ];
      modals.setLockedChatIds(updated);
      localStorage.setItem("chat_lock_ids", JSON.stringify(updated));
      toast.success("Chat locked! Moved to Locked chats");
    } else {
      modals.setIsLockedSectionUnlocked(true);
    }
  };

  const handleToggleArchiveChat = () => {
    if (!state.selectedChat) return;
    const cid = state.selectedChat.id;
    const isCurrentlyArchived = modals.archivedChatIds.includes(cid);
    const willBeArchived = !isCurrentlyArchived;

    modals.setArchivedChatIds((prev) => {
      const exists = prev.includes(cid);
      if (willBeArchived) {
        return exists ? prev : [...prev, cid];
      } else {
        return prev.filter((id) => id !== cid);
      }
    });

    toast.dismiss("archive-toggle");
    if (willBeArchived) {
      toast.success("Chat archived", { id: "archive-toggle" });
    } else {
      toast.success("Chat unarchived", { id: "archive-toggle" });
    }
  };

  const handleToggleMuteChat = (customId) => {
    const cid = customId || state.selectedChat?.id;
    if (!cid) return;
    const isCurrentlyMuted = modals.mutedChatIds.includes(cid);
    const willBeMuted = !isCurrentlyMuted;

    modals.setMutedChatIds((prev) => {
      const exists = prev.includes(cid);
      if (willBeMuted) {
        return exists ? prev : [...prev, cid];
      } else {
        return prev.filter((id) => id !== cid);
      }
    });

    toast.dismiss("mute-toggle");
    if (willBeMuted) {
      toast.success("Notifications muted", { id: "mute-toggle" });
    } else {
      toast.success("Notifications unmuted", { id: "mute-toggle" });
    }
  };

  const handleLeaveGroup = async (groupId) => {
    const gid = groupId || state.selectedChat?.id;
    if (!gid) return;
    try {
      await groupService.leaveGroup(gid);
      toast.success("Left group successfully");
      modals.setShowGroupInfoModal(false);
      state.setSelectedChat(null);
      state.setChats((prev) => prev.filter((c) => c.id !== gid));
    } catch (err) {
      toast.error(err.message || "Failed to leave group");
    }
  };

  const handleToggleBlockContact = async (customId) => {
    const cid = customId || state.selectedChat?.id;
    if (!cid || state.selectedChat?.isGroup) return;
    try {
      const res = await userService.toggleBlockUser(cid);
      const isBlocked = res.isBlocked;
      modals.setBlockedUserIds((prev) =>
        isBlocked ? [...prev, cid] : prev.filter((id) => id !== cid),
      );
      toast.success(isBlocked ? "Contact blocked" : "Contact unblocked");
    } catch (_e) {
      toast.error("Failed to update contact block status");
    }
  };

  return {
    handleToggleLockChat,
    handleOpenLockedChats,
    handlePasscodeSuccess,
    handleToggleArchiveChat,
    handleToggleMuteChat,
    handleLeaveGroup,
    handleToggleBlockContact,
  };
};
