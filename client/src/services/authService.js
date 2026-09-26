/**
 * authService.js
 * All authentication-related API calls.
 */

const BASE = "/api/auth";

/**
 * Log in with phone number or email + password.
 */
export async function loginUser(identifier, password) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier,
      phone: identifier,
      email: identifier,
      password,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Login failed");
    error.data = data;
    error.needsVerification = data.needsVerification;
    error.phone = data.phone;
    error.devOtp = data.devOtp;
    throw error;
  }
  return data;
}

/**
 * Log in via Google OAuth credential.
 */
export async function googleLogin(credential) {
  const res = await fetch(`${BASE}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Google Login failed");
  return data;
}

/**
 * Register a new user with phone number and name. Sends SMS OTP.
 */
export async function registerUser(name, phone, password, email = "") {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, password, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

/**
 * Verify phone number via SMS OTP code.
 */
export async function verifyOtp(phone, otp) {
  const res = await fetch(`${BASE}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "OTP verification failed");
  return data;
}

/**
 * Resend SMS OTP to phone number.
 */
export async function resendPhoneOtp(phone) {
  const res = await fetch(`${BASE}/resend-phone-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
  return data;
}

/**
 * Request a password-reset OTP for the given email.
 * @returns {Promise<{ message: string }>}
 */
export async function forgotPassword(email) {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request OTP");
  return data;
}

/**
 * Reset the user's password using the OTP they received by email.
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword(email, otp, newPassword) {
  const res = await fetch(`${BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password");
  return data;
}
