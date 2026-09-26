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

/**
 * Get or generate group invite code (PRD Section 44).
 * @param {string} groupId
 * @returns {Promise<{ inviteCode: string }>}
 */
export async function getGroupInviteLink(groupId) {
  const res = await fetch(`${BASE}/${groupId}/invite`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch invite link");
  return data;
}

/**
 * Reset group invite code (PRD Section 44).
 * @param {string} groupId
 * @returns {Promise<{ inviteCode: string }>}
 */
export async function resetGroupInviteLink(groupId) {
  const res = await fetch(`${BASE}/${groupId}/invite/reset`, {
    method: "POST",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reset invite link");
  return data;
}

/**
 * Get group metadata by invite code (PRD Section 44).
 * @param {string} inviteCode
 * @returns {Promise<Group>}
 */
export async function getGroupByInviteCode(inviteCode) {
  const res = await fetch(`${BASE}/join/${inviteCode}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get group info");
  return data;
}

/**
 * Join group using invite code (PRD Section 44).
 * @param {string} inviteCode
 * @returns {Promise<Group>}
 */
export async function joinGroupByInviteCode(inviteCode) {
  const res = await fetch(`${BASE}/join/${inviteCode}`, {
    method: "POST",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to join group");
  return data;
}

/**
 * Get single group full details (members, who added them, admin, mediaCount).
 * @param {string} groupId
 * @returns {Promise<Group>}
 */
export async function getGroupDetails(groupId) {
  const res = await fetch(`${BASE}/${groupId}/details`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get group details");
  return data;
}

/**
 * Add members to a group.
 * @param {string} groupId
 * @param {string[]} memberIds
 * @returns {Promise<Group>}
 */
export async function addMembersToGroup(groupId, memberIds) {
  const res = await fetch(`${BASE}/${groupId}/members`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add members");
  return data;
}

export const addMembers = addMembersToGroup;

export async function leaveGroup(groupId) {
  const res = await fetch(`${BASE}/${groupId}/leave`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to leave group");
  return data;
}
