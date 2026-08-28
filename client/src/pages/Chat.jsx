import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsSearch,
  BsThreeDotsVertical,
  BsEmojiSmile,
  BsPaperclip,
  BsFillSendFill,
  BsArrowLeft,
  BsCheck,
  BsCheckAll,
  BsInfoCircle,
  BsReply,
  BsCopy,
  BsForward,
  BsPin,
  BsPinAngleFill,
  BsCheckSquare,
  BsTrash,
  BsX,
  BsCheckCircle,
  BsCheckCircleFill,
  BsPencil,
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import socketAPI from "../config/webSocket.js";

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);

  const [chats, setChats] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null,
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(loggedInUser?.name || "");
  const [editAvatar, setEditAvatar] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [onlineUsersMap, setOnlineUsersMap] = useState({});
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    isMe: false,
    text: "",
    msg: null,
  });

  // Feature modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);

  // Reply feature
  const [replyingTo, setReplyingTo] = useState(null); // { _id, text, senderName }

  // Pin feature
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);

  // Select feature
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // In-chat message search
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchIndex, setMsgSearchIndex] = useState(0);

  // Chat header menu (three dots)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);

  // Track isMe for delete modal (context can be cleared before modal renders)
  const [deleteIsMe, setDeleteIsMe] = useState(false);

  /* ─── Context Menu ─── */
  const handleContextMenu = (e, msg, isMe) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 210;
    let x = e.pageX;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    let y = e.pageY;
    if (y + 320 > window.innerHeight) y = window.innerHeight - 320 - 10;
    setContextMenu({ visible: true, x, y, messageId: msg._id, isMe, text: msg.text, msg });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null, isMe: false, text: "", msg: null });
  };

  useEffect(() => {
    const handler = (e) => {
      if (contextMenu.visible) closeContextMenu();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─── Message Info ─── */
  const handleShowInfo = () => {
    setInfoMessage(contextMenu.msg);
    setShowInfoModal(true);
    closeContextMenu();
  };

  /* ─── Reply ─── */
  const handleReply = () => {
    const msg = contextMenu.msg;
    const senderName = contextMenu.isMe ? "You" : selectedChat?.name;
    setReplyingTo({ _id: msg._id, text: msg.text, image: msg.image, senderName });
    closeContextMenu();
  };

  /* ─── Copy ─── */
  const handleCopy = () => {
    if (contextMenu.text) {
      navigator.clipboard.writeText(contextMenu.text);
      toast.success("Message copied!");
    }
    closeContextMenu();
  };

  /* ─── Forward ─── */
  const handleForward = () => {
    setForwardMessage(contextMenu.msg);
    setShowForwardModal(true);
    closeContextMenu();
  };

  const confirmForward = async (targetChat) => {
    if (!forwardMessage || !targetChat) return;
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      if (forwardMessage.text) formData.append("text", `↗ Forwarded: ${forwardMessage.text}`);
      const res = await fetch(`/api/messages/send/${targetChat.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Forwarded to ${targetChat.name}`);
        if (selectedChat?.id === targetChat.id) {
          setMessages((prev) => [...prev, { ...data, status: "sent" }]);
          socketAPI.emit("send", { ...data, receiverId: targetChat.id });
        }
      } else {
        toast.error("Failed to forward");
      }
    } catch (err) {
      toast.error("Error forwarding message");
    }
    setShowForwardModal(false);
    setForwardMessage(null);
  };

  /* ─── Pin ─── */
  const handlePin = async () => {
    const msgId = contextMenu.messageId;
    const token = localStorage.getItem("token");
    closeContextMenu();
    try {
      const res = await fetch(`/api/messages/pin/${msgId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, isPinned: data.isPinned } : { ...m, isPinned: false }));
        const msg = messages.find((m) => m._id === msgId);
        if (data.isPinned) {
          setPinnedMessage({ ...msg, isPinned: true });
          setShowPinnedBanner(true);
          toast.success("Message pinned");
        } else {
          setPinnedMessage(null);
          toast("Message unpinned");
        }
      }
    } catch (err) {
      toast.error("Error pinning message");
    }
  };

  /* ─── Select ─── */
  const handleStartSelect = () => {
    setSelectMode(true);
    setSelectedMessageIds([contextMenu.messageId]);
    closeContextMenu();
  };

  const toggleSelectMessage = (msgId) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedMessageIds([]);
  };

  const deleteSelectedMessages = () => {
    if (selectedMessageIds.length === 0) return;
    setDeleteMessageId("__multi__");
    setShowDeleteModal(true);
  };

  const forwardSelectedMessages = async (targetChat) => {
    const token = localStorage.getItem("token");
    for (const msgId of selectedMessageIds) {
      const msg = messages.find((m) => m._id === msgId);
      if (!msg || msg.isDeletedForEveryone) continue;
      const formData = new FormData();
      if (msg.text) formData.append("text", `↗ Forwarded: ${msg.text}`);
      await fetch(`/api/messages/send/${targetChat.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }
    toast.success(`Forwarded ${selectedMessageIds.length} message(s) to ${targetChat.name}`);
    cancelSelectMode();
    setShowForwardModal(false);
    setForwardMessage(null);
  };

  /* ─── Delete ─── */
  const openDeleteModal = () => {
    setDeleteMessageId(contextMenu.messageId);
    setDeleteIsMe(contextMenu.isMe);  // capture before context is cleared
    setShowDeleteModal(true);
    closeContextMenu();
  };

  const confirmDeleteMessage = async (type) => {
    const isMulti = deleteMessageId === "__multi__";
    const ids = isMulti ? selectedMessageIds : [deleteMessageId];

    const token = localStorage.getItem("token");
    for (const id of ids) {
      try {
        const res = await fetch(`/api/messages/${id}?type=${type}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          if (type === "me") {
            setMessages((prev) =>
              prev.map((m) => m._id === id ? { ...m, deletedFor: [...(m.deletedFor || []), loggedInUser._id] } : m)
            );
          } else {
            setMessages((prev) =>
              prev.map((m) => m._id === id ? { ...m, isDeletedForEveryone: true, text: "", image: "" } : m)
            );
          }
        }
      } catch {}
    }
    toast.success(`Message${ids.length > 1 ? "s" : ""} deleted`);
    setShowDeleteModal(false);
    setDeleteMessageId(null);
    if (isMulti) cancelSelectMode();
  };

  /* ─── Scroll ─── */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ─── Fetch messages + socket ─── */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/messages/${selectedChat.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages((prev) => {
          const prevMap = new Map(prev.map((m) => [m._id, m.status]));
          return data.map((m) => ({ ...m, status: prevMap.get(m._id) || "read" }));
        });
        // restore pinned
        const pinned = data.find((m) => m.isPinned);
        if (pinned) { setPinnedMessage(pinned); setShowPinnedBanner(true); }
        else setPinnedMessage(null);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (selectedChat) fetchMessages();
    else { setMessages([]); setPinnedMessage(null); }

    const handleReceive = (message) => {
      if (selectedChat && (message.senderId === selectedChat.id || message.receiverId === selectedChat.id)) {
        setMessages((prev) => {
          if (message.isEdit) return prev.map((m) => (m._id === message._id ? message : m));
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleTyping = (data) => {
      if (selectedChat && data.userId === selectedChat.id) setOtherUserTyping(data.isTyping);
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", handleTyping);
    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", handleTyping);
      setOtherUserTyping(false);
    };
  }, [selectedChat]);

  /* ─── Fetch users ─── */
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      const loggedInUserStr = localStorage.getItem("user");
      const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
      const formattedUsers = data
        .filter((user) => user._id !== loggedInUser?._id)
        .map((user) => ({
          id: user._id,
          name: user.name,
          lastMessage: "Tap to start chatting",
          time: "",
          unread: 0,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        }));
      setChats(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load recent chats");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Please login to access chat"); navigate("/login"); return; }
    fetchUsers();
    if (!loggedInUser) return;
    socketAPI.emit("createPath", loggedInUser._id);
    socketAPI.on("onlineUsers", (onlineUsers) => setOnlineUsersMap(onlineUsers));
    return () => {
      socketAPI.off("onlineUsers");
      socketAPI.emit("destroyPath", loggedInUser._id);
    };
  }, [navigate, loggedInUser]);

  /* ─── Profile update ─── */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", editName);
    if (editAvatar) formData.append("avatar", editAvatar);
    try {
      const res = await fetch("/api/users/profile", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");
        const updatedUser = { ...loggedInUser, name: data.name, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser);
        setShowEditModal(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred while updating");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ─── Image select ─── */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /* ─── Typing ─── */
  const handleTypingEvent = (e) => {
    setMessage(e.target.value);
    if (selectedChat && loggedInUser) {
      socketAPI.emit("typing", { receiverId: selectedChat.id, userId: loggedInUser._id, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketAPI.emit("typing", { receiverId: selectedChat.id, userId: loggedInUser._id, isTyping: false });
      }, 2000);
    }
  };

  /* ─── Send / Edit message ─── */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedChat) return;
    const token = localStorage.getItem("token");

    if (editingMessageId) {
      try {
        const res = await fetch(`/api/messages/${editingMessageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: message }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => prev.map((m) => (m._id === editingMessageId ? data : m)));
          socketAPI.emit("send", { ...data, receiverId: selectedChat.id, isEdit: true });
          setEditingMessageId(null);
          setMessage("");
        } else {
          toast.error("Failed to edit");
        }
      } catch {
        toast.error("Error editing message");
      }
      return;
    }

    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      text: message,
      image: imagePreview,
      senderId: loggedInUser._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      replyToText: replyingTo?.text,
      replyToSender: replyingTo?.senderName,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const currentMessage = message;
    const currentImage = selectedImage;
    const currentReply = replyingTo;

    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    setShowEmojiPicker(false);
    setReplyingTo(null);

    try {
      const formData = new FormData();
      if (currentMessage) formData.append("text", currentMessage);
      if (currentImage) formData.append("image", currentImage);
      if (currentReply) {
        formData.append("replyToId", currentReply._id);
        formData.append("replyToText", currentReply.text || "");
        formData.append("replyToSender", currentReply.senderName || "");
      }

      const res = await fetch(`/api/messages/send/${selectedChat.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m)));
      socketAPI.emit("send", { ...data, receiverId: selectedChat.id });

      setTimeout(() => {
        setMessages((prev) => prev.map((m) => m._id === data._id ? { ...m, status: "delivered" } : m));
      }, 1500);
      setTimeout(() => {
        setMessages((prev) => prev.map((m) => m._id === data._id ? { ...m, status: "read" } : m));
      }, 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  /* ─── Compute pinned from messages ─── */
  const currentPinned = pinnedMessage || messages.find((m) => m.isPinned);

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden text-base-content">
      {/* ── Sidebar ── */}
      <div className={`w-full md:w-88.5 lg:w-90 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 ${selectedChat ? "hidden md:flex" : "flex"}`}>
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
              <img src={loggedInUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"} alt="User avatar" className="rounded-full object-cover w-full h-full" />
            </div>
            <div className="text-base-content font-semibold">{loggedInUser.name}</div>
          </div>
          <div className="flex gap-4 text-base-content/60">
            <div className="relative" ref={profileMenuRef}>
              <div onClick={() => setShowProfileMenu(!showProfileMenu)} role="button" className="hover:text-primary transition-colors cursor-pointer p-1">
                <BsThreeDotsVertical size={20} />
              </div>
              {showProfileMenu && (
                <ul className="absolute right-0 z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-40 text-base-content border border-base-300 mt-2">
                  <li>
                    <a onClick={() => { setEditName(loggedInUser?.name || ""); setShowEditModal(true); setShowProfileMenu(false); }}>
                      Edit Profile
                    </a>
                  </li>
                  <li><a onClick={handleLogout} className="text-error">Logout</a></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-base-300">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
              <BsSearch size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats
            .filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200/50 transition-all border-b border-base-200/50 ${
                  selectedChat?.id === chat.id
                    ? "bg-primary/10 border-l-4 border-l-primary !border-b-primary/20"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="avatar">
                  <div className={`w-12 rounded-full ${selectedChat?.id === chat.id ? "ring ring-primary ring-offset-base-100 ring-offset-2" : ""}`}>
                    <img src={chat.avatar} alt={chat.name} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold truncate ${selectedChat?.id === chat.id ? "text-primary" : ""}`}>{chat.name}</h3>
                    <span className={`text-xs ${chat.unread ? "text-primary font-medium" : "text-base-content/50"}`}>{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${selectedChat?.id === chat.id ? "text-base-content/80 font-medium" : "text-base-content/60"}`}>{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="badge badge-primary badge-sm rounded-full w-5 h-5 flex items-center justify-center p-0">{chat.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div
        className={`flex-1 flex flex-col bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center ${!selectedChat ? "hidden md:flex" : "flex"}`}
        style={{ backgroundColor: "#efeae2", backgroundBlendMode: "overlay" }}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center gap-3 bg-base-100 border-b border-base-300 shadow-sm z-10">
              <button className="md:hidden p-2 -ml-2 text-base-content/60 hover:text-primary" onClick={() => setSelectedChat(null)}>
                <BsArrowLeft size={24} />
              </button>
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={selectedChat.avatar} alt={selectedChat.name} />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{selectedChat.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {onlineUsersMap[selectedChat.id] ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      <span className="text-xs text-success font-medium">Online</span>
                    </>
                  ) : (
                    <span className="text-xs text-base-content/60 font-medium">Offline</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-base-content/60 items-center">
                {/* Search in chat */}
                <button
                  onClick={() => { setShowMsgSearch((v) => !v); setMsgSearchQuery(""); setMsgSearchIndex(0); }}
                  className={`hover:text-primary transition-colors p-1 rounded-lg ${showMsgSearch ? "text-primary bg-primary/10" : ""}`}
                >
                  <BsSearch size={20} />
                </button>
                {/* Three-dot menu */}
                <div className="relative" ref={headerMenuRef}>
                  <button
                    onClick={() => setShowHeaderMenu((v) => !v)}
                    className={`hover:text-primary transition-colors p-1 rounded-lg ${showHeaderMenu ? "text-primary bg-primary/10" : ""}`}
                  >
                    <BsThreeDotsVertical size={20} />
                  </button>
                  {showHeaderMenu && (
                    <ul className="absolute right-0 top-full mt-1 z-[200] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-300">
                      <li>
                        <a onClick={() => { setShowMsgSearch(true); setShowHeaderMenu(false); }} className="py-2.5">
                          🔍 Search Messages
                        </a>
                      </li>
                      <li>
                        <a onClick={() => { setSelectMode(true); setSelectedMessageIds([]); setShowHeaderMenu(false); }} className="py-2.5">
                          ☑️ Select Messages
                        </a>
                      </li>
                      {currentPinned && (
                        <li>
                          <a
                            onClick={() => {
                              setShowPinnedBanner(true);
                              setShowHeaderMenu(false);
                              const el = document.getElementById(`msg-${currentPinned._id}`);
                              el?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="py-2.5"
                          >
                            📌 View Pinned Message
                          </a>
                        </li>
                      )}
                      <div className="divider my-1"></div>
                      <li>
                        <a
                          onClick={() => {
                            setMessages([]);
                            setShowHeaderMenu(false);
                            toast.success("Chat cleared locally");
                          }}
                          className="text-error py-2.5"
                        >
                          🗑️ Clear Chat
                        </a>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* In-chat Message Search Bar */}
            {showMsgSearch && (
              <div className="flex items-center gap-2 px-4 py-2 bg-base-100 border-b border-base-300">
                <div className="flex-1 relative">
                  <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    autoFocus
                    type="text"
                    value={msgSearchQuery}
                    onChange={(e) => { setMsgSearchQuery(e.target.value); setMsgSearchIndex(0); }}
                    placeholder="Search in this chat…"
                    className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
                    onKeyDown={(e) => {
                      if (!msgSearchQuery.trim()) return;
                      const matches = messages
                        .map((m, i) => ({ m, i }))
                        .filter(({ m }) => m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase()));
                      if (matches.length === 0) return;
                      if (e.key === "Enter" || e.key === "ArrowDown") {
                        const nextIdx = (msgSearchIndex + 1) % matches.length;
                        setMsgSearchIndex(nextIdx);
                        const el = document.getElementById(`msg-${matches[nextIdx].m._id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                        el?.classList.add("ring-2", "ring-primary", "rounded-xl");
                        setTimeout(() => el?.classList.remove("ring-2", "ring-primary", "rounded-xl"), 1500);
                      } else if (e.key === "ArrowUp") {
                        const matches2 = messages.map((m, i) => ({ m, i })).filter(({ m }) => m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase()));
                        const prevIdx = (msgSearchIndex - 1 + matches2.length) % matches2.length;
                        setMsgSearchIndex(prevIdx);
                        const el = document.getElementById(`msg-${matches2[prevIdx].m._id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                  />
                </div>
                {msgSearchQuery.trim() && (
                  <span className="text-xs text-base-content/50 whitespace-nowrap">
                    {(() => {
                      const count = messages.filter((m) => m.text?.toLowerCase().includes(msgSearchQuery.toLowerCase())).length;
                      return count > 0 ? `${msgSearchIndex + 1}/${count}` : "0 results";
                    })()}
                  </span>
                )}
                <button onClick={() => { setShowMsgSearch(false); setMsgSearchQuery(""); }} className="btn btn-ghost btn-sm btn-circle">
                  <BsX size={18} />
                </button>
              </div>
            )}

            {/* Pinned Message Banner */}
            {currentPinned && showPinnedBanner && !currentPinned.isDeletedForEveryone && (
              <div
                className="flex items-center gap-3 px-4 py-2 bg-base-100/90 border-b border-base-300 cursor-pointer hover:bg-base-200/50 transition-colors"
                onClick={() => {
                  const el = document.getElementById(`msg-${currentPinned._id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <BsPinAngleFill className="text-primary flex-shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">Pinned Message</p>
                  <p className="text-xs text-base-content/70 truncate">{currentPinned.text || "📷 Image"}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPinnedBanner(false); }}
                  className="text-base-content/40 hover:text-base-content/70"
                >
                  <BsX size={18} />
                </button>
              </div>
            )}

            {/* Select Mode Toolbar */}
            {selectMode && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-content">
                <div className="flex items-center gap-2">
                  <button onClick={cancelSelectMode}><BsX size={22} /></button>
                  <span className="font-semibold">{selectedMessageIds.length} selected</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setForwardMessage("__multi__"); setShowForwardModal(true); }}
                    className="btn btn-sm btn-ghost text-primary-content"
                  >
                    <BsForward size={18} />
                  </button>
                  <button onClick={deleteSelectedMessages} className="btn btn-sm btn-ghost text-primary-content">
                    <BsTrash size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[72vh] text-base-content/50 gap-2">
                  <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center mb-2 shadow-sm border border-base-300">
                    <BsEmojiSmile size={32} className="text-primary/50" />
                  </div>
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Say hello to {selectedChat.name}!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === loggedInUser?._id;
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const isDeletedForMe = msg.deletedFor?.includes(loggedInUser?._id);
                  const isTombstone = msg.isDeletedForEveryone || isDeletedForMe;
                  const isSelected = selectedMessageIds.includes(msg._id);
                  const isSearchMatch = msgSearchQuery.trim() && msg.text?.toLowerCase().includes(msgSearchQuery.toLowerCase());

                  return (
                    <div
                      id={`msg-${msg._id}`}
                      key={msg._id}
                      className={`chat ${isMe ? "chat-sender" : "chat-receiver"} relative transition-all ${isSelected ? "opacity-80" : ""} ${isSearchMatch ? "ring-2 ring-primary/60 rounded-2xl" : ""}`}
                      onContextMenu={(e) => {
                        if (selectMode) return;
                        if (isTombstone) { e.preventDefault(); return; }
                        handleContextMenu(e, msg, isMe);
                      }}
                      onDoubleClick={(e) => {
                        if (selectMode) { toggleSelectMessage(msg._id); return; }
                        if (isTombstone) return;
                        handleContextMenu(e, msg, isMe);
                      }}
                      onClick={() => {
                        if (selectMode) toggleSelectMessage(msg._id);
                      }}
                      onTouchStart={(e) => {
                        if (isTombstone || selectMode) return;
                        e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
                        e.currentTarget.dataset.touchStartTime = Date.now();
                      }}
                      onTouchEnd={(e) => {
                        if (isTombstone || selectMode) return;
                        const startX = parseFloat(e.currentTarget.dataset.touchStartX);
                        const endX = e.changedTouches[0].clientX;
                        const elapsed = Date.now() - parseFloat(e.currentTarget.dataset.touchStartTime);
                        if (elapsed > 500) {
                          // long press → context menu
                          const touch = e.changedTouches[0];
                          handleContextMenu({ pageX: touch.pageX, pageY: touch.pageY, preventDefault: () => {}, stopPropagation: () => {} }, msg, isMe);
                        } else if (endX - startX > 60) {
                          // swipe right → reply
                          const senderName = isMe ? "You" : selectedChat?.name;
                          setReplyingTo({ _id: msg._id, text: msg.text, image: msg.image, senderName });
                        }
                      }}
                      style={{ cursor: selectMode ? "pointer" : "default" }}
                    >
                      {/* Select checkbox */}
                      {selectMode && (
                        <div className={`absolute ${isMe ? "right-full pr-2" : "left-full pl-2"} top-1/2 -translate-y-1/2 flex items-center`}>
                          {isSelected ? (
                            <BsCheckCircleFill className="text-primary" size={20} />
                          ) : (
                            <BsCheckCircle className="text-base-content/40" size={20} />
                          )}
                        </div>
                      )}

                      {/* Pin indicator */}
                      {msg.isPinned && !isTombstone && (
                        <div className={`absolute -top-2 ${isMe ? "right-4" : "left-16"}`}>
                          <BsPinAngleFill className="text-primary" size={12} />
                        </div>
                      )}

                      <div className="chat-avatar avatar">
                        <div className="size-10 rounded-full">
                          <img
                            src={isMe ? (loggedInUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Me") : selectedChat.avatar}
                            alt="avatar"
                          />
                        </div>
                      </div>
                      <div className="chat-header text-base-content">
                        {isMe ? loggedInUser?.name : selectedChat.name}
                        <time className="text-base-content/50 ml-1.5">{timeStr}</time>
                      </div>
                      <div className="chat-bubble">
                        {isTombstone ? (
                          <span className="italic opacity-70">🚫 This message was deleted</span>
                        ) : (
                          <>
                            {/* Reply preview */}
                            {msg.replyToText && (
                              <div className="border-l-4 border-primary/60 bg-black/10 rounded px-2 py-1 mb-2 text-xs opacity-80">
                                <p className="font-semibold text-primary/80">{msg.replyToSender}</p>
                                <p className="truncate">{msg.replyToText}</p>
                              </div>
                            )}
                            {msg.image && (
                              <img src={msg.image} alt="Attachment" className="max-w-xs rounded-xl mb-2 object-cover" />
                            )}
                            {msg.text && (
                              isSearchMatch ? (
                                <span dangerouslySetInnerHTML={{
                                  __html: msg.text.replace(
                                    new RegExp(`(${msgSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                    '<mark class="bg-yellow-300 text-black rounded px-0.5">$1</mark>'
                                  )
                                }} />
                              ) : (
                                <span>{msg.text}</span>
                              )
                            )}
                          </>
                        )}
                      </div>
                      <div className="chat-footer flex flex-col mt-1">
                        {msg.isEdited && !isTombstone && (
                          <span className="text-[10px] opacity-70 italic self-end flex items-center gap-1">
                            <BsPencil size={9} /> Edited
                          </span>
                        )}
                        <div className="flex items-center self-end">
                          {isMe && !isDeletedForMe && (
                            <div className="text-[1.2rem]">
                              {msg.status === "sending" && <BsCheck className="text-base-content/40" />}
                              {msg.status === "sent" && <BsCheck className="text-base-content/60" />}
                              {msg.status === "delivered" && <BsCheckAll className="text-base-content/60" />}
                              {(!msg.status || msg.status === "read") && <BsCheckAll className="text-success" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {otherUserTyping && (
                <div className="chat chat-receiver">
                  <div className="flex gap-2">
                    <span className="text-xs opacity-70">Typing...</span>
                    <span className="flex items-center gap-1 h-5 px-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative min-h-16 bg-base-100 px-4 py-3 flex flex-col justify-end border-t border-base-300">
              {/* Reply preview bar */}
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 bg-base-200 rounded-xl border-l-4 border-primary">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">Replying to {replyingTo.senderName}</p>
                    <p className="text-xs text-base-content/60 truncate">{replyingTo.text || "📷 Image"}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="ml-2 text-base-content/40 hover:text-base-content/70">
                    <BsX size={18} />
                  </button>
                </div>
              )}

              {/* Edit indicator */}
              {editingMessageId && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 bg-base-200 rounded-xl border-l-4 border-warning">
                  <p className="text-xs font-semibold text-warning">Editing message</p>
                  <button onClick={() => { setEditingMessageId(null); setMessage(""); }} className="ml-2 text-base-content/40 hover:text-base-content/70">
                    <BsX size={18} />
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="mb-3 relative w-32 h-32 self-start rounded-xl overflow-hidden border border-base-300 shadow-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-[100%] left-4 mb-2 z-50 shadow-xl">
                  <EmojiPicker onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)} />
                </div>
              )}

              <div className="flex items-end gap-2 w-full">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-colors ${showEmojiPicker ? "text-primary" : "text-base-content/50 hover:text-primary"}`}>
                  <BsEmojiSmile size={24} />
                </button>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-base-content/50 hover:text-primary transition-colors">
                  <BsPaperclip size={24} />
                </button>
                <form onSubmit={handleSendMessage} className="flex-1 flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={handleTypingEvent}
                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type a message"}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-200 min-h-[44px] max-h-32 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none py-3"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                    }}
                  />
                  <button type="submit" disabled={!message.trim() && !selectedImage} className="btn btn-circle btn-primary shadow-sm disabled:bg-base-300 disabled:text-base-content/30">
                    <BsFillSendFill size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-100/50 backdrop-blur-sm">
            <div className="w-64 h-64 mb-8 opacity-50 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png')] bg-no-repeat bg-contain bg-center"></div>
            <h1 className="text-3xl font-light text-base-content mb-4">ChatApp Web</h1>
            <p className="text-base-content/60 max-w-md">
              Send and receive messages without keeping your phone online.
              <br />Use ChatApp on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-base-100 w-full max-w-md rounded-2xl p-6 shadow-xl border border-base-300">
            <h2 className="text-2xl font-bold mb-6 text-base-content">Edit Profile</h2>
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
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost" disabled={isUpdating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Context Menu ── */}
      {contextMenu.visible && (
        <ul
          className="menu bg-base-100 shadow-2xl rounded-2xl absolute z-[100] border border-base-300/50 w-56 p-2 backdrop-blur-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li>
            <a onClick={handleShowInfo} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsInfoCircle size={16} className="text-base-content/60" />
              <span>Message info</span>
            </a>
          </li>
          <li>
            <a onClick={handleReply} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsReply size={16} className="text-base-content/60" />
              <span>Reply</span>
            </a>
          </li>
          <li>
            <a onClick={handleCopy} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsCopy size={16} className="text-base-content/60" />
              <span>Copy</span>
            </a>
          </li>
          <li>
            <a onClick={handleForward} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsForward size={16} className="text-base-content/60" />
              <span>Forward</span>
            </a>
          </li>
          <li>
            <a onClick={handlePin} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsPin size={16} className="text-base-content/60" />
              <span>{contextMenu.msg?.isPinned ? "Unpin" : "Pin"}</span>
            </a>
          </li>
          <div className="divider my-1"></div>
          <li>
            <a onClick={handleStartSelect} className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl">
              <BsCheckSquare size={16} className="text-base-content/60" />
              <span>Select</span>
            </a>
          </li>
          {contextMenu.isMe && (
            <li>
              <a
                onClick={() => {
                  const msg = messages.find((m) => m._id === contextMenu.messageId);
                  if (msg && !msg.isDeletedForEveryone) {
                    setEditingMessageId(msg._id);
                    setMessage(msg.text);
                    closeContextMenu();
                  }
                }}
                className="flex items-center gap-3 py-2.5 hover:bg-base-200 rounded-xl"
              >
                <BsPencil size={16} className="text-base-content/60" />
                <span>Edit</span>
              </a>
            </li>
          )}
          <li>
            <a onClick={openDeleteModal} className="flex items-center gap-3 py-2.5 hover:bg-error/10 rounded-xl text-error">
              <BsTrash size={16} />
              <span>Delete</span>
            </a>
          </li>
        </ul>
      )}

      {/* ── Message Info Modal ── */}
      {showInfoModal && infoMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-base-100 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-base-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Message Info</h3>
              <button onClick={() => setShowInfoModal(false)} className="btn btn-ghost btn-sm btn-circle"><BsX size={18} /></button>
            </div>
            <div className="chat-bubble mb-4 max-w-full w-full rounded-xl text-sm">
              {infoMessage.text || <em className="opacity-60">📷 Image</em>}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">Sent</span>
                <span className="flex items-center gap-2 font-semibold">
                  <BsCheck className="text-base-content/60" />
                  {new Date(infoMessage.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/60 font-medium">Delivered</span>
                <span className="flex items-center gap-2 font-semibold text-base-content/60">
                  <BsCheckAll />
                  {new Date(new Date(infoMessage.createdAt).getTime() + 1500).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base-content/60 font-medium">Read</span>
                <span className="flex items-center gap-2 font-semibold text-success">
                  <BsCheckAll />
                  {new Date(new Date(infoMessage.createdAt).getTime() + 3000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {infoMessage.isEdited && (
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-base-content/60 font-medium">Edited</span>
                  <span className="badge badge-warning badge-sm">Yes</span>
                </div>
              )}
              {infoMessage.isPinned && (
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-base-content/60 font-medium">Pinned</span>
                  <span className="badge badge-primary badge-sm">Yes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Forward Modal ── */}
      {showForwardModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}>
          <div className="bg-base-100 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-base-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Forward to</h3>
              <button onClick={() => { setShowForwardModal(false); setForwardMessage(null); }} className="btn btn-ghost btn-sm btn-circle"><BsX size={18} /></button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (forwardMessage === "__multi__") forwardSelectedMessages(chat);
                    else confirmForward(chat);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 cursor-pointer transition-colors"
                >
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={chat.avatar} alt={chat.name} />
                    </div>
                  </div>
                  <span className="font-medium">{chat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-base-100 w-full max-w-sm rounded-2xl shadow-xl border border-base-300 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold mb-1">Delete message?</h3>
              <p className="text-sm text-base-content/60">
                {deleteMessageId === "__multi__"
                  ? `You are about to delete ${selectedMessageIds.length} message(s).`
                  : "Choose who to delete the message for."}
              </p>
            </div>
            <div className="px-4 pb-4 flex flex-col gap-2">
              {/* Delete for everyone - only show if it's my message or multi-select */}
              {(deleteIsMe || deleteMessageId === "__multi__") && (
                <button
                  onClick={() => confirmDeleteMessage("everyone")}
                  className="btn btn-error w-full"
                >
                  🗑️ Delete for everyone
                </button>
              )}
              <button
                onClick={() => confirmDeleteMessage("me")}
                className="btn btn-outline w-full"
              >
                Delete for me
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteMessageId(null);
                }}
                className="btn btn-ghost w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
