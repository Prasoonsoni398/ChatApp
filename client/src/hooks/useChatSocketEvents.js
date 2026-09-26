import { useEffect, useRef } from "react";
import * as messageService from "../services/messageService.js";
import * as groupService from "../services/groupService.js";
import socketAPI from "../config/webSocket.js";
import {
  playMessageChime,
  triggerDesktopNotification,
} from "../utils/notificationAudio.js";

/**
 * useChatSocketEvents – manages message fetching on chat switch
 * and registers stable real-time Socket.IO listeners.
 */
export const useChatSocketEvents = ({
  state,
  handleTypingReceive,
  setOtherUserTyping,
}) => {
  // Keep fresh references to avoid recreating socket listeners on every re-render
  const stateRef = useRef(state);
  stateRef.current = state;

  const selectedChatRef = useRef(state.selectedChat);
  selectedChatRef.current = state.selectedChat;

  const loggedInUserRef = useRef(state.loggedInUser);
  loggedInUserRef.current = state.loggedInUser;

  const handleTypingReceiveRef = useRef(handleTypingReceive);
  handleTypingReceiveRef.current = handleTypingReceive;

  const setOtherUserTypingRef = useRef(setOtherUserTyping);
  setOtherUserTypingRef.current = setOtherUserTyping;

  // 1. Fetch messages whenever the active chat changes
  useEffect(() => {
    const currentChat = state.selectedChat;
    const currentUser = state.loggedInUser;

    if (!currentChat) {
      state.setMessages([]);
      state.setPinnedMessage(null);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        let data;
        if (currentChat.isGroup) {
          data = await groupService.getGroupMessages(currentChat.id);
        } else {
          data = await messageService.getMessages(currentChat.id);
        }

        if (!isMounted) return;

        const currentUserId = currentUser?._id?.toString();
        const unreadSet = new Set();

        data.forEach((m) => {
          const senderIdStr = (
            typeof m.senderId === "object" ? m.senderId?._id : m.senderId
          )?.toString();
          if (senderIdStr && senderIdStr !== currentUserId && m.status !== "read") {
            unreadSet.add(m._id);
          }
        });

        // Mark unread messages as read
        unreadSet.forEach((id) => {
          const msg = data.find((m) => m._id === id);
          const senderIdStr =
            typeof msg?.senderId === "object" ? msg.senderId?._id : msg?.senderId;
          socketAPI.emit("messageStatus", {
            messageId: id,
            status: "read",
            senderId: senderIdStr,
            receiverId: currentUser?._id,
          });
        });

        state.setMessages((prev) => {
          const prevMap = new Map(prev.map((m) => [m._id, m.status]));
          return data.map((m) => ({
            ...m,
            status: unreadSet.has(m._id) ? "read" : prevMap.get(m._id) || m.status,
          }));
        });

        // Reset unread badge for current open chat
        state.setChats((prev) =>
          prev.map((c) =>
            c.id?.toString() === currentChat.id?.toString()
              ? { ...c, unread: 0 }
              : c,
          ),
        );

        const pinned = data.find((m) => m.isPinned);
        if (pinned) {
          state.setPinnedMessage(pinned);
          state.setShowPinnedBanner(true);
        } else {
          state.setPinnedMessage(null);
        }
      } catch (_e) {
        console.error("Fetch messages error:", _e);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [state.selectedChat?.id, state.selectedChat?.isGroup, state.loggedInUser?._id]);

  // 2. Stable Socket listeners setup
  useEffect(() => {
    const handleReceive = (msg) => {
      const currentState = stateRef.current;
      const currentSelected = selectedChatRef.current;
      const currentUser = loggedInUserRef.current;

      const senderIdStr = (
        typeof msg.senderId === "object"
          ? msg.senderId?._id
          : msg.senderId
      )?.toString();
      const receiverIdStr = (
        typeof msg.receiverId === "object"
          ? msg.receiverId?._id
          : msg.receiverId
      )?.toString();

      const currentUserIdStr = currentUser?._id?.toString();
      const isFromMe = senderIdStr === currentUserIdStr;

      const selectedIdStr = currentSelected?.id?.toString();
      const isCurrentChat =
        Boolean(currentSelected) &&
        ((!currentSelected.isGroup &&
          (senderIdStr === selectedIdStr || receiverIdStr === selectedIdStr)) ||
          (currentSelected.isGroup &&
            msg.groupId?.toString() === selectedIdStr));

      const lastMsgText =
        msg.text || (msg.mediaType ? `[${msg.mediaType}]` : "New message");

      // Update sidebar chat item and move to top
      currentState.setChats((prev) => {
        const chatId = msg.groupId || (isFromMe ? receiverIdStr : senderIdStr);
        const existingIndex = prev.findIndex(
          (c) => c.id?.toString() === chatId?.toString(),
        );

        if (existingIndex !== -1) {
          const updatedChat = {
            ...prev[existingIndex],
            lastMessage: lastMsgText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread:
              isCurrentChat || isFromMe
                ? 0
                : (prev[existingIndex].unread || 0) + 1,
          };
          const next = [...prev];
          next.splice(existingIndex, 1);
          return [updatedChat, ...next];
        } else if (!isFromMe) {
          const senderName =
            typeof msg.senderId === "object"
              ? msg.senderId?.name
              : msg.senderName || "New Contact";
          const newChat = {
            id: senderIdStr,
            name: senderName,
            isGroup: false,
            lastMessage: lastMsgText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: isCurrentChat ? 0 : 1,
            avatar:
              msg.senderId?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName)}`,
          };
          return [newChat, ...prev];
        }
        return prev;
      });

      // Notification sound & banner for non-active chats
      if (!isFromMe && !isCurrentChat) {
        playMessageChime();
        const senderName =
          typeof msg.senderId === "object"
            ? msg.senderId?.name
            : currentSelected?.name || "New Message";
        triggerDesktopNotification(senderName, lastMsgText);
      }

      // If viewing this chat, notify read status and append message
      if (isCurrentChat) {
        if (!isFromMe && msg._id) {
          socketAPI.emit("messageStatus", {
            messageId: msg._id,
            status: "read",
            senderId: senderIdStr,
            receiverId: currentUser?._id,
          });
          msg.status = "read";
        }

        currentState.setMessages((prev) => {
          if (msg.isEdit) {
            return prev.map((m) => (m._id === msg._id ? msg : m));
          }
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleDelete = (data) => {
      const currentState = stateRef.current;
      const currentSelected = selectedChatRef.current;
      const currentUser = loggedInUserRef.current;

      if (
        currentSelected &&
        (data.groupId === currentSelected.id ||
          data.receiverId === currentUser?._id)
      ) {
        currentState.setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? { ...m, isDeletedForEveryone: true, text: "", image: "" }
              : m,
          ),
        );
      }
    };

    const handleMessageStatus = (payload) => {
      stateRef.current.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, status: payload.status } : m,
        ),
      );
    };

    const handleReaction = (payload) => {
      stateRef.current.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m,
        ),
      );
    };

    const handlePollUpdated = (data) => {
      stateRef.current.setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, poll: data.poll } : m,
        ),
      );
    };

    const handleEventUpdated = (data) => {
      stateRef.current.setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, event: data.event } : m,
        ),
      );
    };

    const onTyping = (data) => {
      if (handleTypingReceiveRef.current) {
        handleTypingReceiveRef.current(data);
      }
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", onTyping);
    socketAPI.on("deleteMessage", handleDelete);
    socketAPI.on("messageStatus", handleMessageStatus);
    socketAPI.on("reaction", handleReaction);
    socketAPI.on("pollUpdated", handlePollUpdated);
    socketAPI.on("eventUpdated", handleEventUpdated);

    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", onTyping);
      socketAPI.off("deleteMessage", handleDelete);
      socketAPI.off("messageStatus", handleMessageStatus);
      socketAPI.off("reaction", handleReaction);
      socketAPI.off("pollUpdated", handlePollUpdated);
      socketAPI.off("eventUpdated", handleEventUpdated);
      if (setOtherUserTypingRef.current) {
        setOtherUserTypingRef.current(false);
      }
    };
  }, []);
};
