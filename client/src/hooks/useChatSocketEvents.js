import { useEffect } from "react";
import * as messageService from "../services/messageService.js";
import * as groupService from "../services/groupService.js";
import socketAPI from "../config/webSocket.js";
import {
  playMessageChime,
  triggerDesktopNotification,
} from "../utils/notificationAudio.js";

/**
 * useChatSocketEvents – manages message fetching on chat switch
 * and registers/deregisters all real-time Socket.IO listeners.
 */
export const useChatSocketEvents = ({
  state,
  handleTypingReceive,
  setOtherUserTyping,
}) => {
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
            const senderIdStr =
              typeof m.senderId === "object" ? m.senderId?._id : m.senderId;
            return (
              senderIdStr !== state.loggedInUser?._id && m.status !== "read"
            );
          })
          .map((m) => m._id);

        unreadIds.forEach((id) => {
          const msg = data.find((m) => m._id === id);
          const senderIdStr =
            typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
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
            status: unreadIds.includes(m._id)
              ? "read"
              : prevMap.get(m._id) || m.status,
          }));
        });

        // Reset unread count for current open chat
        state.setChats((prev) =>
          prev.map((c) =>
            c.id === state.selectedChat.id ? { ...c, unread: 0 } : c,
          ),
        );

        const pinned = data.find((m) => m.isPinned);
        if (pinned) {
          state.setPinnedMessage(pinned);
          state.setShowPinnedBanner(true);
        } else state.setPinnedMessage(null);
      } catch (_e) {
        console.error("Fetch messages error:", _e);
      }
    };

    if (state.selectedChat) fetchMessages();
    else {
      state.setMessages([]);
      state.setPinnedMessage(null);
    }

    const handleReceive = (msg) => {
      const senderIdStr =
        typeof msg.senderId === "object"
          ? msg.senderId?._id?.toString()
          : msg.senderId?.toString();
      const receiverIdStr =
        typeof msg.receiverId === "object"
          ? msg.receiverId?._id?.toString()
          : msg.receiverId?.toString();
      const isFromMe = senderIdStr === state.loggedInUser?._id?.toString();

      const selectedIdStr = state.selectedChat?.id?.toString();
      const isCurrentChat =
        Boolean(state.selectedChat) &&
        ((!state.selectedChat.isGroup &&
          (senderIdStr === selectedIdStr || receiverIdStr === selectedIdStr)) ||
          (state.selectedChat.isGroup &&
            msg.groupId?.toString() === selectedIdStr));

      // If user is currently looking at this chat, immediately mark as read
      if (isCurrentChat && !isFromMe && msg._id) {
        socketAPI.emit("messageStatus", {
          messageId: msg._id,
          status: "read",
          senderId: senderIdStr,
          receiverId: state.loggedInUser?._id,
        });
      }

      const lastMsgText =
        msg.text || (msg.mediaType ? `[${msg.mediaType}]` : "New message");

      // Update sidebar chat item and move it to the top
      state.setChats((prev) => {
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
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`,
          };
          return [newChat, ...prev];
        }
        return prev;
      });

      if (!isFromMe && !isCurrentChat) {
        playMessageChime();
        const senderName =
          typeof msg.senderId === "object"
            ? msg.senderId?.name
            : state.selectedChat?.name || "New Message";
        triggerDesktopNotification(senderName, lastMsgText);
      }

      if (isCurrentChat) {
        if (!isFromMe) {
          socketAPI.emit("messageStatus", {
            messageId: msg._id,
            status: "read",
            senderId: senderIdStr,
            receiverId: state.loggedInUser?._id,
          });
          msg.status = "read";
        }

        state.setMessages((prev) => {
          if (msg.isEdit)
            return prev.map((m) => (m._id === msg._id ? msg : m));
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleDelete = (data) => {
      if (
        state.selectedChat &&
        (data.groupId === state.selectedChat.id ||
          data.receiverId === state.loggedInUser?._id)
      ) {
        state.setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? { ...m, isDeletedForEveryone: true, text: "", image: "" }
              : m,
          ),
        );
      }
    };

    const handleMessageStatus = (payload) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, status: payload.status } : m,
        ),
      );
    };

    const handleReaction = (payload) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m,
        ),
      );
    };

    const handlePollUpdated = (data) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, poll: data.poll } : m,
        ),
      );
    };

    const handleEventUpdated = (data) => {
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, event: data.event } : m,
        ),
      );
    };

    socketAPI.on("receive", handleReceive);
    socketAPI.on("typing", handleTypingReceive);
    socketAPI.on("deleteMessage", handleDelete);
    socketAPI.on("messageStatus", handleMessageStatus);
    socketAPI.on("reaction", handleReaction);
    socketAPI.on("pollUpdated", handlePollUpdated);
    socketAPI.on("eventUpdated", handleEventUpdated);
    return () => {
      socketAPI.off("receive", handleReceive);
      socketAPI.off("typing", handleTypingReceive);
      socketAPI.off("deleteMessage", handleDelete);
      socketAPI.off("messageStatus", handleMessageStatus);
      socketAPI.off("reaction", handleReaction);
      socketAPI.off("pollUpdated", handlePollUpdated);
      socketAPI.off("eventUpdated", handleEventUpdated);
      setOtherUserTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedChat, state.loggedInUser]);
};
