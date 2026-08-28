import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsSearch, BsThreeDotsVertical, BsEmojiSmile, BsPaperclip, BsFillSendFill,
  BsArrowLeft, BsCheck, BsCheckAll, BsInfoCircle, BsReply, BsCopy, BsForward,
  BsPin, BsPinAngleFill, BsCheckSquare, BsTrash, BsX, BsCheckCircle,
  BsCheckCircleFill, BsPencil, BsPeopleFill, BsPlusLg,
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import socketAPI from "../config/webSocket.js";

/* ── Quick emoji reactions palette ── */
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/* ═══════════════════════════════════════════════════════════ */
const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedChat")) || null;
    } catch {
      return null;
    }
  });

  // Keep sessionStorage in sync
  useEffect(() => {
    if (selectedChat) sessionStorage.setItem("selectedChat", JSON.stringify(selectedChat));
    else sessionStorage.removeItem("selectedChat");
  }, [selectedChat]);

  const [chats, setChats] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);

  // Profile edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(loggedInUser?.name || "");
  const [editAvatar, setEditAvatar] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Online / typing
  const [onlineUsersMap, setOnlineUsersMap] = useState({});
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [clearedMessagesBackup, setClearedMessagesBackup] = useState(null);
  const [showClearUndoBanner, setShowClearUndoBanner] = useState(false);
  const clearUndoTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Input helpers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  // Context menu
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null, isMe: false, text: "", msg: null });

  // Feature modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteIsMe, setDeleteIsMe] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);

  // Reply
  const [replyingTo, setReplyingTo] = useState(null);

  // Pin
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);

  // Select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // In-chat search
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchIndex, setMsgSearchIndex] = useState(0);

  // Header menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);

  // Emoji reaction hover
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [showFullEmojiForMsg, setShowFullEmojiForMsg] = useState(null);
  const reactionTimeout = useRef(null);

  // Group creation modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  /* ═════════════════════ CONTEXT MENU ═════════════════════ */
  const handleContextMenu = (e, msg, isMe) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    let x = e.pageX;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    let y = e.pageY;
    if (y + 370 > window.innerHeight) y = window.innerHeight - 370 - 10;
    setContextMenu({ visible: true, x, y, messageId: msg._id, isMe, text: msg.text, msg });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null, isMe: false, text: "", msg: null });
  };

  useEffect(() => {
    const handler = () => { if (contextMenu.visible) closeContextMenu(); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu.visible]);

  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setShowHeaderMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ═════════════════════ MESSAGE ACTIONS ═════════════════════ */
  const handleShowInfo = () => { setInfoMessage(contextMenu.msg); setShowInfoModal(true); closeContextMenu(); };

  const handleReply = () => {
    const msg = contextMenu.msg;
    const senderName = contextMenu.isMe ? "You" : (selectedChat?.isGroup ? (msg.senderId?.name || "Member") : selectedChat?.name);
    setReplyingTo({ _id: msg._id, text: msg.text, image: msg.image, senderName });
    closeContextMenu();
  };

  const handleCopy = () => {
    if (contextMenu.text) { navigator.clipboard.writeText(contextMenu.text); toast.success("Copied!"); }
    closeContextMenu();
  };

  const handleForward = () => { setForwardMessage(contextMenu.msg); setShowForwardModal(true); closeContextMenu(); };

  const confirmForward = async (targetChat) => {
    if (!forwardMessage || !targetChat) return;
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      if (forwardMessage.text) formData.append("text", `↗ Forwarded: ${forwardMessage.text}`);
      const url = targetChat.isGroup
        ? `/api/groups/${targetChat.id}/messages`
        : `/api/messages/send/${targetChat.id}`;
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (res.ok) toast.success(`Forwarded to ${targetChat.name}`);
      else toast.error("Failed to forward");
    } catch { toast.error("Error forwarding"); }
    setShowForwardModal(false); setForwardMessage(null);
  };

  const handlePin = async () => {
    const msgId = contextMenu.messageId;
    const token = localStorage.getItem("token");
    closeContextMenu();
    try {
      const res = await fetch(`/api/messages/pin/${msgId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, isPinned: data.isPinned } : { ...m, isPinned: false }));
        const msg = messages.find((m) => m._id === msgId);
        if (data.isPinned) { setPinnedMessage({ ...msg, isPinned: true }); setShowPinnedBanner(true); toast.success("Message pinned"); }
        else { setPinnedMessage(null); toast("Message unpinned"); }
      }
    } catch { toast.error("Error pinning"); }
  };

  /* ═════════════════════ EMOJI REACTIONS ═════════════════════ */
  const handleReact = async (msgId, emoji) => {
    const token = localStorage.getItem("token");
    setShowFullEmojiForMsg(null);
    setHoveredMsgId(null);
    try {
      const res = await fetch(`/api/messages/react/${msgId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const reactions = await res.json();
        setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, reactions } : m));
      }
    } catch { toast.error("Error adding reaction"); }
  };

  /* ═════════════════════ SELECT ═════════════════════ */
  const handleStartSelect = () => { setSelectMode(true); setSelectedMessageIds([contextMenu.messageId]); closeContextMenu(); };
  const toggleSelectMessage = (msgId) => setSelectedMessageIds((prev) => prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]);
  const cancelSelectMode = () => { setSelectMode(false); setSelectedMessageIds([]); };
  const deleteSelectedMessages = () => { if (selectedMessageIds.length === 0) return; setDeleteMessageId("__multi__"); setDeleteIsMe(false); setShowDeleteModal(true); };

  const forwardSelectedMessages = async (targetChat) => {
    const token = localStorage.getItem("token");
    for (const msgId of selectedMessageIds) {
      const msg = messages.find((m) => m._id === msgId);
      if (!msg || msg.isDeletedForEveryone) continue;
      const formData = new FormData();
      if (msg.text) formData.append("text", `↗ Forwarded: ${msg.text}`);
      const url = targetChat.isGroup ? `/api/groups/${targetChat.id}/messages` : `/api/messages/send/${targetChat.id}`;
      await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    }
    toast.success(`Forwarded ${selectedMessageIds.length} message(s) to ${targetChat.name}`);
    cancelSelectMode(); setShowForwardModal(false); setForwardMessage(null);
  };

  /* ═════════════════════ DELETE ═════════════════════ */
  const openDeleteModal = () => {
    setDeleteMessageId(contextMenu.messageId);
    setDeleteIsMe(contextMenu.isMe);
    setShowDeleteModal(true);
    closeContextMenu();
  };

  const confirmDeleteMessage = (type) => {
    const isMulti = deleteMessageId === "__multi__";
    const ids = isMulti ? selectedMessageIds : [deleteMessageId];
    const token = localStorage.getItem("token");

    // 1. Snapshot original messages to restore on undo
    const snapshot = messages.filter((m) => ids.includes(m._id)).map((m) => ({ ...m }));

    // 2. Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (ids.includes(m._id)) {
          if (type === "me") return { ...m, deletedFor: [...(m.deletedFor || []), loggedInUser._id] };
          else return { ...m, isDeletedForEveryone: true, text: "", image: "" };
        }
        return m;
      })
    );

    setShowDeleteModal(false);
    setDeleteMessageId(null);
    if (isMulti) cancelSelectMode();

    // 3. Show undo toast
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
              // Restore UI
              setMessages((prev) =>
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

    // 4. Execute deletion on server after 2 seconds if not undone
    setTimeout(async () => {
      if (isUndone) return;
      for (const id of ids) {
        try {
          const res = await fetch(`/api/messages/${id}?type=${type}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          if (res.ok && type === "everyone") {
            socketAPI.emit("deleteMessage", {
              messageId: id,
              receiverId: selectedChat.id,
              groupId: selectedChat.isGroup ? selectedChat.id : null,
            });
          }
        } catch {}
      }
    }, 2000);
  };

  /* ═════════════════════ FETCH MESSAGES ═════════════════════ */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      const token = localStorage.getItem("token");
      try {
        const url = selectedChat.isGroup
          ? `/api/groups/${selectedChat.id}/messages`
          : `/api/messages/${selectedChat.id}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        
        // Mark unread messages from others as read
        const unreadIds = data.filter(m => {
          const senderIdStr = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
          return senderIdStr !== loggedInUser?._id && m.status !== "read";
        }).map(m => m._id);

        unreadIds.forEach(id => {
          const msg = data.find(m => m._id === id);
          const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
          socketAPI.emit("messageStatus", { messageId: id, status: "read", senderId: senderIdStr, receiverId: loggedInUser?._id });
        });

        setMessages((prev) => {
          const prevMap = new Map(prev.map((m) => [m._id, m.status]));
          return data.map((m) => ({ 
            ...m, 
            status: unreadIds.includes(m._id) ? "read" : (prevMap.get(m._id) || m.status) 
          }));
        });
        const pinned = data.find((m) => m.isPinned);
        if (pinned) { setPinnedMessage(pinned); setShowPinnedBanner(true); } else setPinnedMessage(null);
      } catch (e) { console.error("Fetch messages error:", e); }
    };

    if (selectedChat) fetchMessages();
    else { setMessages([]); setPinnedMessage(null); }

    const handleReceive = (msg) => {
      if (!selectedChat) return;
      const matchesDM = !selectedChat.isGroup && (msg.senderId === selectedChat.id || msg.receiverId === selectedChat.id);
      const matchesGroup = selectedChat.isGroup && msg.groupId === selectedChat.id;
      if (matchesDM || matchesGroup) {
        const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
        if (senderIdStr !== loggedInUser?._id) {
          socketAPI.emit("messageStatus", { messageId: msg._id, status: "read", senderId: senderIdStr, receiverId: loggedInUser?._id });
          msg.status = "read";
        }
        
        setMessages((prev) => {
          if (msg.isEdit) return prev.map((m) => m._id === msg._id ? msg : m);
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = (data) => {
      if (selectedChat && data.userId === selectedChat.id) setOtherUserTyping(data.isTyping);
    };

    const handleDelete = (data) => {
      if (selectedChat && (data.groupId === selectedChat.id || data.receiverId === loggedInUser?._id)) {
        setMessages((prev) => prev.map((m) => m._id === data.messageId ? { ...m, isDeletedForEveryone: true, text: "", image: "" } : m));
      }
    };

    const handleMessageStatus = (payload) => {
      setMessages((prev) => prev.map((m) => m._id === payload.messageId ? { ...m, status: payload.status } : m));
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", handleTyping);
    socketAPI.on("deleteMessage", handleDelete);
    socketAPI.on("messageStatus", handleMessageStatus);
    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", handleTyping);
      socketAPI.off("deleteMessage", handleDelete);
      socketAPI.off("messageStatus", handleMessageStatus);
      setOtherUserTyping(false);
    };
  }, [selectedChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ═════════════════════ FETCH USERS + GROUPS ═════════════════════ */
  const fetchChats = useCallback(async () => {
    const token = localStorage.getItem("token");
    const loggedInUserData = JSON.parse(localStorage.getItem("user"));
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/groups", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const users = await usersRes.json();
      const groups = await groupsRes.json();

      const dmChats = users
        .filter((u) => u._id !== loggedInUserData?._id)
        .map((u) => ({
          id: u._id, name: u.name, isGroup: false,
          lastMessage: "Tap to start chatting", time: "", unread: 0,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
        }));

      const groupChats = (groups || []).map((g) => ({
        id: g._id, name: g.name, isGroup: true,
        members: g.members, admin: g.admin,
        lastMessage: "Group chat", time: "", unread: 0,
        avatar: g.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}`,
      }));

      setAllUsers(users.filter((u) => u._id !== loggedInUserData?._id));
      setChats([...groupChats, ...dmChats]);
    } catch (e) {
      console.error("Error fetching chats:", e);
      toast.error("Failed to load chats");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Please login"); navigate("/login"); return; }
    fetchChats();
    if (!loggedInUser) return;
    socketAPI.emit("createPath", loggedInUser?._id);
    socketAPI.on("onlineUsers", setOnlineUsersMap);

    const handleNewGroup = (group) => {
      setChats(prev => {
        if (prev.some(c => c.id === group._id)) return prev;
        const newGroupChat = {
          id: group._id, name: group.name, isGroup: true,
          members: group.members, admin: group.admin,
          lastMessage: "Group chat", time: "", unread: 0,
          avatar: group.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`,
        };
        return [newGroupChat, ...prev];
      });
    };
    socketAPI.on("newGroup", handleNewGroup);

    return () => { 
      socketAPI.off("onlineUsers"); 
      socketAPI.off("newGroup", handleNewGroup);
      if (loggedInUser) socketAPI.emit("destroyPath", loggedInUser?._id); 
    };
  }, [navigate, loggedInUser, fetchChats]);

  /* ═════════════════════ CREATE GROUP ═════════════════════ */
  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast.error("Group name is required"); return; }
    if (groupMemberIds.length === 0) { toast.error("Add at least one member"); return; }
    setIsCreatingGroup(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("memberIds", JSON.stringify(groupMemberIds));
    if (groupAvatarFile) formData.append("avatar", groupAvatarFile);
    try {
      const res = await fetch("/api/groups", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Group "${data.name}" created!`);
        setShowCreateGroup(false);
        setGroupName(""); setGroupMemberIds([]); setGroupAvatarFile(null);
        socketAPI.emit("newGroup", data);
        fetchChats();
      } else { toast.error(data.error || "Failed to create group"); }
    } catch { toast.error("Error creating group"); }
    setIsCreatingGroup(false);
  };

  /* ═════════════════════ PROFILE UPDATE ═════════════════════ */
  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setIsUpdating(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", editName);
    if (editAvatar) formData.append("avatar", editAvatar);
    try {
      const res = await fetch("/api/users/profile", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...loggedInUser, name: data.name, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updated));
        setLoggedInUser(updated); setShowEditModal(false);
        toast.success("Profile updated!");
      } else { toast.error(data.message || "Failed to update"); }
    } catch { toast.error("Error updating profile"); }
    finally { setIsUpdating(false); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTypingEvent = (e) => {
    const val = e.target.value || "";
    setMessage(val);

    // Mention logic for groups
    if (selectedChat?.isGroup) {
      const cursorPosition = e.target.selectionStart || val.length;
      const textBeforeCursor = val.slice(0, cursorPosition);
      const lastAtSymbolIdx = textBeforeCursor.lastIndexOf("@");
      
      if (lastAtSymbolIdx !== -1) {
        const isPrecededBySpace = lastAtSymbolIdx === 0 || textBeforeCursor[lastAtSymbolIdx - 1] === " ";
        if (isPrecededBySpace) {
          const mentionQuery = textBeforeCursor.slice(lastAtSymbolIdx + 1);
          if (!mentionQuery.includes(" ")) {
            setMentionFilter(mentionQuery);
            setShowMentionPopup(true);
          } else {
            setShowMentionPopup(false);
          }
        } else {
          setShowMentionPopup(false);
        }
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }

    if (selectedChat && loggedInUser) {
      socketAPI.emit("typing", { receiverId: selectedChat.id, userId: loggedInUser?._id, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() =>
        socketAPI.emit("typing", { receiverId: selectedChat.id, userId: loggedInUser?._id, isTyping: false }), 2000);
    }
  };

  const handleInsertMention = (member) => {
    const textarea = document.querySelector("textarea");
    const safeMessage = message || "";
    const cursorPosition = textarea ? textarea.selectionStart : safeMessage.length;
    const textBeforeCursor = safeMessage.slice(0, cursorPosition);
    const lastAtSymbolIdx = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtSymbolIdx !== -1) {
      const beforeAt = safeMessage.slice(0, lastAtSymbolIdx);
      const afterCursor = safeMessage.slice(cursorPosition);
      const newText = `${beforeAt}@${member.name} ${afterCursor}`;
      setMessage(newText);
      setShowMentionPopup(false);
      setMentionFilter("");
      
      setTimeout(() => {
        if (textarea) {
            textarea.focus();
            const newPos = beforeAt.length + member.name.length + 2;
            textarea.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  /* ═════════════════════ SEND MESSAGE ═════════════════════ */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedChat) return;
    const token = localStorage.getItem("token");

    if (editingMessageId) {
      try {
        const res = await fetch(`/api/messages/${editingMessageId}`, {
          method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: message }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => prev.map((m) => m._id === editingMessageId ? data : m));
          socketAPI.emit("send", { ...data, receiverId: selectedChat.id, isEdit: true });
          setEditingMessageId(null); setMessage("");
        } else { toast.error("Failed to edit"); }
      } catch { toast.error("Error editing"); }
      return;
    }

    const tempId = Date.now().toString();
    const senderInfo = { _id: loggedInUser._id, name: loggedInUser.name, avatar: loggedInUser.avatar };
    const optimisticMsg = {
      _id: tempId, text: message, image: imagePreview,
      senderId: selectedChat.isGroup ? senderInfo : loggedInUser._id,
      createdAt: new Date().toISOString(), status: "sending",
      replyToText: replyingTo?.text, replyToSender: replyingTo?.senderName,
      groupId: selectedChat.isGroup ? selectedChat.id : null,
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const currentMessage = message; const currentImage = selectedImage; const currentReply = replyingTo;
    setMessage(""); setSelectedImage(null); setImagePreview(null); setShowEmojiPicker(false); setReplyingTo(null);

    const formData = new FormData();
    if (currentMessage) formData.append("text", currentMessage);
    if (currentImage) formData.append("image", currentImage);
    if (currentReply) {
      formData.append("replyToId", currentReply._id);
      formData.append("replyToText", currentReply.text || "");
      formData.append("replyToSender", currentReply.senderName || "");
    }

    try {
      const url = selectedChat.isGroup
        ? `/api/groups/${selectedChat.id}/messages`
        : `/api/messages/send/${selectedChat.id}`;
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      setMessages((prev) => prev.map((m) => m._id === tempId ? { ...data, status: "sent" } : m));
      socketAPI.emit("send", { ...data, receiverId: selectedChat.id, groupId: selectedChat.isGroup ? selectedChat.id : null });
    } catch (err) {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    toast.success("Logged out"); navigate("/login");
  };

  const currentPinned = pinnedMessage || messages.find((m) => m.isPinned);

  /* ═════════════════════ RENDER ═════════════════════ */
  return (
    <div className="flex h-screen bg-base-200 overflow-hidden text-base-content">

      {/* ══ SIDEBAR ══ */}
      <div className={`w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 ${selectedChat ? "hidden md:flex" : "flex"}`}>

        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
              <img src={loggedInUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`} alt="me" className="rounded-full object-cover w-full h-full" />
            </div>
            <span className="font-semibold">{loggedInUser?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-base-content/60">
            {/* New Group Button */}
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="New Group"
            >
              <BsPeopleFill size={18} />
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setShowProfileMenu(v => !v)} className="p-2 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <BsThreeDotsVertical size={18} />
              </button>
              {showProfileMenu && (
                <ul className="absolute right-0 z-50 menu p-2 shadow-lg bg-base-100 rounded-2xl w-40 border border-base-300 mt-2 animate-slide-up origin-top-right">
                  <li><a onClick={() => { setEditName(loggedInUser?.name || ""); setShowEditModal(true); setShowProfileMenu(false); }} className="active:scale-95 transition-transform">Edit Profile</a></li>
                  <li><a onClick={handleLogout} className="text-error active:scale-95 transition-transform">Logout</a></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-base-300">
          <div className="relative">
            <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
            <div
              key={chat.id} onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200/50 transition-all border-b border-base-200/50 ${selectedChat?.id === chat.id ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
            >
              <div className="avatar">
                <div className={`w-12 rounded-full relative ${selectedChat?.id === chat.id ? "ring ring-primary ring-offset-base-100 ring-offset-2" : ""}`}>
                  <img src={chat.avatar} alt={chat.name} />
                  {chat.isGroup && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full p-0.5">
                      <BsPeopleFill size={10} />
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`font-semibold truncate ${selectedChat?.id === chat.id ? "text-primary" : ""}`}>{chat.name}</h3>
                  <span className="text-xs text-base-content/50">{chat.time}</span>
                </div>
                <p className="text-sm text-base-content/60 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN CHAT AREA ══ */}
      <div
        className={`flex-1 flex flex-col bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center ${!selectedChat ? "hidden md:flex" : "flex"}`}
        style={{ backgroundColor: "#efeae2", backgroundBlendMode: "overlay" }}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center gap-3 bg-base-100 border-b border-base-300 shadow-sm z-20">
              <button className="md:hidden p-2 -ml-2 text-base-content/60 hover:text-primary" onClick={() => setSelectedChat(null)}>
                <BsArrowLeft size={24} />
              </button>
              <div className="avatar">
                <div className="w-10 rounded-full"><img src={selectedChat.avatar} alt={selectedChat.name} /></div>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold flex items-center gap-1.5">
                  {selectedChat.name}
                  {selectedChat.isGroup && <BsPeopleFill size={14} className="text-primary" />}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {selectedChat.isGroup ? (
                    <span className="text-xs text-base-content/60">{selectedChat.members?.length} members</span>
                  ) : onlineUsersMap[selectedChat.id] ? (
                    <><span className="w-2 h-2 rounded-full bg-success"></span><span className="text-xs text-success font-medium">Online</span></>
                  ) : (
                    <span className="text-xs text-base-content/60">Offline</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 text-base-content/60 items-center">
                <button onClick={() => { setShowMsgSearch(v => !v); setMsgSearchQuery(""); setMsgSearchIndex(0); }}
                  className={`p-2 hover:text-primary rounded-lg transition-colors ${showMsgSearch ? "text-primary bg-primary/10" : ""}`}>
                  <BsSearch size={18} />
                </button>
                <div className="relative" ref={headerMenuRef}>
                  <button onClick={() => setShowHeaderMenu(v => !v)}
                    className={`p-2 hover:text-primary rounded-lg transition-colors ${showHeaderMenu ? "text-primary bg-primary/10" : ""}`}>
                    <BsThreeDotsVertical size={18} />
                  </button>
                  {showHeaderMenu && (
                    <ul className="absolute right-0 top-full mt-1 z-[200] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-300 animate-slide-up origin-top-right">
                      <li><a onClick={() => { setShowMsgSearch(true); setShowHeaderMenu(false); }} className="py-2.5 active:scale-95 transition-transform">🔍 Search Messages</a></li>
                      <li><a onClick={() => { setSelectMode(true); setSelectedMessageIds([]); setShowHeaderMenu(false); }} className="py-2.5 active:scale-95 transition-transform">☑️ Select Messages</a></li>
                      {currentPinned && (
                        <li><a onClick={() => { setShowPinnedBanner(true); setShowHeaderMenu(false); document.getElementById(`msg-${currentPinned._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="py-2.5 active:scale-95 transition-transform">📌 Pinned Message</a></li>
                      )}
                      <div className="divider my-1"></div>
                      <li>
                        <a onClick={() => { 
                          if (messages.length === 0) { setShowHeaderMenu(false); return; }
                          setClearedMessagesBackup([...messages]); 
                          setMessages([]); 
                          setShowHeaderMenu(false); 
                          setShowClearUndoBanner(true);
                          if (clearUndoTimeoutRef.current) clearTimeout(clearUndoTimeoutRef.current);
                          clearUndoTimeoutRef.current = setTimeout(async () => {
                            setShowClearUndoBanner(false);
                            setClearedMessagesBackup(null);
                            try {
                              const token = localStorage.getItem("token");
                              await fetch(`/api/messages/clear/${selectedChat.id}`, { 
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                            } catch (e) { console.error("Error clearing chat from backend", e); }
                          }, 4000);
                        }} className="text-error py-2.5 active:scale-95 transition-transform">🗑️ Clear Chat</a>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* In-chat Search Bar */}
            {showMsgSearch && (
              <div className="flex items-center gap-2 px-4 py-2 bg-base-100 border-b border-base-300">
                <div className="flex-1 relative">
                  <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input autoFocus type="text" value={msgSearchQuery}
                    onChange={(e) => { setMsgSearchQuery(e.target.value); setMsgSearchIndex(0); }}
                    placeholder="Search in this chat…"
                    className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
                    onKeyDown={(e) => {
                      if (!msgSearchQuery.trim()) return;
                      const matches = messages.filter(m => m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase()));
                      if (matches.length === 0) return;
                      let nextIdx = msgSearchIndex;
                      if (e.key === "Enter" || e.key === "ArrowDown") nextIdx = (msgSearchIndex + 1) % matches.length;
                      else if (e.key === "ArrowUp") nextIdx = (msgSearchIndex - 1 + matches.length) % matches.length;
                      setMsgSearchIndex(nextIdx);
                      const el = document.getElementById(`msg-${matches[nextIdx]._id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      el?.classList.add("ring-2", "ring-primary", "rounded-xl");
                      setTimeout(() => el?.classList.remove("ring-2", "ring-primary", "rounded-xl"), 1500);
                    }}
                  />
                </div>
                {msgSearchQuery.trim() && (
                  <span className="text-xs text-base-content/50 whitespace-nowrap">
                    {(() => { const c = messages.filter(m => m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase())).length; return c > 0 ? `${msgSearchIndex + 1}/${c}` : "0 results"; })()}
                  </span>
                )}
                <button onClick={() => { setShowMsgSearch(false); setMsgSearchQuery(""); }} className="btn btn-ghost btn-sm btn-circle"><BsX size={18} /></button>
              </div>
            )}

            {/* Pinned Banner */}
            {currentPinned && showPinnedBanner && !currentPinned.isDeletedForEveryone && (
              <div className="flex items-center gap-3 px-4 py-2 bg-base-100/90 border-b border-base-300 cursor-pointer hover:bg-base-200/50 animate-slide-up shadow-sm"
                onClick={() => document.getElementById(`msg-${currentPinned._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                <BsPinAngleFill className="text-primary" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">Pinned Message</p>
                  <p className="text-xs text-base-content/70 truncate">{currentPinned.text || "📷 Image"}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowPinnedBanner(false); }} className="text-base-content/40 hover:text-base-content/70"><BsX size={18} /></button>
              </div>
            )}

            {/* Select Toolbar */}
            {selectMode && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-content">
                <div className="flex items-center gap-2">
                  <button onClick={cancelSelectMode}><BsX size={22} /></button>
                  <span className="font-semibold">{selectedMessageIds.length} selected</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setForwardMessage("__multi__"); setShowForwardModal(true); }} className="btn btn-sm btn-ghost text-primary-content"><BsForward size={18} /></button>
                  <button onClick={deleteSelectedMessages} className="btn btn-sm btn-ghost text-primary-content"><BsTrash size={18} /></button>
                </div>
              </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
                  <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center shadow-sm border border-base-300">
                    <BsEmojiSmile size={32} className="text-primary/50" />
                  </div>
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Say hello to {selectedChat.name}!</p>
                </div>
              ) : (
                messages
                  .filter(msg => !msg.deletedFor?.includes(loggedInUser?._id))
                  .map((msg, idx, filteredMessages) => {
                  // For group chats sender is a populated object; for DM it's just an ID string
                  const senderId = selectedChat.isGroup ? msg.senderId?._id : msg.senderId;
                  const isMe = senderId === loggedInUser?._id || (typeof msg.senderId === 'object' && msg.senderId?._id === loggedInUser?._id);
                  const senderName = selectedChat.isGroup ? (msg.senderId?.name || "Member") : (isMe ? loggedInUser.name : selectedChat.name);
                  const senderAvatar = selectedChat.isGroup ? (msg.senderId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`) : (isMe ? loggedInUser?.avatar : selectedChat.avatar);

                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const isTombstone = msg.isDeletedForEveryone;
                  const isSelected = selectedMessageIds.includes(msg._id);
                  const isSearchMatch = msgSearchQuery.trim() && msg.text?.toLowerCase().includes(msgSearchQuery.toLowerCase());

                  // Group reactions by emoji
                  const reactionMap = {};
                  (msg.reactions || []).forEach(r => {
                    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, isMine: false };
                    reactionMap[r.emoji].count++;
                    if (r.userId === loggedInUser?._id || r.userId?.toString() === loggedInUser?._id) reactionMap[r.emoji].isMine = true;
                  });

                  // Show separator if day changes
                  const prevMsg = filteredMessages[idx - 1];
                  const showDateSep = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(prevMsg?.createdAt).toDateString();

                  return (
                    <React.Fragment key={msg._id}>
                      {showDateSep && (
                        <div className="flex justify-center my-3">
                          <span className="text-xs bg-base-100/80 rounded-full px-3 py-1 text-base-content/50 shadow-sm">
                            {new Date(msg.createdAt).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}

                      <div
                        id={`msg-${msg._id}`}
                        className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"} ${isSelected ? "opacity-75" : ""} ${isSearchMatch ? "ring-2 ring-primary/50 rounded-2xl" : ""} transition-all`}
                        onContextMenu={(e) => { if (selectMode) { e.preventDefault(); return; } handleContextMenu(e, msg, isMe); }}
                        onDoubleClick={(e) => { if (selectMode) { toggleSelectMessage(msg._id); return; } handleContextMenu(e, msg, isMe); }}
                        onClick={() => { if (selectMode) toggleSelectMessage(msg._id); }}
                        onMouseEnter={() => { if (!isTombstone && !selectMode) { if (reactionTimeout.current) clearTimeout(reactionTimeout.current); setHoveredMsgId(msg._id); } }}
                        onMouseLeave={() => { reactionTimeout.current = setTimeout(() => setHoveredMsgId(null), 300); }}
                        onTouchStart={(e) => {
                          if (selectMode) return;
                          e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
                          e.currentTarget.dataset.touchStartTime = Date.now();
                        }}
                        onTouchEnd={(e) => {
                          if (selectMode) return;
                          const startX = parseFloat(e.currentTarget.dataset.touchStartX);
                          const endX = e.changedTouches[0].clientX;
                          const elapsed = Date.now() - parseFloat(e.currentTarget.dataset.touchStartTime);
                          if (elapsed > 500) {
                            const t = e.changedTouches[0];
                            handleContextMenu({ pageX: t.pageX, pageY: t.pageY, preventDefault: () => {}, stopPropagation: () => {} }, msg, isMe);
                          } else if (endX - startX > 60) {
                            setReplyingTo({ _id: msg._id, text: msg.text, image: msg.image, senderName });
                          }
                        }}
                      >
                        {/* Select checkbox */}
                        {selectMode && (
                          <div className="flex items-center self-center px-1">
                            {isSelected ? <BsCheckCircleFill className="text-primary" size={20} /> : <BsCheckCircle className="text-base-content/40" size={20} />}
                          </div>
                        )}

                        {/* Avatar — only in group chats, and only for other's messages */}
                        {selectedChat.isGroup && !isMe && (
                          <div className="flex-shrink-0 mb-1">
                            <img src={senderAvatar} alt={senderName} className="w-8 h-8 rounded-full object-cover" />
                          </div>
                        )}
                        {/* Spacer for my messages in group (no avatar on right) */}
                        {selectedChat.isGroup && isMe && <div className="w-8" />}

                        {/* Bubble container */}
                        <div className={`relative flex flex-col max-w-xs md:max-w-sm lg:max-w-md ${isMe ? "items-end" : "items-start"}`}>
                          {/* Pin indicator */}
                          {msg.isPinned && !isTombstone && (
                            <BsPinAngleFill className={`text-primary absolute -top-2 ${isMe ? "right-2" : "left-2"}`} size={11} />
                          )}

                          {/* Sender name — only in group for other people's messages */}
                          {selectedChat.isGroup && !isMe && (
                            <span className="text-[11px] font-semibold text-primary mb-0.5 pl-1">{senderName}</span>
                          )}

                          {/* The bubble itself */}
                          <div
                            className={`px-3 py-2 rounded-2xl shadow-sm text-sm relative
                              ${isMe
                                ? "bg-[#dcf8c6] text-black rounded-tr-sm"
                                : "bg-base-100 text-base-content rounded-tl-sm"
                              }
                              ${isTombstone ? "opacity-70" : ""}
                            `}
                          >
                            {isTombstone ? (
                              <span className="italic flex items-center gap-1.5 opacity-80">🚫 This message was deleted</span>
                            ) : (
                              <>
                                {/* Reply preview */}
                                {msg.replyToText && (
                                  <div className={`border-l-4 rounded-lg px-2 py-1 mb-2 text-xs cursor-pointer ${isMe ? "border-white/60 bg-white/10" : "border-primary/60 bg-primary/10"}`}>
                                    <p className={`font-semibold text-[11px] ${isMe ? "text-white/80" : "text-primary"}`}>{msg.replyToSender}</p>
                                    <p className="truncate opacity-80">{msg.replyToText}</p>
                                  </div>
                                )}
                                {/* Image */}
                                {msg.image && <img src={msg.image} alt="Attachment" className="max-w-full rounded-xl mb-2 object-cover" />}
                                {/* Text */}
                                {msg.text && (
                                  isSearchMatch ? (
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(new RegExp(`(${msgSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-yellow-300 text-black rounded px-0.5">$1</mark>') }} />
                                  ) : <span>{msg.text}</span>
                                )}
                              </>
                            )}

                            {/* Time + tick */}
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-end"}`}>
                              {msg.isEdited && !isTombstone && (
                                <span className="text-[10px] opacity-60 flex items-center gap-0.5"><BsPencil size={8} /> Edited</span>
                              )}
                              <span className={`text-[10px] ${isMe ? "text-black/60" : "text-base-content/50"}`}>{timeStr}</span>
                              {isMe && !isTombstone && (
                                <span className="text-[1rem]">
                                  {msg.status === "sending" && <BsCheck className="text-black/40" />}
                                  {(!msg.status || msg.status === "sent") && <BsCheck className="text-black/40" />}
                                  {msg.status === "delivered" && <BsCheckAll className="text-black/40" />}
                                  {msg.status === "read" && <BsCheckAll className="text-[#53bdeb]" />}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Emoji Reactions display */}
                          {Object.keys(reactionMap).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                              {Object.entries(reactionMap).map(([emoji, { count, isMine }]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg._id, emoji)}
                                  className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-all ${isMine ? "bg-primary/20 border-primary text-primary" : "bg-base-100 border-base-300 hover:border-primary"}`}
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="font-semibold">{count}</span>}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Emoji Picker on hover */}
                          {hoveredMsgId === msg._id && !isTombstone && (
                            <div
                              className={`absolute -top-10 z-50 flex items-center gap-1 bg-base-100 border border-base-300 rounded-full px-2 py-1 shadow-xl animate-slide-up origin-bottom ${isMe ? "right-0" : "left-0"}`}
                              onMouseEnter={() => { if (reactionTimeout.current) clearTimeout(reactionTimeout.current); setHoveredMsgId(msg._id); }}
                              onMouseLeave={() => { reactionTimeout.current = setTimeout(() => setHoveredMsgId(null), 300); }}
                            >
                              {QUICK_EMOJIS.map(em => (
                                <button
                                  key={em}
                                  onClick={(e) => { e.stopPropagation(); handleReact(msg._id, em); }}
                                  className="text-lg hover:scale-125 transition-transform"
                                  title={em}
                                >{em}</button>
                              ))}
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowFullEmojiForMsg(msg._id); setHoveredMsgId(null); }}
                                className="text-base-content/50 hover:text-primary text-sm px-1"
                                title="More"
                              >+</button>
                            </div>
                          )}

                          {/* Full emoji picker */}
                          {showFullEmojiForMsg === msg._id && (
                            <div className={`absolute z-[150] top-0 animate-fade-in ${isMe ? "right-full mr-2" : "left-full ml-2"}`}>
                              <EmojiPicker height={350} width={280} onEmojiClick={(e) => { handleReact(msg._id, e.emoji); setShowFullEmojiForMsg(null); }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex items-end gap-2 mb-1">
                  <img src={selectedChat.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="bg-base-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <span className="flex items-center gap-1 h-4">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Clear Chat Undo Banner */}
            {showClearUndoBanner && (
              <div className="mx-4 my-2 p-3 bg-base-100 rounded-xl shadow-lg border border-base-300 flex items-center justify-between animate-fade-in relative z-10">
                <span className="text-sm">Messages cleared from this device.</span>
                <button 
                  onClick={() => {
                    setMessages(clearedMessagesBackup);
                    setClearedMessagesBackup(null);
                    setShowClearUndoBanner(false);
                    if (clearUndoTimeoutRef.current) clearTimeout(clearUndoTimeoutRef.current);
                  }} 
                  className="btn btn-sm btn-primary px-4 rounded-lg shadow-sm"
                >
                  Undo
                </button>
              </div>
            )}

            {/* ── Input Area ── */}
            <div className="bg-base-100 px-4 py-3 flex flex-col gap-2 border-t border-base-300">
              {/* Reply preview */}
              {replyingTo && (
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-primary bg-primary/5`}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">Replying to {replyingTo.senderName}</p>
                    <p className="text-xs text-base-content/60 truncate">{replyingTo.text || "📷 Image"}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="ml-2 text-base-content/40 hover:text-base-content/70"><BsX size={18} /></button>
                </div>
              )}
              {/* Edit indicator */}
              {editingMessageId && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border-l-4 border-warning bg-warning/5">
                  <p className="text-xs font-semibold text-warning flex items-center gap-1"><BsPencil size={10} /> Editing message</p>
                  <button onClick={() => { setEditingMessageId(null); setMessage(""); }} className="ml-2 text-base-content/40 hover:text-base-content/70"><BsX size={18} /></button>
                </div>
              )}
              {/* Image preview */}
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-base-300 shadow-sm self-start">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1">
                    <BsX size={12} />
                  </button>
                </div>
              )}
              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-[100%] left-4 mb-2 z-50 shadow-xl animate-modal-pop origin-bottom-left">
                  <EmojiPicker onEmojiClick={(emoji) => setMessage(prev => prev + emoji.emoji)} />
                </div>
              )}

              <div className="flex items-end gap-2">
                <button type="button" onClick={() => setShowEmojiPicker(v => !v)} className={`p-2 transition-colors ${showEmojiPicker ? "text-primary" : "text-base-content/50 hover:text-primary"}`}>
                  <BsEmojiSmile size={22} />
                </button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-base-content/50 hover:text-primary transition-colors">
                  <BsPaperclip size={22} />
                </button>
                <form onSubmit={handleSendMessage} className="flex-1 flex items-end gap-2 relative">
                  {/* Mention Popup */}
                  {showMentionPopup && selectedChat?.isGroup && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-xl shadow-2xl z-[150] animate-fade-in py-1">
                      {(selectedChat.members || [])
                        .filter(m => m && m._id !== loggedInUser?._id && m.name)
                        .filter(m => m.name.toLowerCase().includes((mentionFilter || "").toLowerCase()))
                        .map(member => (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 cursor-pointer transition-colors"
                            onClick={() => handleInsertMention(member)}
                          >
                            <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} className="w-8 h-8 rounded-full border border-base-300" />
                            <span className="text-sm font-medium">{member.name}</span>
                          </div>
                      ))}
                      {(selectedChat.members || [])
                        .filter(m => m && m._id !== loggedInUser?._id && m.name)
                        .filter(m => m.name.toLowerCase().includes((mentionFilter || "").toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-base-content/50 text-center">No members found</div>
                        )}
                    </div>
                  )}
                  
                  <textarea
                    value={message} onChange={handleTypingEvent}
                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : "Type a message"}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-200 min-h-[44px] max-h-32 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none py-3 text-sm"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  />
                  <button type="submit" disabled={!message.trim() && !selectedImage} className="btn btn-circle btn-primary shadow-sm disabled:bg-base-300 disabled:text-base-content/30">
                    <BsFillSendFill size={16} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-100/50 backdrop-blur-sm">
            <div className="w-64 h-64 mb-8 opacity-40 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png')] bg-no-repeat bg-contain bg-center"></div>
            <h1 className="text-3xl font-light text-base-content mb-4">ChatApp Web</h1>
            <p className="text-base-content/60 max-w-md">Send and receive messages without keeping your phone online.<br />Use ChatApp on up to 4 linked devices and 1 phone at the same time.</p>
          </div>
        )}
      </div>

      {/* ══ CREATE GROUP MODAL ══ */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl border border-base-300 overflow-hidden animate-modal-pop">
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><BsPeopleFill className="text-primary" /> New Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"><BsX size={18} /></button>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {/* Group name */}
              <div>
                <label className="text-sm font-medium text-base-content/70 mb-1 block">Group Name *</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name" className="input input-bordered w-full bg-base-200" />
              </div>
              {/* Group avatar */}
              <div>
                <label className="text-sm font-medium text-base-content/70 mb-1 block">Group Icon (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setGroupAvatarFile(e.target.files[0])} className="file-input file-input-bordered file-input-sm w-full bg-base-200" />
              </div>
              {/* Member selection */}
              <div>
                <label className="text-sm font-medium text-base-content/70 mb-2 block">Add Members *</label>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-base-300 rounded-xl p-2">
                  {allUsers.map(u => (
                    <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupMemberIds.includes(u._id)}
                        onChange={(e) => setGroupMemberIds(prev => e.target.checked ? [...prev, u._id] : prev.filter(id => id !== u._id))}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} className="w-8 h-8 rounded-full" />
                      <span className="font-medium text-sm">{u.name}</span>
                    </label>
                  ))}
                </div>
                {groupMemberIds.length > 0 && <p className="text-xs text-primary mt-1">{groupMemberIds.length} member{groupMemberIds.length > 1 ? "s" : ""} selected</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreateGroup(false)} className="btn btn-ghost flex-1 active:scale-95 transition-transform">Cancel</button>
                <button onClick={handleCreateGroup} disabled={isCreatingGroup} className="btn btn-primary flex-1 active:scale-95 transition-transform">
                  {isCreatingGroup ? "Creating…" : "Create Group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT PROFILE MODAL ══ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-base-100 w-full max-w-md rounded-2xl p-6 shadow-xl border border-base-300 animate-modal-pop">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-base-content/70 mb-2">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input input-bordered w-full bg-base-200" required />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-base-content/70 mb-2">Profile Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files[0])} className="file-input file-input-bordered file-input-primary w-full bg-base-200" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost active:scale-95 transition-transform" disabled={isUpdating}>Cancel</button>
                <button type="submit" className="btn btn-primary active:scale-95 transition-transform" disabled={isUpdating}>{isUpdating ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ CONTEXT MENU ══ */}
      {contextMenu.visible && (
        <ul
          className="menu bg-base-100 shadow-2xl rounded-2xl absolute z-[100] border border-base-300/50 w-56 p-2 animate-modal-pop origin-top-left"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {!(contextMenu.msg?.isDeletedForEveryone || contextMenu.msg?.deletedFor?.includes(loggedInUser?._id)) && (
            <>
              <li><a onClick={handleShowInfo} className="flex items-center gap-3 py-2.5 rounded-xl"><BsInfoCircle size={15} className="text-base-content/50" /> Message info</a></li>
              <li><a onClick={handleReply} className="flex items-center gap-3 py-2.5 rounded-xl"><BsReply size={15} className="text-base-content/50" /> Reply</a></li>
              <li><a onClick={handleCopy} className="flex items-center gap-3 py-2.5 rounded-xl"><BsCopy size={15} className="text-base-content/50" /> Copy</a></li>
              <li><a onClick={handleForward} className="flex items-center gap-3 py-2.5 rounded-xl"><BsForward size={15} className="text-base-content/50" /> Forward</a></li>
              <li><a onClick={handlePin} className="flex items-center gap-3 py-2.5 rounded-xl"><BsPin size={15} className="text-base-content/50" /> {contextMenu.msg?.isPinned ? "Unpin" : "Pin"}</a></li>
              <div className="divider my-1"></div>
              <li><a onClick={handleStartSelect} className="flex items-center gap-3 py-2.5 rounded-xl"><BsCheckSquare size={15} className="text-base-content/50" /> Select</a></li>
              {contextMenu.isMe && (
                <li>
                  <a onClick={() => { const msg = messages.find(m => m._id === contextMenu.messageId); if (msg && !msg.isDeletedForEveryone) { setEditingMessageId(msg._id); setMessage(msg.text); closeContextMenu(); } }}
                    className="flex items-center gap-3 py-2.5 rounded-xl">
                    <BsPencil size={15} className="text-base-content/50" /> Edit
                  </a>
                </li>
              )}
            </>
          )}
          <li><a onClick={openDeleteModal} className="flex items-center gap-3 py-2.5 rounded-xl text-error hover:bg-error/10"><BsTrash size={15} /> Delete</a></li>
        </ul>
      )}

      {/* ══ MESSAGE INFO MODAL ══ */}
      {showInfoModal && infoMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in" onClick={() => setShowInfoModal(false)}>
          <div className="bg-base-100 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-base-300 animate-modal-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Message Info</h3>
              <button onClick={() => setShowInfoModal(false)} className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"><BsX size={18} /></button>
            </div>
            <div className="bg-base-200 rounded-xl px-3 py-2 text-sm mb-4">{infoMessage.text || <em className="opacity-60">📷 Image</em>}</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">Sent</span>
                <span className="flex items-center gap-2 font-semibold"><BsCheck className="text-base-content/60" />{new Date(infoMessage.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">Delivered</span>
                <span className="flex items-center gap-2 font-semibold text-base-content/60"><BsCheckAll />{new Date(new Date(infoMessage.createdAt).getTime() + 1500).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base-content/60 font-medium">Read</span>
                <span className="flex items-center gap-2 font-semibold text-success"><BsCheckAll />{new Date(new Date(infoMessage.createdAt).getTime() + 3000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {infoMessage.isEdited && <div className="flex justify-between items-center py-2 border-t border-base-300"><span className="text-base-content/60">Edited</span><span className="badge badge-warning badge-sm">Yes</span></div>}
              {infoMessage.isPinned && <div className="flex justify-between items-center py-2 border-t border-base-300"><span className="text-base-content/60">Pinned</span><span className="badge badge-primary badge-sm">Yes</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* ══ FORWARD MODAL ══ */}
      {showForwardModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in" onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}>
          <div className="bg-base-100 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-base-300 animate-modal-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Forward to</h3>
              <button onClick={() => { setShowForwardModal(false); setForwardMessage(null); }} className="btn btn-ghost btn-sm btn-circle active:scale-90 transition-transform"><BsX size={18} /></button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {chats.map(chat => (
                <div key={chat.id} onClick={() => { if (forwardMessage === "__multi__") forwardSelectedMessages(chat); else confirmForward(chat); }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 cursor-pointer transition-colors">
                  <div className="avatar"><div className="w-10 rounded-full"><img src={chat.avatar} alt={chat.name} /></div></div>
                  <div>
                    <p className="font-medium">{chat.name}</p>
                    {chat.isGroup && <p className="text-xs text-base-content/50">Group · {chat.members?.length} members</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-base-100 w-full max-w-sm rounded-2xl shadow-2xl border border-base-300 overflow-hidden animate-modal-pop">
            <div className="px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold mb-1">Delete message?</h3>
              <p className="text-sm text-base-content/60">
                {deleteMessageId === "__multi__" ? `Delete ${selectedMessageIds.length} message(s)?` : "Choose who to delete for."}
              </p>
            </div>
            <div className="px-4 pb-5 flex flex-col gap-2">
              {(deleteIsMe || deleteMessageId === "__multi__") && (
                <button onClick={() => confirmDeleteMessage("everyone")} className="btn btn-error w-full active:scale-95 transition-transform">🗑️ Delete for everyone</button>
              )}
              <button onClick={() => confirmDeleteMessage("me")} className="btn btn-outline w-full active:scale-95 transition-transform">Delete for me</button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteMessageId(null); }} className="btn btn-ghost w-full active:scale-95 transition-transform">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
