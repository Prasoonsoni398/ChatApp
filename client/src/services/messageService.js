/**
 * messageService.js
 * All direct-message API calls (DM only — group messages live in groupService).
 * Auth token is read from localStorage internally.
 */

const BASE = '/api/messages';

const getToken = () => localStorage.getItem('token');

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
  if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
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
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
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
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to edit message');
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
    method: 'DELETE',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete message');
  return data;
}

/**
 * Toggle pin/unpin on a message.
 * @param {string} messageId
 * @returns {Promise<{ isPinned: boolean, data: Message }>}
 */
export async function pinMessage(messageId) {
  const res = await fetch(`${BASE}/pin/${messageId}`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to pin message');
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
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add reaction');
  return data;
}

/**
 * Clear all messages in a chat for the current user (soft-delete).
 * @param {string} chatId - The other participant's user ID.
 * @returns {Promise<{ message: string }>}
 */
export async function clearChat(chatId) {
  const res = await fetch(`${BASE}/clear/${chatId}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to clear chat');
  return data;
}
