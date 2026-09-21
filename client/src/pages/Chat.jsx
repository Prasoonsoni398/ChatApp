import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsX, BsTrash, BsSearch, BsPinAngleFill } from "react-icons/bs";
import { IoReturnUpForwardOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import socketAPI from "../config/webSocket.js";

// Hooks
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import useTypingIndicator from "../hooks/useTypingIndicator.js";
import useChatState from "../hooks/useChatState.js";

// Services
import * as authService from "../services/authService.js";
import * as messageService from "../services/messageService.js";
import * as groupService from "../services/groupService.js";
import * as userService from "../services/userService.js";
import * as statusService from "../services/statusService.js";

// Sub-components
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import IconSidebar from "../components/chat/IconSidebar.jsx";
import StatusSidebar from "../components/chat/StatusSidebar.jsx";
import StatusViewer from "../components/chat/StatusViewer.jsx";
import ChatHeader from "../components/chat/ChatHeader.jsx";
import MessageList from "../components/chat/MessageList.jsx";
import ChatInputArea from "../components/chat/ChatInputArea.jsx";
import ChatModals from "../components/chat/ChatModals.jsx";
import ContextMenu from "../components/chat/ContextMenu.jsx";

const Chat = () => {
  const navigate = useNavigate();
  const state = useChatState(); // All extracted useState & useRef

  const { onlineUsersMap, setOnlineUsersMap } = useOnlineStatus();
  const {
    otherUserTyping, setOtherUserTyping,
    handleTypingEmit, handleTypingReceive,
  } = useTypingIndicator(state.selectedChat, state.loggedInUser);

  const [activeTab, setActiveTab] = React.useState('chats');
  const [statuses, setStatuses] = React.useState([]);
  const [isUploadingStatus, setIsUploadingStatus] = React.useState(false);
  const [activeStatusGroup, setActiveStatusGroup] = React.useState(null);

  const fetchStatuses = useCallback(async () => {
    try {
      const data = await statusService.getStatuses();
      setStatuses(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  }, []);

  useEffect(() => {
    if (state.loggedInUser) {
      fetchStatuses();
    }
  }, [state.loggedInUser, fetchStatuses]);

  const handleUploadStatus = async (file) => {
    try {
      setIsUploadingStatus(true);
      const formData = new FormData();
      formData.append('image', file);
      await statusService.uploadStatus(formData);
      toast.success('Status uploaded!');
      fetchStatuses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload status');
    } finally {
      setIsUploadingStatus(false);
    }
  };

  /* ═════════════════════ SYNC SESSION STORAGE ═════════════════════ */
  useEffect(() => {
    if (state.selectedChat)
      sessionStorage.setItem("selectedChat", JSON.stringify(state.selectedChat));
    else sessionStorage.removeItem("selectedChat");
  }, [state.selectedChat]);

  /* ═════════════════════ CLICK OUTSIDE LISTENERS ═════════════════════ */
  useEffect(() => {
    const handler = (e) => {
      if (state.contextMenu.visible) {
        state.setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contextMenu.visible]);

  useEffect(() => {
    const handler = (e) => {
      if (state.profileMenuRef.current && !state.profileMenuRef.current.contains(e.target))
        state.setShowProfileMenu(false);
      if (state.headerMenuRef.current && !state.headerMenuRef.current.contains(e.target))
        state.setShowHeaderMenu(false);
      if (
        state.showEmojiPicker &&
        state.emojiPickerRef.current &&
        !state.emojiPickerRef.current.contains(e.target) &&
        state.emojiToggleBtnRef.current &&
        !state.emojiToggleBtnRef.current.contains(e.target)
      ) {
        state.setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.showEmojiPicker]);

  useEffect(() => {
    state.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.messages]);

  /* ═════════════════════ FETCH CHATS ═════════════════════ */
  const fetchChats = useCallback(async () => {
    const loggedInUserData = JSON.parse(localStorage.getItem("user"));
    try {
      const [users, groups] = await Promise.all([
        userService.getAllUsers(),
        groupService.getGroups(),
      ]);

      const dmChats = users
        .filter((u) => u._id !== loggedInUserData?._id)
        .map((u) => ({
          id: u._id,
          name: u.name,
          isGroup: false,
          lastMessage: "Tap to start chatting",
          time: "",
          unread: 0,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
        }));

      const groupChats = (groups || []).map((g) => ({
        id: g._id,
        name: g.name,
        isGroup: true,
        members: g.members,
        admin: g.admin,
        lastMessage: "Group chat",
        time: "",
        unread: 0,
        avatar: g.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}`,
      }));

      state.setAllUsers(users.filter((u) => u._id !== loggedInUserData?._id));
      state.setChats([...groupChats, ...dmChats]);
    } catch (e) {
      console.error("Error fetching chats:", e);
      toast.error("Failed to load chats");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login");
      navigate("/login");
      return;
    }
    fetchChats();
    if (!state.loggedInUser) return;
    socketAPI.emit("createPath", state.loggedInUser?._id);
    socketAPI.on("onlineUsers", setOnlineUsersMap);

    const handleNewGroup = (group) => {
      state.setChats((prev) => {
        if (prev.some((c) => c.id === group._id)) return prev;
        const newGroupChat = {
          id: group._id,
          name: group.name,
          isGroup: true,
          members: group.members,
          admin: group.admin,
          lastMessage: "Group chat",
          time: "",
          unread: 0,
          avatar: group.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`,
        };
        return [newGroupChat, ...prev];
      });
    };
    socketAPI.on("newGroup", handleNewGroup);

    return () => {
      socketAPI.off("onlineUsers");
      socketAPI.off("newGroup", handleNewGroup);
      if (state.loggedInUser) socketAPI.emit("destroyPath", state.loggedInUser?._id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, state.loggedInUser, fetchChats]);

  /* ═════════════════════ FETCH MESSAGES ═════════════════════ */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!state.selectedChat) return;
      try {
        let data;
        if (state.selectedChat.isGroup) {
          data = await groupService.getGroupMessages(state.selectedChat.id);
        } else {
          data = await messageService.getMessages(state.selectedChat.id);
        }

        const unreadIds = data
          .filter((m) => {
            const senderIdStr = typeof m.senderId === "object" ? m.senderId?._id : m.senderId;
            return senderIdStr !== state.loggedInUser?._id && m.status !== "read";
          })
          .map((m) => m._id);

        unreadIds.forEach((id) => {
          const msg = data.find((m) => m._id === id);
          const senderIdStr = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
          socketAPI.emit("messageStatus", {
            messageId: id,
            status: "read",
            senderId: senderIdStr,
            receiverId: state.loggedInUser?._id,
          });
        });

        state.setMessages((prev) => {
          const prevMap = new Map(prev.map((m) => [m._id, m.status]));
          return data.map((m) => ({
            ...m,
            status: unreadIds.includes(m._id) ? "read" : prevMap.get(m._id) || m.status,
          }));
        });
        const pinned = data.find((m) => m.isPinned);
        if (pinned) {
          state.setPinnedMessage(pinned);
          state.setShowPinnedBanner(true);
        } else state.setPinnedMessage(null);
      } catch (e) {
        console.error("Fetch messages error:", e);
      }
    };

    if (state.selectedChat) fetchMessages();
    else {
      state.setMessages([]);
      state.setPinnedMessage(null);
    }

    const handleReceive = (msg) => {
      if (!state.selectedChat) return;
      const matchesDM =
        !state.selectedChat.isGroup &&
        (msg.senderId === state.selectedChat.id || msg.receiverId === state.selectedChat.id);
      const matchesGroup = state.selectedChat.isGroup && msg.groupId === state.selectedChat.id;
      if (matchesDM || matchesGroup) {
        const senderIdStr = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
        if (senderIdStr !== state.loggedInUser?._id) {
          socketAPI.emit("messageStatus", {
            messageId: msg._id,
            status: "read",
            senderId: senderIdStr,
            receiverId: state.loggedInUser?._id,
          });
          msg.status = "read";
        }

        state.setMessages((prev) => {
          if (msg.isEdit) return prev.map((m) => (m._id === msg._id ? msg : m));
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleDelete = (data) => {
      if (
        state.selectedChat &&
        (data.groupId === state.selectedChat.id || data.receiverId === state.loggedInUser?._id)
      ) {
        state.setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? { ...m, isDeletedForEveryone: true, text: "", image: "" }
              : m
          )
        );
      }
    };

    const handleMessageStatus = (payload) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, status: payload.status } : m
        )
      );
    };

    const handleReaction = (payload) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m
        )
      );
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", handleTypingReceive);
    socketAPI.on("deleteMessage", handleDelete);
    socketAPI.on("messageStatus", handleMessageStatus);
    socketAPI.on("reaction", handleReaction);
    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", handleTypingReceive);
      socketAPI.off("deleteMessage", handleDelete);
      socketAPI.off("messageStatus", handleMessageStatus);
      socketAPI.off("reaction", handleReaction);
      setOtherUserTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedChat, state.loggedInUser]);

  /* ═════════════════════ HANDLERS ═════════════════════ */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    state.setIsUpdating(true);
    const formData = new FormData();
    formData.append("name", state.editName);
    if (state.editAvatar) formData.append("avatar", state.editAvatar);
    try {
      const data = await userService.updateProfile(formData);
      const updated = { ...state.loggedInUser, name: data.name, avatar: data.avatar };
      localStorage.setItem("user", JSON.stringify(updated));
      state.setLoggedInUser(updated);
      state.setShowEditModal(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      state.setIsUpdating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!state.groupName.trim()) return toast.error("Group name is required");
    if (state.groupMemberIds.length === 0) return toast.error("Add at least one member");
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
    } catch (err) {
      toast.error(err.message || "Failed to create group");
    }
    state.setIsCreatingGroup(false);
  };

  const handleContextMenu = (e, msg, isMe) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    let x = e.pageX;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    let y = e.pageY;
    if (y + 370 > window.innerHeight) y = window.innerHeight - 370 - 10;
    state.setContextMenu({
      visible: true, x, y, messageId: msg._id, isMe, text: msg.text, msg,
    });
  };
  const closeContextMenu = () => state.setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!state.message.trim() && !state.selectedImage) || !state.selectedChat) return;

    if (state.editingMessageId) {
      try {
        const data = await messageService.editMessage(state.editingMessageId, state.message);
        state.setMessages((prev) =>
          prev.map((m) => (m._id === state.editingMessageId ? data : m))
        );
        socketAPI.emit("send", { ...data, receiverId: state.selectedChat.id, isEdit: true });
        state.setEditingMessageId(null);
        state.setMessage("");
      } catch {
        toast.error("Failed to edit");
      }
      return;
    }

    const tempId = Date.now().toString();
    const senderInfo = {
      _id: state.loggedInUser._id,
      name: state.loggedInUser.name,
      avatar: state.loggedInUser.avatar,
    };
    const optimisticMsg = {
      _id: tempId,
      text: state.message,
      image: state.imagePreview,
      senderId: state.selectedChat.isGroup ? senderInfo : state.loggedInUser._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      replyToText: state.replyingTo?.text,
      replyToSender: state.replyingTo?.senderName,
      groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      reactions: [],
    };
    state.setMessages((prev) => [...prev, optimisticMsg]);

    const currentMessage = state.message;
    const currentImage = state.selectedImage;
    const currentReply = state.replyingTo;
    state.setMessage("");
    state.setSelectedImage(null);
    state.setImagePreview(null);
    state.setShowEmojiPicker(false);
    state.setReplyingTo(null);

    const formData = new FormData();
    if (currentMessage) formData.append("text", currentMessage);
    if (currentImage) formData.append("image", currentImage);
    if (currentReply) {
      formData.append("replyToId", currentReply._id);
      formData.append("replyToText", currentReply.text || "");
      formData.append("replyToSender", currentReply.senderName || "");
    }

    try {
      let data;
      if (state.selectedChat.isGroup) {
        data = await groupService.sendGroupMessage(state.selectedChat.id, formData);
      } else {
        data = await messageService.sendMessage(state.selectedChat.id, formData);
      }
      state.setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m))
      );
      socketAPI.emit("send", {
        ...data,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
    } catch (err) {
      toast.error("Failed to send message");
      state.setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
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
          lastAtSymbolIdx === 0 || textBeforeCursor[lastAtSymbolIdx - 1] === " ";
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
    const cursorPosition = textarea ? textarea.selectionStart : safeMessage.length;
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
        prev.map((m) => (m._id === msgId ? { ...m, reactions } : m))
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
          m._id === msgId ? { ...m, isPinned: data.isPinned } : { ...m, isPinned: false }
        )
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

    const snapshot = state.messages.filter((m) => ids.includes(m._id)).map((m) => ({ ...m }));
    state.setMessages((prev) =>
      prev.map((m) => {
        if (ids.includes(m._id)) {
          if (type === "me") return { ...m, deletedFor: [...(m.deletedFor || []), state.loggedInUser._id] };
          else return { ...m, isDeletedForEveryone: true, text: "", image: "" };
        }
        return m;
      })
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
                })
              );
            }}
          >
            UNDO
          </button>
        </div>
      ),
      { duration: 2500 }
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
              groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
            });
          }
        } catch {}
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
        if (targetChat.isGroup) await groupService.sendGroupMessage(targetChat.id, formData);
        else await messageService.sendMessage(targetChat.id, formData);
      } catch {}
    }
    toast.success(`Forwarded ${state.selectedMessageIds.length} message(s) to ${targetChat.name}`);
    state.setSelectMode(false);
    state.setSelectedMessageIds([]);
    state.setShowForwardModal(false);
    state.setForwardMessage(null);
  };

  const confirmForward = async (targetChat) => {
    if (!state.forwardMessage || !targetChat) return;
    try {
      const formData = new FormData();
      if (state.forwardMessage.text) formData.append("text", `↗ Forwarded: ${state.forwardMessage.text}`);
      if (targetChat.isGroup) await groupService.sendGroupMessage(targetChat.id, formData);
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
      if (r.userId === state.loggedInUser?._id || r.userId?.toString() === state.loggedInUser?._id)
        map[r.emoji].isMine = true;
    });
    return map;
  };

  const currentPinned = state.pinnedMessage || state.messages.find((m) => m.isPinned);

  /* ═════════════════════ RENDER ═════════════════════ */
  return (
    <div className="flex h-screen bg-base-200 overflow-hidden text-base-content">
      {/* ── THIN ICON SIDEBAR ── */}
      <IconSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loggedInUser={state.loggedInUser}
        handleLogout={handleLogout}
        setShowEditModal={state.setShowEditModal}
        setEditName={state.setEditName}
      />

      {/* ── MAIN SIDEBAR (CHATS or STATUS) ── */}
      {activeTab === 'chats' ? (
        <ChatSidebar
          loggedInUser={state.loggedInUser}
        chats={state.chats}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        selectedChat={state.selectedChat}
        setSelectedChat={state.setSelectedChat}
        showProfileMenu={state.showProfileMenu}
        setShowProfileMenu={state.setShowProfileMenu}
        profileMenuRef={state.profileMenuRef}
        handleLogout={handleLogout}
        setShowEditModal={state.setShowEditModal}
        setShowCreateGroup={state.setShowCreateGroup}
        setEditName={state.setEditName}
      />
      ) : (
        <StatusSidebar
          loggedInUser={state.loggedInUser}
          statuses={statuses}
          onUploadStatus={handleUploadStatus}
          onViewStatus={setActiveStatusGroup}
          isUploading={isUploadingStatus}
        />
      )}

      {/* ── MAIN CHAT AREA ── */}
      <div
        className={`flex-1 flex flex-col bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center ${
          !state.selectedChat ? "hidden md:flex" : "flex"
        }`}
        style={{ backgroundColor: "#efeae2", backgroundBlendMode: "overlay" }}
      >
        {state.selectedChat ? (
          <>
            <ChatHeader
              selectedChat={state.selectedChat}
              setSelectedChat={state.setSelectedChat}
              onlineUsersMap={onlineUsersMap}
              showMsgSearch={state.showMsgSearch}
              setShowMsgSearch={state.setShowMsgSearch}
              setMsgSearchQuery={state.setMsgSearchQuery}
              setMsgSearchIndex={state.setMsgSearchIndex}
              showHeaderMenu={state.showHeaderMenu}
              setShowHeaderMenu={state.setShowHeaderMenu}
              headerMenuRef={state.headerMenuRef}
              setSelectMode={state.setSelectMode}
              setSelectedMessageIds={state.setSelectedMessageIds}
              currentPinned={currentPinned}
              messages={state.messages}
              setMessages={state.setMessages}
              showPinnedBanner={state.showPinnedBanner}
              setShowPinnedBanner={state.setShowPinnedBanner}
              clearUndoTimeoutRef={state.clearUndoTimeoutRef}
              setClearedMessagesBackup={state.setClearedMessagesBackup}
              setShowClearUndoBanner={state.setShowClearUndoBanner}
            />

            {/* In-chat Search Bar */}
            {state.showMsgSearch && (
              <div className="flex items-center gap-2 px-4 py-2 bg-base-100 border-b border-base-300">
                <div className="flex-1 relative">
                  <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    autoFocus
                    type="text"
                    value={state.msgSearchQuery}
                    onChange={(e) => {
                      state.setMsgSearchQuery(e.target.value);
                      state.setMsgSearchIndex(0);
                    }}
                    placeholder="Search in this chat…"
                    className="input input-sm input-bordered w-full pl-9 bg-base-200"
                    onKeyDown={(e) => {
                      if (!state.msgSearchQuery.trim()) return;
                      const matches = state.messages.filter((m) =>
                        m.text?.toLowerCase().includes(state.msgSearchQuery.toLowerCase())
                      );
                      if (matches.length === 0) return;
                      let nextIdx = state.msgSearchIndex;
                      if (e.key === "Enter" || e.key === "ArrowDown")
                        nextIdx = (state.msgSearchIndex + 1) % matches.length;
                      else if (e.key === "ArrowUp")
                        nextIdx = (state.msgSearchIndex - 1 + matches.length) % matches.length;
                      state.setMsgSearchIndex(nextIdx);
                      const el = document.getElementById(`msg-${matches[nextIdx]._id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      el?.classList.add("ring-2", "ring-primary", "rounded-xl");
                      setTimeout(() => el?.classList.remove("ring-2", "ring-primary", "rounded-xl"), 1500);
                    }}
                  />
                </div>
                {state.msgSearchQuery.trim() && (
                  <span className="text-xs text-base-content/50 whitespace-nowrap">
                    {(() => {
                      const c = state.messages.filter((m) =>
                        m.text?.toLowerCase().includes(state.msgSearchQuery.toLowerCase())
                      ).length;
                      return c > 0 ? `${state.msgSearchIndex + 1}/${c}` : "0 results";
                    })()}
                  </span>
                )}
                <button
                  onClick={() => { state.setShowMsgSearch(false); state.setMsgSearchQuery(""); }}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <BsX size={18} />
                </button>
              </div>
            )}

            {/* Pinned Banner */}
            {currentPinned && state.showPinnedBanner && !currentPinned.isDeletedForEveryone && (
              <div
                className="flex items-center gap-3 px-4 py-2 bg-base-100/90 border-b border-base-300 cursor-pointer hover:bg-base-200/50 animate-slide-up shadow-sm"
                onClick={() =>
                  document.getElementById(`msg-${currentPinned._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                <BsPinAngleFill className="text-primary" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">Pinned Message</p>
                  <p className="text-xs text-base-content/70 truncate">{currentPinned.text || "📷 Image"}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); state.setShowPinnedBanner(false); }}
                  className="text-base-content/40 hover:text-base-content/70"
                >
                  <BsX size={18} />
                </button>
              </div>
            )}

            {/* Select Toolbar */}
            {state.selectMode && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-content">
                <div className="flex items-center gap-2">
                  <button onClick={() => { state.setSelectMode(false); state.setSelectedMessageIds([]); }}>
                    <BsX size={22} />
                  </button>
                  <span className="font-semibold">{state.selectedMessageIds.length} selected</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { state.setForwardMessage("__multi__"); state.setShowForwardModal(true); }}
                    className="btn btn-sm btn-ghost text-primary-content"
                  >
                    <IoReturnUpForwardOutline size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (state.selectedMessageIds.length === 0) return;
                      state.setDeleteMessageId("__multi__");
                      state.setDeleteIsMe(false);
                      state.setShowDeleteModal(true);
                    }}
                    className="btn btn-sm btn-ghost text-primary-content"
                  >
                    <BsTrash size={18} />
                  </button>
                </div>
              </div>
            )}

            <MessageList
              messages={state.messages}
              loggedInUser={state.loggedInUser}
              selectedChat={state.selectedChat}
              selectMode={state.selectMode}
              selectedMessageIds={state.selectedMessageIds}
              msgSearchQuery={state.msgSearchQuery}
              reactionMapByMsgId={reactionMapByMsgId}
              hoveredMsgId={state.hoveredMsgId}
              setHoveredMsgId={state.setHoveredMsgId}
              showFullEmojiForMsg={state.showFullEmojiForMsg}
              setShowFullEmojiForMsg={state.setShowFullEmojiForMsg}
              handleReact={handleReact}
              handleContextMenu={handleContextMenu}
              toggleSelectMessage={(id) =>
                state.setSelectedMessageIds((prev) =>
                  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                )
              }
              setReplyingTo={state.setReplyingTo}
              reactionTimeoutRef={state.reactionTimeoutRef}
              messagesEndRef={state.messagesEndRef}
              otherUserTyping={otherUserTyping}
            />

            {/* Clear Chat Undo Banner */}
            {state.showClearUndoBanner && (
              <div className="mx-4 my-2 p-3 bg-base-100 rounded-xl shadow-lg border border-base-300 flex items-center justify-between animate-fade-in relative z-10">
                <span className="text-sm">Messages cleared from this device.</span>
                <button
                  onClick={() => {
                    state.setMessages(state.clearedMessagesBackup);
                    state.setClearedMessagesBackup(null);
                    state.setShowClearUndoBanner(false);
                    if (state.clearUndoTimeoutRef.current) clearTimeout(state.clearUndoTimeoutRef.current);
                  }}
                  className="btn btn-sm btn-primary px-4 rounded-lg shadow-sm"
                >
                  Undo
                </button>
              </div>
            )}

            <ChatInputArea
              message={state.message}
              setMessage={state.setMessage}
              selectedImage={state.selectedImage}
              setSelectedImage={state.setSelectedImage}
              imagePreview={state.imagePreview}
              setImagePreview={state.setImagePreview}
              replyingTo={state.replyingTo}
              setReplyingTo={state.setReplyingTo}
              editingMessageId={state.editingMessageId}
              setEditingMessageId={state.setEditingMessageId}
              showEmojiPicker={state.showEmojiPicker}
              setShowEmojiPicker={state.setShowEmojiPicker}
              emojiPickerRef={state.emojiPickerRef}
              emojiToggleBtnRef={state.emojiToggleBtnRef}
              fileInputRef={state.fileInputRef}
              handleImageSelect={handleImageSelect}
              handleSendMessage={handleSendMessage}
              handleTypingEvent={handleTypingEvent}
              showMentionPopup={state.showMentionPopup}
              mentionFilter={state.mentionFilter}
              selectedChat={state.selectedChat}
              loggedInUser={state.loggedInUser}
              handleInsertMention={handleInsertMention}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-100/50 backdrop-blur-sm">
            <div className="w-64 h-64 mb-8 opacity-40 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png')] bg-no-repeat bg-contain bg-center"></div>
            <h1 className="text-3xl font-light text-base-content mb-4">ChatApp Web</h1>
            <p className="text-base-content/60 max-w-md">
              Send and receive messages without keeping your phone online.
              <br />
              Use ChatApp on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
        )}
      </div>

      <ChatModals
        {...state}
        allUsers={state.allUsers}
        chats={state.chats}
        handleUpdateProfile={handleUpdateProfile}
        handleCreateGroup={handleCreateGroup}
        confirmDeleteMessage={confirmDeleteMessage}
        forwardSelectedMessages={forwardSelectedMessages}
        confirmForward={confirmForward}
      />

      {activeStatusGroup && (
        <StatusViewer
          group={activeStatusGroup}
          onClose={() => setActiveStatusGroup(null)}
        />
      )}

      <ContextMenu
        contextMenu={state.contextMenu}
        loggedInUser={state.loggedInUser}
        messages={state.messages}
        handleShowInfo={() => {
          state.setInfoMessage(state.contextMenu.msg);
          state.setShowInfoModal(true);
          closeContextMenu();
        }}
        handleReply={() => {
          const msg = state.contextMenu.msg;
          const senderName = state.contextMenu.isMe
            ? "You"
            : state.selectedChat?.isGroup
            ? msg.senderId?.name || "Member"
            : state.selectedChat?.name;
          state.setReplyingTo({ _id: msg._id, text: msg.text, image: msg.image, senderName });
          closeContextMenu();
        }}
        handleCopy={() => {
          if (state.contextMenu.text) {
            navigator.clipboard.writeText(state.contextMenu.text);
            toast.success("Copied!");
          }
          closeContextMenu();
        }}
        handleForward={() => {
          state.setForwardMessage(state.contextMenu.msg);
          state.setShowForwardModal(true);
          closeContextMenu();
        }}
        handlePin={handlePin}
        handleStartSelect={() => {
          state.setSelectMode(true);
          state.setSelectedMessageIds([state.contextMenu.messageId]);
          closeContextMenu();
        }}
        openDeleteModal={() => {
          state.setDeleteMessageId(state.contextMenu.messageId);
          state.setDeleteIsMe(state.contextMenu.isMe);
          state.setShowDeleteModal(true);
          closeContextMenu();
        }}
        closeContextMenu={closeContextMenu}
        setEditingMessageId={state.setEditingMessageId}
        setMessage={state.setMessage}
      />
    </div>
  );
};

export default Chat;
