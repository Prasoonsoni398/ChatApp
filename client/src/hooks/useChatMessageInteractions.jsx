import React from "react";
import toast from "react-hot-toast";
import * as messageService from "../services/messageService.js";
import * as groupService from "../services/groupService.js";
import * as userService from "../services/userService.js";
import socketAPI from "../config/webSocket.js";

export const useChatMessageInteractions = ({
  state,
  fetchChats,
  handleTypingEmit,
}) => {
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    state.setIsUpdating(true);
    const formData = new FormData();
    formData.append("name", state.editName);
    if (state.editAbout !== undefined) formData.append("about", state.editAbout);
    if (state.editAvatar) formData.append("avatar", state.editAvatar);
    try {
      const data = await userService.updateProfile(formData);
      const updated = {
        ...state.loggedInUser,
        name: data.name,
        avatar: data.avatar,
        about: data.about || state.editAbout,
        phone: data.phone || state.loggedInUser?.phone,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      state.setLoggedInUser(updated);
      state.setShowEditModal(false);
      toast.success("Profile updated!");
    } catch (_err) {
      toast.error(_err.message || "Failed to update");
    } finally {
      state.setIsUpdating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!state.groupName.trim()) return toast.error("Group name is required");
    if (state.groupMemberIds.length === 0)
      return toast.error("Add at least one member");
    state.setIsCreatingGroup(true);
    const formData = new FormData();
    formData.append("name", state.groupName);
    formData.append("memberIds", JSON.stringify(state.groupMemberIds));
    if (state.groupAvatarFile) formData.append("avatar", state.groupAvatarFile);
    try {
      const data = await groupService.createGroup(formData);
      toast.success(`Group "${data.name}" created!`);
      state.setShowCreateGroup(false);
      state.setGroupName("");
      state.setGroupMemberIds([]);
      state.setGroupAvatarFile(null);
      socketAPI.emit("newGroup", data);
      fetchChats();
    } catch (_err) {
      toast.error(_err.message || "Failed to create group");
    }
    state.setIsCreatingGroup(false);
  };

  const handleContextMenu = (e, msg, isMe) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    let x = e.pageX;
    if (x + menuWidth > window.innerWidth)
      x = window.innerWidth - menuWidth - 10;
    let y = e.pageY;
    if (y + 370 > window.innerHeight) y = window.innerHeight - 370 - 10;
    state.setContextMenu({
      visible: true,
      x,
      y,
      messageId: msg._id,
      isMe,
      text: msg.text,
      msg,
    });
  };

  const closeContextMenu = () =>
    state.setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleToggleStar = async () => {
    const msg = state.contextMenu.msg;
    if (!msg) return;
    closeContextMenu();

    try {
      const res = await messageService.toggleStarMessage(msg._id);
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, starredBy: res.starredBy } : m,
        ),
      );
      toast.success(res.isStarred ? "Message starred" : "Message unstarred");
    } catch (_err) {
      toast.error("Failed to update star");
    }
  };

  const handleJumpToMessage = (msg) => {
    const chatToSelect = state.chats.find(
      (c) =>
        c.id === msg.groupId ||
        c.id ===
          (msg.senderId?._id === state.loggedInUser._id
            ? msg.receiverId
            : msg.senderId?._id),
    );
    if (chatToSelect) {
      state.setSelectedChat(chatToSelect);
    }
    setTimeout(() => {
      const targetEl = document.getElementById(`msg-${msg._id}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        targetEl.classList.add("ring-4", "ring-primary", "rounded-2xl");
        setTimeout(
          () => targetEl.classList.remove("ring-4", "ring-primary", "rounded-2xl"),
          1500,
        );
      }
    }, 500);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    state.setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => state.setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTypingEvent = (e) => {
    const val = e.target.value || "";
    state.setMessage(val);
    if (state.selectedChat?.isGroup) {
      const cursorPosition = e.target.selectionStart || val.length;
      const textBeforeCursor = val.slice(0, cursorPosition);
      const lastAtSymbolIdx = textBeforeCursor.lastIndexOf("@");
      if (lastAtSymbolIdx !== -1) {
        const isPrecededBySpace =
          lastAtSymbolIdx === 0 ||
          textBeforeCursor[lastAtSymbolIdx - 1] === " ";
        if (isPrecededBySpace) {
          const mentionQuery = textBeforeCursor.slice(lastAtSymbolIdx + 1);
          if (!mentionQuery.includes(" ")) {
            state.setMentionFilter(mentionQuery);
            state.setShowMentionPopup(true);
          } else state.setShowMentionPopup(false);
        } else state.setShowMentionPopup(false);
      } else state.setShowMentionPopup(false);
    } else state.setShowMentionPopup(false);

    if (state.selectedChat && state.loggedInUser) handleTypingEmit();
  };

  const handleInsertMention = (member) => {
    const textarea = document.querySelector("textarea");
    const safeMessage = state.message || "";
    const cursorPosition = textarea
      ? textarea.selectionStart
      : safeMessage.length;
    const textBeforeCursor = safeMessage.slice(0, cursorPosition);
    const lastAtSymbolIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbolIdx !== -1) {
      const beforeAt = safeMessage.slice(0, lastAtSymbolIdx);
      const afterCursor = safeMessage.slice(cursorPosition);
      const newText = `${beforeAt}@${member.name} ${afterCursor}`;
      state.setMessage(newText);
      state.setShowMentionPopup(false);
      state.setMentionFilter("");

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newPos = beforeAt.length + member.name.length + 2;
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleReact = async (msgId, emoji) => {
    state.setShowFullEmojiForMsg(null);
    state.setHoveredMsgId(null);
    try {
      const reactions = await messageService.addReaction(msgId, emoji);
      state.setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, reactions } : m)),
      );
      socketAPI.emit("reaction", {
        messageId: msgId,
        reactions,
        senderId: state.loggedInUser?._id,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
    } catch {
      toast.error("Error adding reaction");
    }
  };

  const handlePin = async () => {
    const msgId = state.contextMenu.messageId;
    closeContextMenu();
    try {
      const data = await messageService.pinMessage(msgId);
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId
            ? { ...m, isPinned: data.isPinned }
            : { ...m, isPinned: false },
        ),
      );
      const msg = state.messages.find((m) => m._id === msgId);
      if (data.isPinned) {
        state.setPinnedMessage({ ...msg, isPinned: true });
        state.setShowPinnedBanner(true);
        toast.success("Message pinned");
      } else {
        state.setPinnedMessage(null);
        toast("Message unpinned");
      }
    } catch {
      toast.error("Error pinning");
    }
  };

  const confirmDeleteMessage = (type) => {
    const isMulti = state.deleteMessageId === "__multi__";
    const ids = isMulti ? state.selectedMessageIds : [state.deleteMessageId];

    const snapshot = state.messages
      .filter((m) => ids.includes(m._id))
      .map((m) => ({ ...m }));
    state.setMessages((prev) =>
      prev.map((m) => {
        if (ids.includes(m._id)) {
          if (type === "me")
            return {
              ...m,
              deletedFor: [...(m.deletedFor || []), state.loggedInUser._id],
            };
          else return { ...m, isDeletedForEveryone: true, text: "", image: "" };
        }
        return m;
      }),
    );

    state.setShowDeleteModal(false);
    state.setDeleteMessageId(null);
    if (isMulti) {
      state.setSelectMode(false);
      state.setSelectedMessageIds([]);
    }

    let isUndone = false;
    toast(
      (t) => (
        <div className="flex items-center gap-4 text-sm font-medium">
          <span>Message{ids.length > 1 ? "s" : ""} deleted</span>
          <button
            className="text-primary hover:underline ml-auto font-bold"
            onClick={() => {
              isUndone = true;
              toast.dismiss(t.id);
              state.setMessages((prev) =>
                prev.map((m) => {
                  const snap = snapshot.find((s) => s._id === m._id);
                  return snap ? snap : m;
                }),
              );
            }}
          >
            UNDO
          </button>
        </div>
      ),
      { duration: 2500 },
    );

    setTimeout(async () => {
      if (isUndone) return;
      for (const id of ids) {
        try {
          await messageService.deleteMessage(id, type);
          if (type === "everyone") {
            socketAPI.emit("deleteMessage", {
              messageId: id,
              receiverId: state.selectedChat.id,
              groupId: state.selectedChat.isGroup
                ? state.selectedChat.id
                : null,
            });
          }
        } catch {
          /* ignore */
        }
      }
    }, 2000);
  };

  const forwardSelectedMessages = async (targetChat) => {
    for (const msgId of state.selectedMessageIds) {
      const msg = state.messages.find((m) => m._id === msgId);
      if (!msg || msg.isDeletedForEveryone) continue;
      const formData = new FormData();
      if (msg.text) formData.append("text", `↗ Forwarded: ${msg.text}`);
      try {
        if (targetChat.isGroup)
          await groupService.sendGroupMessage(targetChat.id, formData);
        else await messageService.sendMessage(targetChat.id, formData);
      } catch {
        /* ignore */
      }
    }
    toast.success(
      `Forwarded ${state.selectedMessageIds.length} message(s) to ${targetChat.name}`,
    );
    state.setSelectMode(false);
    state.setSelectedMessageIds([]);
    state.setShowForwardModal(false);
    state.setForwardMessage(null);
  };

  const confirmForward = async (targetChat) => {
    if (!state.forwardMessage || !targetChat) return;
    try {
      const formData = new FormData();
      if (state.forwardMessage.text)
        formData.append("text", `↗ Forwarded: ${state.forwardMessage.text}`);
      if (targetChat.isGroup)
        await groupService.sendGroupMessage(targetChat.id, formData);
      else await messageService.sendMessage(targetChat.id, formData);
      toast.success(`Forwarded to ${targetChat.name}`);
    } catch {
      toast.error("Failed to forward");
    }
    state.setShowForwardModal(false);
    state.setForwardMessage(null);
  };

  const reactionMapByMsgId = (msg) => {
    const map = {};
    (msg.reactions || []).forEach((r) => {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, isMine: false };
      map[r.emoji].count++;
      if (
        r.userId === state.loggedInUser?._id ||
        r.userId?.toString() === state.loggedInUser?._id
      )
        map[r.emoji].isMine = true;
    });
    return map;
  };

  return {
    handleUpdateProfile,
    handleCreateGroup,
    handleContextMenu,
    closeContextMenu,
    handleToggleStar,
    handleJumpToMessage,
    handleImageSelect,
    handleTypingEvent,
    handleInsertMention,
    handleReact,
    handlePin,
    confirmDeleteMessage,
    forwardSelectedMessages,
    confirmForward,
    reactionMapByMsgId,
  };
};
