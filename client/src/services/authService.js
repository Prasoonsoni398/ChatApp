/**
 * authService.js
 * All authentication-related API calls.
 * Token is NOT needed for these endpoints — they are public.
 */

const BASE = '/api/auth';

/**
 * Log in with email + password.
 * @returns {Promise<{ token: string, name: string, email: string, _id: string }>}
 */
export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

/**
 * Log in via Google OAuth credential.
 * @param {string} credential - The Google JWT credential string.
 * @returns {Promise<{ token: string, name: string, email: string, _id: string }>}
 */
export async function googleLogin(credential) {
  const res = await fetch(`${BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Google Login failed');
  return data;
}

/**
 * Register a new user account. Sends an OTP to the provided email.
 * @returns {Promise<{ message: string }>}
 */
export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

/**
 * Verify the OTP sent to the user's email after registration.
 * @returns {Promise<{ message: string }>}
 */
export async function verifyOtp(email, otp) {
  const res = await fetch(`${BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'OTP verification failed');
  return data;
}

/**
 * Request a password-reset OTP for the given email.
 * @returns {Promise<{ message: string }>}
 */
export async function forgotPassword(email) {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to request OTP');
  return data;
}

/**
 * Reset the user's password using the OTP they received by email.
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword(email, otp, newPassword) {
  const res = await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reset password');
  return data;
}
