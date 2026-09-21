/**
 * userService.js
 * All user-related API calls.
 * Auth token is read from localStorage internally.
 */

const BASE = '/api/users';

const getToken = () => localStorage.getItem('token');

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/**
 * Fetch all registered users (used to populate the chat sidebar).
 * @returns {Promise<User[]>}
 */
export async function getAllUsers() {
  const res = await fetch(BASE);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
}

/**
 * Update the logged-in user's profile (name and/or avatar image).
 * @param {FormData} formData - Must include "name". Optional "avatar" file.
 * @returns {Promise<{ name: string, avatar: string }>}
 */
export async function updateProfile(formData) {
  const res = await fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update profile');
  return data;
}
