import toast from "react-hot-toast";
import * as messageService from "../services/messageService.js";
import * as groupService from "../services/groupService.js";
import socketAPI from "../config/webSocket.js";
import { playSentPop } from "../utils/notificationAudio.js";

export const useChatMessageSender = ({
  state,
  selectedFile,
  setSelectedFile,
  setShowLocationModal,
  setShowContactModal,
  activeViewOnceMsg,
  setActiveViewOnceMsg,
}) => {
  const handleSendMessage = async (e, isViewOnce = false) => {
    if (e) e.preventDefault();
    if (
      (!state.message.trim() && !state.selectedImage && !selectedFile) ||
      !state.selectedChat
    )
      return;

    try {
      localStorage.removeItem(`draft_${state.selectedChat.id}`);
    } catch (_e) {}

    if (state.editingMessageId) {
      try {
        const data = await messageService.editMessage(
          state.editingMessageId,
          state.message,
        );
        state.setMessages((prev) =>
          prev.map((m) => (m._id === state.editingMessageId ? data : m)),
        );
        socketAPI.emit("send", {
          ...data,
          receiverId: state.selectedChat.id,
          isEdit: true,
        });
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

    let optimisticMediaType = "text";
    if (state.selectedImage) optimisticMediaType = "image";
    else if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) optimisticMediaType = "video";
      else if (selectedFile.type.startsWith("audio/"))
        optimisticMediaType = "audio";
      else optimisticMediaType = "document";
    }

    const optimisticMsg = {
      _id: tempId,
      text: state.message,
      image: state.imagePreview,
      mediaType: optimisticMediaType,
      mediaUrl:
        state.imagePreview ||
        (selectedFile ? URL.createObjectURL(selectedFile) : ""),
      fileName: selectedFile?.name || "",
      fileSize: selectedFile?.size || 0,
      senderId: state.selectedChat.isGroup
        ? senderInfo
        : state.loggedInUser._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      replyToText: state.replyingTo?.text,
      replyToSender: state.replyingTo?.senderName,
      groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      reactions: [],
      starredBy: [],
      isViewOnce: Boolean(isViewOnce),
    };
    state.setMessages((prev) => [...prev, optimisticMsg]);
    playSentPop();

    const currentMessage = state.message;
    const currentImage = state.selectedImage;
    const currentFile = selectedFile;
    const currentReply = state.replyingTo;

    state.setMessage("");
    state.setSelectedImage(null);
    state.setImagePreview(null);
    setSelectedFile(null);
    state.setShowEmojiPicker(false);
    state.setReplyingTo(null);

    const formData = new FormData();
    if (currentMessage) formData.append("text", currentMessage);
    if (currentImage) formData.append("image", currentImage);
    if (currentFile) formData.append("file", currentFile);
    if (isViewOnce) formData.append("isViewOnce", "true");
    if (currentReply) {
      formData.append("replyToId", currentReply._id);
      formData.append("replyToText", currentReply.text || "");
      formData.append("replyToSender", currentReply.senderName || "");
    }

    try {
      let data;
      if (state.selectedChat.isGroup) {
        data = await groupService.sendGroupMessage(
          state.selectedChat.id,
          formData,
        );
      } else {
        data = await messageService.sendMessage(
          state.selectedChat.id,
          formData,
        );
      }
      state.setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m)),
      );
      socketAPI.emit("send", {
        ...data,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });

      state.setChats((prev) => {
        const chatId = state.selectedChat.id;
        const existingIndex = prev.findIndex((c) => c.id === chatId);
        const lastMsgText =
          data.text || (data.mediaType ? `[${data.mediaType}]` : "Media");
        if (existingIndex !== -1) {
          const updatedChat = {
            ...prev[existingIndex],
            lastMessage: lastMsgText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          const next = [...prev];
          next.splice(existingIndex, 1);
          return [updatedChat, ...next];
        }
        return prev;
      });
    } catch {
      toast.error("Failed to send message");
      state.setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleSendVoice = async (voiceBlob, duration) => {
    if (!state.selectedChat) return;

    const tempId = Date.now().toString();
    const senderInfo = {
      _id: state.loggedInUser._id,
      name: state.loggedInUser.name,
      avatar: state.loggedInUser.avatar,
    };

    const previewUrl = URL.createObjectURL(voiceBlob);

    const optimisticMsg = {
      _id: tempId,
      text: "",
      mediaType: "voice",
      mediaUrl: previewUrl,
      duration: duration || 1,
      senderId: state.selectedChat.isGroup
        ? senderInfo
        : state.loggedInUser._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      reactions: [],
      starredBy: [],
    };
    state.setMessages((prev) => [...prev, optimisticMsg]);

    const formData = new FormData();
    formData.append("file", voiceBlob, "voice_message.webm");
    formData.append("isVoice", "true");
    formData.append("duration", duration || 1);

    try {
      let data;
      if (state.selectedChat.isGroup) {
        data = await groupService.sendGroupMessage(
          state.selectedChat.id,
          formData,
        );
      } else {
        data = await messageService.sendMessage(
          state.selectedChat.id,
          formData,
        );
      }
      state.setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m)),
      );
      socketAPI.emit("send", {
        ...data,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
    } catch {
      toast.error("Failed to send voice note");
      state.setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleCreatePoll = async (pollData) => {
    if (!state.selectedChat) return;
    try {
      const data = await messageService.createPoll({
        ...pollData,
        receiverId: !state.selectedChat.isGroup ? state.selectedChat.id : null,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
      state.setMessages((prev) => [...prev, data]);
      socketAPI.emit("send", {
        ...data,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
      toast.success("Poll created!");
    } catch (_err) {
      toast.error("Failed to create poll");
      throw _err;
    }
  };

  const handleCreateEvent = async (eventData) => {
    if (!state.selectedChat) return;
    try {
      const data = await messageService.createEvent({
        ...eventData,
        receiverId: !state.selectedChat.isGroup ? state.selectedChat.id : null,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
      state.setMessages((prev) => [...prev, data]);
      socketAPI.emit("send", {
        ...data,
        receiverId: state.selectedChat.id,
        groupId: state.selectedChat.isGroup ? state.selectedChat.id : null,
      });
      toast.success("Event created!");
    } catch (_err) {
      toast.error("Failed to create event");
      throw _err;
    }
  };

  const handleRespondEvent = async (messageId, status) => {
    try {
      const data = await messageService.respondEvent(messageId, status);
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, event: data.event } : m,
        ),
      );
      socketAPI.emit("eventUpdated", {
        messageId,
        event: data.event,
        receiverId: state.selectedChat?.id,
        groupId: state.selectedChat?.isGroup ? state.selectedChat.id : null,
      });
      toast.success(`RSVP updated: ${status}`);
    } catch (err) {
      toast.error(err.message || "Failed to update RSVP");
    }
  };

  const handleSendLocation = async (locData) => {
    if (!state.selectedChat) return;
    try {
      const formData = new FormData();
      formData.append("mediaType", "location");
      formData.append("location", JSON.stringify(locData));
      formData.append(
        "text",
        locData.name ? `📍 ${locData.name}` : "📍 Location",
      );

      let msg;
      if (state.selectedChat.isGroup) {
        msg = await groupService.sendGroupMessage(
          state.selectedChat.id,
          formData,
        );
      } else {
        msg = await messageService.sendMessage(state.selectedChat.id, formData);
      }
      state.setMessages((prev) => [...prev, msg]);
      setShowLocationModal(false);
      toast.success("Location shared!");
    } catch (err) {
      toast.error(err.message || "Failed to share location");
    }
  };

  const handleSendContact = async (contactData) => {
    if (!state.selectedChat) return;
    try {
      const formData = new FormData();
      formData.append("mediaType", "contact");
      formData.append("contactCard", JSON.stringify(contactData));
      formData.append("text", `👤 Contact: ${contactData.name}`);

      let msg;
      if (state.selectedChat.isGroup) {
        msg = await groupService.sendGroupMessage(
          state.selectedChat.id,
          formData,
        );
      } else {
        msg = await messageService.sendMessage(state.selectedChat.id, formData);
      }
      state.setMessages((prev) => [...prev, msg]);
      setShowContactModal(false);
      toast.success("Contact shared!");
    } catch (err) {
      toast.error(err.message || "Failed to share contact");
    }
  };

  const handleOpenViewOnce = (msg) => {
    setActiveViewOnceMsg(msg);
  };

  const handleCloseViewOnce = async () => {
    if (!activeViewOnceMsg) return;
    const msgId = activeViewOnceMsg._id;
    setActiveViewOnceMsg(null);
    try {
      await messageService.viewOnceMessage(msgId);
      state.setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId
            ? {
                ...m,
                viewedBy: [...(m.viewedBy || []), state.loggedInUser._id],
              }
            : m,
        ),
      );
    } catch (_e) {}
  };

  return {
    handleSendMessage,
    handleSendVoice,
    handleCreatePoll,
    handleCreateEvent,
    handleRespondEvent,
    handleSendLocation,
    handleSendContact,
    handleOpenViewOnce,
    handleCloseViewOnce,
  };
};
