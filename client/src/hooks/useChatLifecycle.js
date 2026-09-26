import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import * as statusService from "../services/statusService.js";
import * as userService from "../services/userService.js";
import * as groupService from "../services/groupService.js";
import socketAPI from "../config/webSocket.js";

export const useChatLifecycle = ({ state, navigate, modals }) => {
  const [statuses, setStatuses] = useState([]);
  const [isUploadingStatus, setIsUploadingStatus] = useState(false);
  const [activeStatusGroup, setActiveStatusGroup] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Online: Connection restored");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Offline: Check your internet connection");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        modals.setShowShortcutsModal((prev) => !prev);
      }
      if (e.key === "Escape" && modals.showShortcutsModal) {
        modals.setShowShortcutsModal(false);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [modals]);

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

  const handleUploadStatus = async (input) => {
    try {
      setIsUploadingStatus(true);
      let formData = input;
      if (input instanceof File) {
        formData = new FormData();
        formData.append("image", input);
      }
      await statusService.uploadStatus(formData);
      toast.success("Status uploaded!");
      fetchStatuses();
    } catch (error) {
      toast.error(error.message || "Failed to upload status");
    } finally {
      setIsUploadingStatus(false);
    }
  };

  useEffect(() => {
    if (state.selectedChat)
      sessionStorage.setItem(
        "selectedChat",
        JSON.stringify(state.selectedChat),
      );
    else sessionStorage.removeItem("selectedChat");
  }, [state.selectedChat]);

  // Mobile browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      if (state.selectedChat) {
        state.setSelectedChat(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [state.selectedChat, state.setSelectedChat]);

  // Restore draft when selected chat changes
  useEffect(() => {
    if (!state.selectedChat) return;
    try {
      const savedDraft =
        localStorage.getItem(`draft_${state.selectedChat.id}`) || "";
      state.setMessage(savedDraft);
    } catch (_e) {}
  }, [state.selectedChat?.id]);

  // Save current message as draft while typing
  useEffect(() => {
    if (!state.selectedChat) return;
    try {
      if (state.message.trim()) {
        localStorage.setItem(`draft_${state.selectedChat.id}`, state.message);
      } else {
        localStorage.removeItem(`draft_${state.selectedChat.id}`);
      }
    } catch (_e) {}
  }, [state.message, state.selectedChat?.id]);

  // Chat select handler
  const handleSelectChat = (chat) => {
    state.setSelectedChat(chat);
    state.setSelectMode(false);
    state.setSelectedMessageIds([]);
    if (chat) {
      state.setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)),
      );
      setTimeout(() => {
        const textarea = document.querySelector("textarea");
        textarea?.focus();
      }, 60);
    }
    if (chat && typeof window !== "undefined" && window.innerWidth < 768) {
      window.history.pushState({ chatOpen: true }, "");
    }
  };

  // Auto-close select mode on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && state.selectMode) {
        state.setSelectMode(false);
        state.setSelectedMessageIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectMode, state.setSelectMode, state.setSelectedMessageIds]);

  const handleUpdateContactName = (targetId, newName) => {
    if (!targetId) return;
    const targetIdStr = targetId.toString();

    state.setSelectedChat((prev) => {
      if (
        prev &&
        (prev.id?.toString() === targetIdStr ||
          prev._id?.toString() === targetIdStr)
      ) {
        return {
          ...prev,
          customName: newName,
          displayName: newName || prev.name,
        };
      }
      return prev;
    });

    state.setChats((prev) =>
      prev.map((c) =>
        c.id?.toString() === targetIdStr || c._id?.toString() === targetIdStr
          ? {
              ...c,
              customName: newName,
              displayName: newName || c.name,
            }
          : c,
      ),
    );

    state.setAllUsers?.((prev) =>
      Array.isArray(prev)
        ? prev.map((u) =>
            u._id?.toString() === targetIdStr
              ? { ...u, customName: newName, displayName: newName || u.name }
              : u,
          )
        : prev,
    );
  };

  // Click outside handlers
  useEffect(() => {
    const handler = () => {
      if (state.contextMenu.visible) {
        state.setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [state.contextMenu.visible]);

  useEffect(() => {
    const handler = (e) => {
      if (
        state.profileMenuRef.current &&
        !state.profileMenuRef.current.contains(e.target)
      )
        state.setShowProfileMenu(false);
      if (
        state.headerMenuRef.current &&
        !state.headerMenuRef.current.contains(e.target)
      )
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
  }, [state.showEmojiPicker]);

  useEffect(() => {
    state.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    const loggedInUserData = JSON.parse(localStorage.getItem("user"));
    try {
      const [users, groups] = await Promise.all([
        userService.getAllUsers(),
        groupService.getGroups(),
      ]);

      const validUsers = Array.isArray(users)
        ? users.filter((u) => u && u._id)
        : [];
      const dmChats = validUsers
        .filter((u) => u._id !== loggedInUserData?._id)
        .map((u) => ({
          id: u._id,
          name: u.name,
          customName: u.customName,
          displayName: u.displayName || u.customName || u.name,
          phone: u.phone,
          about: u.about,
          isGroup: false,
          lastMessage: "Tap to start chatting",
          time: "",
          unread: 0,
          avatar:
            u.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
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
        avatar:
          g.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}`,
      }));

      const myContacts = validUsers.filter(
        (u) => u._id !== loggedInUserData?._id,
      );
      state.setAllUsers(myContacts);
      state.setChats([...groupChats, ...dmChats]);
    } catch (_e) {
      console.error("Error fetching chats:", _e);
      toast.error("Failed to load chats");
    }
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

    const registerOnline = () => {
      if (state.loggedInUser?._id) {
        socketAPI.emit("createPath", state.loggedInUser._id);
      }
    };

    registerOnline();
    socketAPI.on("connect", registerOnline);

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
          avatar:
            group.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`,
        };
        return [newGroupChat, ...prev];
      });
    };
    socketAPI.on("newGroup", handleNewGroup);

    return () => {
      socketAPI.off("connect", registerOnline);
      socketAPI.off("newGroup", handleNewGroup);
      if (state.loggedInUser)
        socketAPI.emit("destroyPath", state.loggedInUser?._id);
    };
  }, [navigate, state.loggedInUser, fetchChats]);

  return {
    statuses,
    isUploadingStatus,
    activeStatusGroup,
    setActiveStatusGroup,
    isOnline,
    fetchStatuses,
    handleUploadStatus,
    handleSelectChat,
    handleUpdateContactName,
    fetchChats,
  };
};
