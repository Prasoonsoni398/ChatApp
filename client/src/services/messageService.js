/**
 * messageService.js
 * All direct-message API calls (DM only — group messages live in groupService).
 * Auth token is read from localStorage internally.
 */

const BASE = "/api/messages";

const getToken = () => localStorage.getItem("token");

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/**
 * Fetch all messages between the logged-in user and another user.
 * @param {string} userId - The other user's ID.
 * @returns {Promise<Message[]>}
 */
export async function getMessages(userId) {
  const res = await fetch(`${BASE}/${userId}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
  return data;
}

/**
 * Send a new message (with optional image + reply metadata).
 * @param {string}   receiverId - Recipient user ID.
 * @param {FormData} formData   - Message body (text, image, replyTo* fields).
 * @returns {Promise<Message>}
 */
export async function sendMessage(receiverId, formData) {
  const res = await fetch(`${BASE}/send/${receiverId}`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}

/**
 * Edit the text of an existing message.
 * @param {string} messageId - ID of the message to edit.
 * @param {string} text      - New text content.
 * @returns {Promise<Message>}
 */
export async function editMessage(messageId, text) {
  const res = await fetch(`${BASE}/${messageId}`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to edit message");
  return data;
}

/**
 * Delete a message either for the sender only ("me") or for everyone ("everyone").
 * @param {string} messageId - ID of the message to delete.
 * @param {'me'|'everyone'} type - Deletion scope.
 * @returns {Promise<{ message: string, deletedMessage: Message }>}
 */
export async function deleteMessage(messageId, type) {
  const res = await fetch(`${BASE}/${messageId}?type=${type}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete message");
  return data;
}

/**
 * Toggle pin/unpin on a message.
 * @param {string} messageId
 * @returns {Promise<{ isPinned: boolean, data: Message }>}
 */
export async function pinMessage(messageId) {
  const res = await fetch(`${BASE}/pin/${messageId}`, {
    method: "PATCH",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to pin message");
  return data;
}

/**
 * Add or toggle an emoji reaction on a message.
 * @param {string} messageId
 * @param {string} emoji - Unicode emoji character.
 * @returns {Promise<Reaction[]>}
 */
export async function addReaction(messageId, emoji) {
  const res = await fetch(`${BASE}/react/${messageId}`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add reaction");
  return data;
}

/**
 * Clear all messages in a chat for the current user (soft-delete).
 * @param {string} chatId - The other participant's user ID.
 * @returns {Promise<{ message: string }>}
 */
export async function clearChat(chatId) {
  const res = await fetch(`${BASE}/clear/${chatId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to clear chat");
  return data;
}

/**
 * Toggle star/unstar on a message (PRD Section 22).
 * @param {string} messageId
 * @returns {Promise<{ isStarred: boolean, messageId: string, starredBy: string[] }>}
 */
export async function toggleStarMessage(messageId) {
  const res = await fetch(`${BASE}/star/${messageId}`, {
    method: "PATCH",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to star message");
  return data;
}

/**
 * Fetch all starred messages for the current user (PRD Section 22).
 * @returns {Promise<Message[]>}
 */
export async function getStarredMessages() {
  const res = await fetch(`${BASE}/starred`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Failed to fetch starred messages");
  return data;
}

/**
 * Create a new poll (PRD Section 47).
 * @param {Object} pollData - { question, options, allowMultipleAnswers, receiverId, groupId }
 * @returns {Promise<Message>}
 */
export async function createPoll(pollData) {
  const res = await fetch(`${BASE}/poll`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(pollData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create poll");
  return data;
}

/**
 * Vote on a poll option (PRD Section 47).
 * @param {string} messageId
 * @param {number} optionIndex
 * @returns {Promise<Message>}
 */
export async function votePoll(messageId, optionIndex) {
  const res = await fetch(`${BASE}/poll/${messageId}/vote`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ optionIndex }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to vote on poll");
  return data;
}

/**
 * Mark a view-once message as viewed (PRD Section 34).
 * @param {string} messageId
 * @returns {Promise<Object>}
 */
export async function viewOnceMessage(messageId) {
  const res = await fetch(`${BASE}/${messageId}/view-once`, {
    method: "POST",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to view message");
  return data;
}

/**
 * Global search across messages and media (PRD Section 35, 36).
 * @param {string} q - Search term
 * @param {string} type - Media filter ('all'|'photos'|'videos'|'documents'|'audio'|'polls'|'links'|'contacts')
 * @returns {Promise<Message[]>}
 */
export async function searchMessages(q = "", type = "all") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type && type !== "all") params.set("type", type);
  const res = await fetch(`${BASE}/search?${params.toString()}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to search messages");
  return data;
}

/**
 * Clear all chat messages for current user (PRD Section 73).
 * @returns {Promise<{ message: string }>}
 */
export async function clearAllChats() {
  const res = await fetch(`${BASE}/clear-all`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to clear all chats");
  return data;
}

/**
 * Create a new group event (PRD Section 47).
 * @param {Object} eventData - { title, startDate, startTime, location, description, groupId, receiverId }
 * @returns {Promise<Message>}
 */
export async function createEvent(eventData) {
  const res = await fetch(`${BASE}/event`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create event");
  return data;
}

/**
 * Respond to a group event (PRD Section 47).
 * @param {string} messageId
 * @param {'going'|'maybe'|'not_going'} status
 * @returns {Promise<Message>}
 */
export async function respondEvent(messageId, status) {
  const res = await fetch(`${BASE}/event/${messageId}/respond`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to respond to event");
  return data;
}

/**
 * Get storage breakdown and large files (PRD Section 81 & 82).
 * @returns {Promise<Object>}
 */
export async function getStorageUsage() {
  const res = await fetch(`${BASE}/storage-usage`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get storage usage");
  return data;
}
