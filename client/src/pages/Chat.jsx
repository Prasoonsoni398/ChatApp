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
} from "react-icons/bs";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { use } from "react";
import socketAPI from "../config/webSocket.js";

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
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
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });

  const handleContextMenu = (e, msgId, isMe) => {
    e.preventDefault();
    if (!isMe) return;

    const menuWidth = 140;
    let x = e.pageX;
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }

    setContextMenu({
      visible: true,
      x,
      y: e.pageY,
      messageId: msgId,
    });
  };

  const closeContextMenu = () => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    }
  };

  useEffect(() => {
    document.addEventListener("click", closeContextMenu);
    return () => document.removeEventListener("click", closeContextMenu);
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteMessage = async () => {
    const { messageId } = contextMenu;
    if (!messageId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        toast.success("Message deleted");
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting message");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          return data.map((m) => ({
            ...m,
            status: prevMap.get(m._id) || "read",
          }));
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (selectedChat) {
      fetchMessages();
    } else {
      setMessages([]);
    }

    const handleReceive = (message) => {
      if (
        selectedChat &&
        (message.senderId === selectedChat.id ||
          message.receiverId === selectedChat.id)
      ) {
        setMessages((prev) => {
          if (message.isEdit) {
            return prev.map((m) => (m._id === message._id ? message : m));
          }
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleTyping = (data) => {
      if (selectedChat && data.userId === selectedChat.id) {
        setOtherUserTyping(data.isTyping);
      }
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", handleTyping);

    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", handleTyping);
      setOtherUserTyping(false);
    };
  }, [selectedChat]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      const loggedInUserStr = localStorage.getItem("user");
      const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;

      // Filter out the logged-in user and map to chat structure
      const formattedUsers = data
        .filter((user) => user._id !== loggedInUser?._id)
        .map((user) => ({
          id: user._id,
          name: user.name,
          lastMessage: "Tap to start chatting",
          time: "",
          unread: 0,
          avatar:
            user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        }));
      setChats(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load recent chats");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to access chat");
      navigate("/login");
      return;
    }

    fetchUsers();

    if (!loggedInUser) return;

    socketAPI.emit("createPath", loggedInUser._id);

    socketAPI.on("onlineUsers", (onlineUsers) => {
      console.log("Online Users currently connected:", onlineUsers);
      setOnlineUsersMap(onlineUsers);
    });

    return () => {
      socketAPI.off("onlineUsers");
      socketAPI.emit("destroyPath", loggedInUser._id);
    };
  }, [navigate, loggedInUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", editName);
    if (editAvatar) {
      formData.append("avatar", editAvatar);
    }

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");

        // Update local storage and state
        const updatedUser = {
          ...loggedInUser,
          name: data.name,
          avatar: data.avatar,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser);

        setShowEditModal(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypingEvent = (e) => {
    setMessage(e.target.value);

    if (selectedChat && loggedInUser) {
      socketAPI.emit("typing", {
        receiverId: selectedChat.id,
        userId: loggedInUser._id,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketAPI.emit("typing", {
          receiverId: selectedChat.id,
          userId: loggedInUser._id,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedChat) return;

    const token = localStorage.getItem("token");

    if (editingMessageId) {
      try {
        const res = await fetch(`/api/messages/${editingMessageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: message }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) =>
            prev.map((m) => (m._id === editingMessageId ? data : m)),
          );
          socketAPI.emit("send", {
            ...data,
            receiverId: selectedChat.id,
            isEdit: true,
          });
          setEditingMessageId(null);
          setMessage("");
        } else {
          toast.error("Failed to edit");
        }
      } catch (err) {
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
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const currentMessage = message;
    const currentImage = selectedImage;

    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    setShowEmojiPicker(false);

    try {
      const formData = new FormData();
      if (currentMessage) formData.append("text", currentMessage);
      if (currentImage) formData.append("image", currentImage);

      const res = await fetch(`/api/messages/send/${selectedChat.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m)),
      );

      socketAPI.emit("send", {
        ...data,
        receiverId: selectedChat.id,
      });

      // Simulate WhatsApp delivery & read receipts
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data._id ? { ...m, status: "delivered" } : m,
          ),
        );
      }, 1500);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m._id === data._id ? { ...m, status: "read" } : m)),
        );
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

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden text-base-content">
      {/* Sidebar */}
      <div
        className={`w-full md:w-88.5 lg:w-90 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 ${selectedChat ? "hidden md:flex" : "flex"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
              <img
                src={
                  loggedInUser?.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"
                }
                alt="User avatar"
                className="rounded-full object-cover w-full h-full"
              />
            </div>
            <div className="text-base-content font-semibold">
              {loggedInUser.name}
            </div>
          </div>
          <div className="flex gap-4 text-base-content/60">
            <div className="relative" ref={profileMenuRef}>
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                role="button"
                className="hover:text-primary transition-colors cursor-pointer p-1"
              >
                <BsThreeDotsVertical size={20} />
              </div>
              {showProfileMenu && (
                <ul className="absolute right-0 z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-40 text-base-content border border-base-300 mt-2">
                  <li>
                    <a
                      onClick={() => {
                        setEditName(loggedInUser?.name || "");
                        setShowEditModal(true);
                        setShowProfileMenu(false);
                      }}
                    >
                      Edit Profile
                    </a>
                  </li>
                  <li>
                    <a onClick={handleLogout} className="text-error">
                      Logout
                    </a>
                  </li>
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
              placeholder="Search or start new chat"
              className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200/50 transition-colors border-b border-base-200/50 ${selectedChat?.id === chat.id ? "bg-base-200" : ""}`}
            >
              <div className="avatar">
                <div className="w-12 rounded-full">
                  <img src={chat.avatar} alt={chat.name} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold truncate">{chat.name}</h3>
                  <span
                    className={`text-xs ${chat.unread ? "text-primary font-medium" : "text-base-content/50"}`}
                  >
                    {chat.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-base-content/60 truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="badge badge-primary badge-sm rounded-full w-5 h-5 flex items-center justify-center p-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center ${!selectedChat ? "hidden md:flex" : "flex"}`}
        style={{ backgroundColor: "#efeae2", backgroundBlendMode: "overlay" }}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center gap-3 bg-base-100 border-b border-base-300 shadow-sm z-10">
              <button
                className="md:hidden p-2 -ml-2 text-base-content/60 hover:text-primary"
                onClick={() => setSelectedChat(null)}
              >
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
                      <span className="text-xs text-success font-medium">
                        Online
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-base-content/60 font-medium">
                      Offline
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-base-content/60">
                <button className="hover:text-primary">
                  <BsSearch size={20} />
                </button>
                <button className="hover:text-primary">
                  <BsThreeDotsVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
                  <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center mb-2 shadow-sm border border-base-300">
                    <BsEmojiSmile size={32} className="text-primary/50" />
                  </div>
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Say hello to {selectedChat.name}!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === loggedInUser?._id;
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  );
                  return (
                    <div
                      key={msg._id}
                      className={`chat ${isMe ? "chat-sender" : "chat-receiver"}`}
                      onContextMenu={(e) => handleContextMenu(e, msg._id, isMe)}
                    >
                      <div className="chat-avatar avatar">
                        <div className="size-10 rounded-full">
                          <img
                            src={
                              isMe
                                ? loggedInUser?.avatar ||
                                  "https://api.dicebear.com/7.x/avataaars/svg?seed=Me"
                                : selectedChat.avatar
                            }
                            alt="avatar"
                          />
                        </div>
                      </div>
                      <div className="chat-header text-base-content">
                        {isMe ? loggedInUser?.name : selectedChat.name}
                        <time className="text-base-content/50 ml-1.5">
                          {timeStr}
                        </time>
                      </div>
                      <div className="chat-bubble">
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Attachment"
                            className="max-w-xs rounded-xl mb-2 object-cover"
                          />
                        )}
                        {msg.text && <span>{msg.text}</span>}
                        {msg.isEdited && (
                          <span className="text-[10px] opacity-70 ml-2 block text-right italic">
                            (edited)
                          </span>
                        )}
                      </div>
                      <div className="chat-footer flex items-center mt-1">
                        {isMe && (
                          <div className="text-[1.2rem]">
                            {msg.status === "sending" && (
                              <BsCheck className="text-base-content/40" />
                            )}
                            {msg.status === "sent" && (
                              <BsCheck className="text-base-content/60" />
                            )}
                            {msg.status === "delivered" && (
                              <BsCheckAll className="text-base-content/60" />
                            )}
                            {(!msg.status || msg.status === "read") && (
                              <BsCheckAll className="text-success" />
                            )}
                          </div>
                        )}
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
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative min-h-16 bg-base-100 px-4 py-3 flex flex-col justify-end border-t border-base-300">
              {imagePreview && (
                <div className="mb-3 relative w-32 h-32 self-start rounded-xl overflow-hidden border border-base-300 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-[100%] left-4 mb-2 z-50 shadow-xl">
                  <EmojiPicker
                    onEmojiClick={(emoji) =>
                      setMessage((prev) => prev + emoji.emoji)
                    }
                  />
                </div>
              )}

              <div className="flex items-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 transition-colors ${showEmojiPicker ? "text-primary" : "text-base-content/50 hover:text-primary"}`}
                >
                  <BsEmojiSmile size={24} />
                </button>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-base-content/50 hover:text-primary transition-colors"
                >
                  <BsPaperclip size={24} />
                </button>

                <form
                  onSubmit={handleSendMessage}
                  className="flex-1 flex items-end gap-2"
                >
                  <textarea
                    value={message}
                    onChange={handleTypingEvent}
                    placeholder="Type a message"
                    className="textarea textarea-bordered w-full rounded-xl bg-base-200 min-h-[44px] max-h-32 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none py-3"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() && !selectedImage}
                    className="btn btn-circle btn-primary shadow-sm disabled:bg-base-300 disabled:text-base-content/30"
                  >
                    <BsFillSendFill size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-100/50 backdrop-blur-sm">
            <div className="w-64 h-64 mb-8 opacity-50 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/y5jZqw0hT0Q.png')] bg-no-repeat bg-contain bg-center"></div>
            <h1 className="text-3xl font-light text-base-content mb-4">
              ChatApp Web
            </h1>
            <p className="text-base-content/60 max-w-md">
              Send and receive messages without keeping your phone online.
              <br />
              Use ChatApp on up to 4 linked devices and 1 phone at the same
              time.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-base-100 w-full max-w-md rounded-2xl p-6 shadow-xl border border-base-300">
            <h2 className="text-2xl font-bold mb-6 text-base-content">
              Edit Profile
            </h2>

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input input-bordered w-full bg-base-200"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Profile Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditAvatar(e.target.files[0])}
                  className="file-input file-input-bordered file-input-primary w-full bg-base-200"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-ghost"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Context Menu for Delete */}
      {contextMenu.visible && (
        <ul
          className="menu bg-base-100 shadow-xl rounded-box absolute z-[100] border border-base-300 w-32 p-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <li>
            <a
              onClick={() => {
                const msg = messages.find(
                  (m) => m._id === contextMenu.messageId,
                );
                if (msg) {
                  setEditingMessageId(msg._id);
                  setMessage(msg.text);
                  closeContextMenu();
                }
              }}
              className="font-medium"
            >
              Edit
            </a>
          </li>
          <li>
            <a onClick={handleDeleteMessage} className="text-error font-medium">
              Delete
            </a>
          </li>
        </ul>
      )}
    </div>
  );
};

export default Chat;
