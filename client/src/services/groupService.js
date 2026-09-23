/**
 * groupService.js
 * All group-related API calls.
 * Auth token is read from localStorage internally.
 */

const BASE = "/api/groups";

const getToken = () => localStorage.getItem("token");

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/**
 * Fetch all groups the logged-in user belongs to.
 * @returns {Promise<Group[]>}
 */
export async function getGroups() {
  const res = await fetch(BASE, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch groups");
  return data;
}

/**
 * Create a new group (name, optional avatar, member IDs).
 * @param {FormData} formData - Must include "name" and "memberIds" (JSON string). Optional "avatar".
 * @returns {Promise<Group>}
 */
export async function createGroup(formData) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create group");
  return data;
}

/**
 * Fetch all messages in a group chat.
 * @param {string} groupId
 * @returns {Promise<Message[]>}
 */
export async function getGroupMessages(groupId) {
  const res = await fetch(`${BASE}/${groupId}/messages`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch group messages");
  return data;
}

/**
 * Send a message to a group chat.
 * @param {string}   groupId
 * @param {FormData} formData - Message body (text, image, replyTo* fields).
 * @returns {Promise<Message>}
 */
export async function sendGroupMessage(groupId, formData) {
  const res = await fetch(`${BASE}/${groupId}/messages`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send group message");
  return data;
}
