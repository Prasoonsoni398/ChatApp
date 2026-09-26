/**
 * userService.js
 * All user-related API calls.
 * Auth token is read from localStorage internally.
 */

const BASE = "/api/users";

const getToken = () => localStorage.getItem("token");

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/**
 * Fetch logged-in user's contacts (shown in sidebar).
 * Requires auth.
 * @returns {Promise<User[]>}
 */
export async function getAllUsers() {
  const res = await fetch(`${BASE}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || data.error || "Failed to fetch contacts");
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch all verified users — used for group member selection.
 * @returns {Promise<User[]>}
 */
export async function getAllVerifiedUsers() {
  const res = await fetch(`${BASE}/all`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || data.error || "Failed to fetch users");
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a user's full profile details (phone, about, common groups, media count).
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getUserProfile(userId) {
  if (!userId) throw new Error("User ID is required");
  const res = await fetch(`${BASE}/profile/${userId}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.message || data.error || "Failed to fetch user profile",
    );
  return data;
}

/**
 * Update the logged-in user's profile (name and/or avatar image).
 * @param {FormData} formData - Must include "name". Optional "avatar" file.
 * @returns {Promise<{ name: string, avatar: string }>}
 */
export async function updateProfile(formData) {
  const res = await fetch(`${BASE}/profile`, {
    method: "PUT",
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data;
}

/**
 * Update user's privacy settings (PRD Section 61-64).
 * @param {Object} settings - { lastSeen, readReceipts, profilePhoto, about, disappearingMessageTimer }
 * @returns {Promise<User>}
 */
export async function updatePrivacySettings(settings) {
  const res = await fetch(`${BASE}/privacy`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "Failed to update privacy settings");
  return data;
}

/**
 * Toggle block status for a user (PRD Section 67).
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function toggleBlockUser(userId) {
  const res = await fetch(`${BASE}/block/${userId}`, {
    method: "POST",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle block");
  return data;
}

/**
 * Get list of blocked users (PRD Section 67).
 * @returns {Promise<User[]>}
 */
export async function getBlockedUsers() {
  const res = await fetch(`${BASE}/blocked`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch blocked users");
  return data;
}

/**
 * Get all linked devices (PRD Section 70-72).
 * @returns {Promise<Array>}
 */
export async function getLinkedDevices() {
  const res = await fetch(`${BASE}/linked-devices`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "Failed to fetch linked devices");
  return data;
}

/**
 * Link a new device session (PRD Section 71).
 * @param {Object} deviceData - { deviceId, deviceName, browser, os }
 * @returns {Promise<Array>}
 */
export async function linkDevice(deviceData) {
  const res = await fetch(`${BASE}/linked-devices`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(deviceData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to link device");
  return data;
}

/**
 * Remotely log out a linked device (PRD Section 72).
 * @param {string} deviceId
 * @returns {Promise<Object>}
 */
export async function unlinkDevice(deviceId) {
  const res = await fetch(`${BASE}/linked-devices/${deviceId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to log out device");
  return data;
}

/**
 * Export account data (PRD Section 105).
 * @returns {Promise<Object>}
 */
export async function exportAccountData() {
  const res = await fetch(`${BASE}/export-data`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to export account data");
  return data;
}

/**
 * Permanently delete user account and associated data (PRD Section 104).
 * @returns {Promise<Object>}
 */
export async function deleteAccount() {
  const res = await fetch(`${BASE}/account`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete account");
  return data;
}
