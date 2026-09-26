import express from "express";
import {
  registerUser,
  verifyOTP,
  resendPhoneOTP,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-phone-otp", resendPhoneOTP);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
