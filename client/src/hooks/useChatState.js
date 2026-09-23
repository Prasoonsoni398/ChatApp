import { useState, useRef } from "react";

/**
 * useChatState – centralises every useState / useRef that Chat.jsx needs.
 * Extracted so the orchestrator stays slim and each UI component only
 * receives the slice of state it actually uses.
 */
const useChatState = () => {
  /* ── Selected chat (persisted to sessionStorage) ── */
  const [selectedChat, setSelectedChat] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedChat")) || null;
    } catch {
      return null;
    }
  });

  /* ── Sidebar / user list ── */
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  /* ── Logged-in user ── */
  const [loggedInUser, setLoggedInUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null,
  );

  /* ── Profile edit modal ── */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.name || "";
    } catch {
      return "";
    }
  });
  const [editAvatar, setEditAvatar] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  /* ── Message list ── */
  const [messages, setMessages] = useState([]);
  const [clearedMessagesBackup, setClearedMessagesBackup] = useState(null);
  const [showClearUndoBanner, setShowClearUndoBanner] = useState(false);

  /* ── Refs ── */
  const clearUndoTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiToggleBtnRef = useRef(null);
  const reactionTimeoutRef = useRef(null);

  /* ── Input area ── */
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  /* ── Context menu ── */
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    isMe: false,
    text: "",
    msg: null,
  });

  /* ── Feature modals ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteIsMe, setDeleteIsMe] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);

  /* ── Reply ── */
  const [replyingTo, setReplyingTo] = useState(null);

  /* ── Pin ── */
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);

  /* ── Multi-select ── */
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  /* ── In-chat search ── */
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchIndex, setMsgSearchIndex] = useState(0);

  /* ── Emoji reaction hover ── */
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [showFullEmojiForMsg, setShowFullEmojiForMsg] = useState(null);

  /* ── Group creation ── */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  /* ── Header menu ── */
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  return {
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    searchQuery,
    setSearchQuery,
    allUsers,
    setAllUsers,
    loggedInUser,
    setLoggedInUser,
    showEditModal,
    setShowEditModal,
    editName,
    setEditName,
    editAvatar,
    setEditAvatar,
    isUpdating,
    setIsUpdating,
    messages,
    setMessages,
    clearedMessagesBackup,
    setClearedMessagesBackup,
    showClearUndoBanner,
    setShowClearUndoBanner,
    clearUndoTimeoutRef,
    messagesEndRef,
    fileInputRef,
    profileMenuRef,
    headerMenuRef,
    emojiPickerRef,
    emojiToggleBtnRef,
    reactionTimeoutRef,
    message,
    setMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    showProfileMenu,
    setShowProfileMenu,
    selectedImage,
    setSelectedImage,
    imagePreview,
    setImagePreview,
    editingMessageId,
    setEditingMessageId,
    showMentionPopup,
    setShowMentionPopup,
    mentionFilter,
    setMentionFilter,
    contextMenu,
    setContextMenu,
    showDeleteModal,
    setShowDeleteModal,
    deleteMessageId,
    setDeleteMessageId,
    deleteIsMe,
    setDeleteIsMe,
    showInfoModal,
    setShowInfoModal,
    infoMessage,
    setInfoMessage,
    showForwardModal,
    setShowForwardModal,
    forwardMessage,
    setForwardMessage,
    replyingTo,
    setReplyingTo,
    pinnedMessage,
    setPinnedMessage,
    showPinnedBanner,
    setShowPinnedBanner,
    selectMode,
    setSelectMode,
    selectedMessageIds,
    setSelectedMessageIds,
    showMsgSearch,
    setShowMsgSearch,
    msgSearchQuery,
    setMsgSearchQuery,
    msgSearchIndex,
    setMsgSearchIndex,
    hoveredMsgId,
    setHoveredMsgId,
    showFullEmojiForMsg,
    setShowFullEmojiForMsg,
    showCreateGroup,
    setShowCreateGroup,
    groupName,
    setGroupName,
    groupMemberIds,
    setGroupMemberIds,
    groupAvatarFile,
    setGroupAvatarFile,
    isCreatingGroup,
    setIsCreatingGroup,
    showHeaderMenu,
    setShowHeaderMenu,
  };
};

export default useChatState;
