import { useState, useRef } from "react";
import socketAPI from "../config/webSocket.js";

/**
 * Manages the "other user is typing" indicator for a selected chat.
 * Emits `typing` events over Socket.IO and listens for incoming ones.
 *
 * @param {object|null} selectedChat   - The currently active chat object.
 * @param {object|null} loggedInUser   - The current authenticated user.
 * @returns {{
 *   otherUserTyping: boolean,
 *   handleTypingEmit: () => void,
 *   handleTypingReceive: (data: { userId: string, isTyping: boolean }) => void,
 * }}
 */
function useTypingIndicator(selectedChat, loggedInUser) {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  /**
   * Call this whenever the local user types a character.
   * Emits a `typing: true` event and auto-resets to false after 2 s of silence.
   */
  const handleTypingEmit = () => {
    if (!selectedChat || !loggedInUser) return;

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
  };

  /**
   * Pass this directly as the socket `typing` event handler.
   * Updates `otherUserTyping` when the other participant's status changes.
   */
  const handleTypingReceive = (data) => {
    if (selectedChat && data.userId === selectedChat.id) {
      setOtherUserTyping(data.isTyping);
    }
  };

  return {
    otherUserTyping,
    setOtherUserTyping,
    handleTypingEmit,
    handleTypingReceive,
  };
}

export default useTypingIndicator;
