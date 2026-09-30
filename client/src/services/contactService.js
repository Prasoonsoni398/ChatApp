/**
 * contactService.js
 * WhatsApp-style contacts: search by phone, add, remove, list.
 */

import { API_BASE_URL, authHeader, fetchWithRetry } from "../config/api.js";

const BASE = `${API_BASE_URL}/contacts`;

/**
 * Search for a user by phone number, email, or name.
 * @param {string} phone - Search term (phone number, email, or name)
 * @returns {Promise<User>}
 */
export async function searchContactByPhone(phone) {
  const params = new URLSearchParams({ phone, query: phone });
  const res = await fetchWithRetry(`${BASE}/search?${params}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "User not found");
  return data;
}

/**
 * Get all my contacts.
 * @returns {Promise<User[]>}
 */
export async function getContacts() {
  const res = await fetch(BASE, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch contacts");
  return data;
}

/**
 * Add a contact by user ID, with optional custom display name / nickname.
 * @param {string} userId
 * @param {string} [customName]
 * @returns {Promise<{ contact: User, contacts: User[] }>}
 */
export async function addContact(userId, customName) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ userId, customName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add contact");
  return data;
}

/**
 * Update contact custom nickname.
 * @param {string} userId
 * @param {string} customName
 * @returns {Promise<{ message: string, userId: string, customName: string }>}
 */
export async function updateContactName(userId, customName) {
  const res = await fetch(`${BASE}/${userId}`, {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ customName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update contact name");
  return data;
}

/**
 * Remove a contact.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function removeContact(userId) {
  const res = await fetch(`${BASE}/${userId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove contact");
  return data;
}
