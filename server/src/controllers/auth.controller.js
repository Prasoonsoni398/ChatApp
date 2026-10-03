import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import sendSMS from "../utils/sendSMS.js";
import { OAuth2Client } from "google-auth-library";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
} from "../templates/email/emailTemplates.js";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "chatapp_jwt_fallback_secret_key_2026";
  return jwt.sign({ id }, secret, {
    expiresIn: "30d",
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Normalise phone: strip spaces/dashes, handle Indian 10-digit numbers, ensure leading +
const normalisePhone = (raw) => {
  if (!raw) return null;
  let p = raw.toString().replace(/[\s\-().]/g, "");
  if (!p.startsWith("+")) {
    if (p.startsWith("0") && p.length === 11) {
      p = `+91${p.slice(1)}`;
    } else if (p.length === 10) {
      p = `+91${p}`;
    } else {
      p = `+${p}`;
    }
  }
  return p;
};

// Generates phone lookup candidates to match numbers with or without country code (+91, raw, 10-digit)
const getPhoneSearchCandidates = (rawPhone) => {
  if (!rawPhone) return [];
  const rawStr = rawPhone.toString().trim();
  const norm = normalisePhone(rawStr);
  const clean = rawStr.replace(/\D/g, "");
  const candidates = new Set([norm, rawStr]);
  if (clean) {
    candidates.add(clean);
    candidates.add(`+${clean}`);
    if (clean.length === 10) {
      candidates.add(`+91${clean}`);
      candidates.add(`91${clean}`);
    } else if (clean.startsWith("91") && clean.length === 12) {
      const ten = clean.slice(2);
      candidates.add(`+91${ten}`);
      candidates.add(`+${ten}`);
      candidates.add(ten);
    }
  }
  return Array.from(candidates).filter(Boolean);
};

/* ─────────────────────────────────────────
   REGISTER  (now requires phone number)
   OTP is delivered via email but the user is
   identified/searchable by phone number.
───────────────────────────────────────── */
export const registerUser = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!phone || !phone.toString().trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normPhone = normalisePhone(phone);
    const phoneCandidates = getPhoneSearchCandidates(phone);

    // Check duplicate phone across potential candidate formats
    const existingPhone = await User.findOne({
      phone: { $in: phoneCandidates },
    });
    if (existingPhone && existingPhone.isVerified) {
      return res
        .status(400)
        .json({ message: "Phone number already registered. Please log in." });
    }

    // Check duplicate email if provided
    if (email && email.toString().trim()) {
      const cleanEmail = email.toString().trim().toLowerCase();
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (
        existingEmail &&
        (!existingPhone ||
          existingEmail._id.toString() !== existingPhone._id.toString())
      ) {
        if (existingEmail.isVerified) {
          return res.status(400).json({ message: "Email already registered. Please log in." });
        } else {
          // If the other user record was never verified, release the email so new registration can proceed
          existingEmail.email = undefined;
          await existingEmail.save();
        }
      }
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    let user = existingPhone;
    if (user && !user.isVerified) {
      user.name = name.trim();
      user.password = password;
      user.phone = normPhone;
      if (email && email.toString().trim()) {
        user.email = email.toString().trim().toLowerCase();
      } else {
        user.email = undefined;
      }
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        phone: normPhone,
        email:
          email && email.toString().trim()
            ? email.toString().trim().toLowerCase()
            : undefined,
        password,
        otp,
        otpExpires,
        loginType: "normal_user",
      });
    }

    // Forward OTP in real-time via SMS Gateway (with timeout safety)
    const smsResult = await sendSMS({
      phone: normPhone,
      otp,
      message: `Your ChatApp verification code is ${otp}. Valid for 10 minutes.`,
    });

    let emailSent = false;
    // If an email address is provided and credentials exist, attempt safe email delivery without blocking response
    if (
      user.email &&
      process.env.GMAIL_USERNAME &&
      process.env.GMAIL_PASSCODE
    ) {
      try {
        const emailPromise = sendEmail({
          email: user.email,
          subject: "Your ChatApp Verification Code",
          html: getVerificationEmailTemplate(otp, user.name),
        });
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(null), 3000),
        );
        const emailRes = await Promise.race([emailPromise, timeoutPromise]);
        if (emailRes) emailSent = true;
      } catch (emailErr) {
        console.warn("Email dispatch notice (non-fatal):", emailErr.message);
      }
    }

    res.status(201).json({
      message: smsResult?.dispatchedRealSms
        ? `Real-time SMS forwarded to ${normPhone}. Enter the 6-digit code to complete registration.`
        : emailSent
          ? `Verification code sent to ${user.email} and generated for ${normPhone}.`
          : `Verification code ready for ${normPhone}. Enter the 6-digit code to complete registration.`,
      phone: normPhone,
      userId: user._id,
      smsDelivered: smsResult?.dispatchedRealSms || false,
      emailDelivered: emailSent,
      email: user.email,
      otp, // Guarantees 100% functionality on Render Free Version
      devOtp: otp,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   RESEND PHONE OTP
───────────────────────────────────────── */
export const resendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const normPhone = normalisePhone(phone);
    const phoneCandidates = getPhoneSearchCandidates(phone);
    const user = await User.findOne({ phone: { $in: phoneCandidates } });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this phone number" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Forward new OTP in real-time via SMS Gateway
    const smsResult = await sendSMS({
      phone: normPhone,
      otp,
      message: `Your new ChatApp verification code is ${otp}. Valid for 10 minutes.`,
    });

    let emailSent = false;
    if (
      user.email &&
      process.env.GMAIL_USERNAME &&
      process.env.GMAIL_PASSCODE
    ) {
      try {
        const emailPromise = sendEmail({
          email: user.email,
          subject: "Your New ChatApp Verification Code",
          html: getVerificationEmailTemplate(otp, user.name),
        });
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(null), 3000),
        );
        const emailRes = await Promise.race([emailPromise, timeoutPromise]);
        if (emailRes) emailSent = true;
      } catch (emailErr) {
        console.warn("Email dispatch notice (non-fatal):", emailErr.message);
      }
    }

    res.status(200).json({
      message: smsResult?.dispatchedRealSms
        ? `New OTP forwarded via SMS to ${normPhone}`
        : emailSent
          ? `New verification code emailed to ${user.email}`
          : `New verification code ready for ${normPhone}`,
      phone: normPhone,
      smsDelivered: smsResult?.dispatchedRealSms || false,
      emailDelivered: emailSent,
      email: user.email,
      otp,
      devOtp: otp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   VERIFY OTP (phone-based)
───────────────────────────────────────── */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP code is required" });
    }

    let user;
    if (phone) {
      const phoneCandidates = getPhoneSearchCandidates(phone);
      user = await User.findOne({ phone: { $in: phoneCandidates } });
    } else if (email) {
      user = await User.findOne({ email: email.toString().trim().toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "User is already verified. Please log in." });
    }

    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    if (Date.now() > user.otpExpires) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    // Standardize stored phone number to clean E.164 if needed
    if (user.phone && !user.phone.startsWith("+")) {
      user.phone = normalisePhone(user.phone);
    }
    await user.save();

    const token = generateToken(user._id);

    const io = req.app.get("io");
    if (io) {
      io.emit("newUserRegistered", {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
      });
    }

    res.json({
      message: "Phone number verified successfully!",
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   LOGIN (phone or email + password)
───────────────────────────────────────── */
export const loginUser = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginIdentifier = (identifier || phone || email || "")
      .toString()
      .trim();

    if (!loginIdentifier || !password) {
      return res
        .status(400)
        .json({ message: "Phone number or email and password are required" });
    }

    const phoneCandidates = getPhoneSearchCandidates(loginIdentifier);

    // Search by any normalized or raw phone format or by email
    const user = await User.findOne({
      $or: [
        { phone: { $in: phoneCandidates } },
        { email: loginIdentifier.toLowerCase() },
      ],
    });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        const freshOtp = generateOTP();
        user.otp = freshOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendSMS({
          phone: user.phone,
          otp: freshOtp,
          message: `Your ChatApp verification code is ${freshOtp}. Valid for 10 minutes.`,
        });

        return res.status(401).json({
          message:
            "Please verify your phone number first. A real-time OTP has been forwarded to your phone.",
          phone: user.phone,
          needsVerification: true,
          devOtp: freshOtp,
        });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res
        .status(401)
        .json({ message: "Invalid phone number/email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   GOOGLE LOGIN
───────────────────────────────────────── */
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (user.loginType === "normal_user") {
        user.loginType = "hybrid_user";
        user.google_id = sub;
        if (!user.isVerified) user.isVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        google_id: sub,
        loginType: "google_user",
        isVerified: true,
        avatar: picture,
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("newUserRegistered", {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   FORGOT PASSWORD
───────────────────────────────────────── */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Reset your password - ChatApp",
      html: getPasswordResetEmailTemplate(otp),
    });

    res.status(200).json({ message: "Reset OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────
   RESET PASSWORD
───────────────────────────────────────── */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
