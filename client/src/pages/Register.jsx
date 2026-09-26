import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BsEnvelopeFill,
  BsLockFill,
  BsPersonFill,
  BsKeyFill,
  BsTelephoneFill,
  BsArrowRepeat,
  BsShieldCheck,
  BsChatSquareDotsFill,
  BsWhatsapp,
} from "react-icons/bs";
import toast from "react-hot-toast";
import useAuthRedirect from "../hooks/useAuthRedirect.js";
import {
  registerUser,
  verifyOtp,
  resendPhoneOtp,
} from "../services/authService.js";
import {
  authPageWrapper,
  authCard,
  authCardTitle,
  authFormControl,
  authLabel,
  authLabelText,
  authInputGroup,
  authInputIconSpan,
  authInput,
  primaryBtn,
} from "../constants/styles.js";

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(location.state?.step || 1);
  const [formData, setFormData] = useState({
    name: "",
    phone: location.state?.phone || "",
    password: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [receivedDevOtp, setReceivedDevOtp] = useState(
    location.state?.devOtp || "",
  );
  const [deliveryInfo, setDeliveryInfo] = useState({
    smsDelivered: false,
    emailDelivered: false,
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(step === 2 ? 60 : 0);

  useAuthRedirect();

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(
        formData.name.trim(),
        formData.phone.trim(),
        formData.password,
        formData.email.trim() || undefined,
      );

      toast.success(data.message || "OTP generated!");
      if (data.otp || data.devOtp) {
        setReceivedDevOtp(data.otp || data.devOtp);
      }
      setDeliveryInfo({
        smsDelivered: data.smsDelivered || false,
        emailDelivered: data.emailDelivered || false,
        email: data.email || formData.email || "",
      });
      setStep(2);
      setCountdown(60);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(formData.phone.trim(), otp.trim());
      toast.success("Phone verified successfully! Welcome to ChatApp.");

      // Auto-login user if token returned
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: data.name,
            phone: data.phone,
            email: data.email,
            _id: data._id,
            avatar: data.avatar,
          }),
        );
        navigate("/chat");
      } else {
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending || loading) return;

    setResending(true);
    try {
      const data = await resendPhoneOtp(formData.phone.trim());
      toast.success(data.message || "New OTP generated!");
      if (data.otp || data.devOtp) {
        setReceivedDevOtp(data.otp || data.devOtp);
      }
      setDeliveryInfo({
        smsDelivered: data.smsDelivered || false,
        emailDelivered: data.emailDelivered || false,
        email: data.email || formData.email || "",
      });
      setCountdown(60);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={authPageWrapper}>
      <div className={authCard}>
        <div className="card-body">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              {step === 1 ? (
                <BsChatSquareDotsFill size={20} />
              ) : (
                <BsShieldCheck size={22} className="animate-pulse" />
              )}
            </div>
          </div>

          <h2 className={authCardTitle}>
            {step === 1 ? "Create ChatApp Account" : "Verify Phone Number"}
          </h2>

          {step === 1 ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>Full Name</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsPersonFill />
                  </span>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Alex Hunter"
                    className={authInput}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>
                    Phone Number (WhatsApp Identifier)
                  </span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsTelephoneFill />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    className={authInput}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="text-xs text-base-content/50 mt-1 pl-1">
                  Include country code (e.g. +91). A real-time verification code
                  will be forwarded to this number.
                </p>
              </div>

              {/* Password */}
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>Password</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsLockFill />
                  </span>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className={authInput}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Optional Email */}
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>Email (Optional)</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsEnvelopeFill />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="optional@example.com"
                    className={authInput}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-control mt-6">
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Send Real-Time Phone OTP"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center mb-1">
                <p className="text-base-content/70 text-sm">
                  We forwarded a 6-digit real-time verification code to:
                </p>
                <p className="font-bold text-primary text-base mt-1 font-mono tracking-wide">
                  {formData.phone}
                </p>
              </div>

              {/* Delivery notification & helper */}
              {receivedDevOtp && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3.5 space-y-2 animate-fade-in text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <BsShieldCheck size={15} /> Verification Code:
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(receivedDevOtp)}
                      className="btn btn-xs btn-primary rounded-lg font-semibold cursor-pointer"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-1">
                    <span className="font-mono font-extrabold text-2xl text-primary tracking-[0.25em]">
                      {receivedDevOtp}
                    </span>
                  </div>
                  {deliveryInfo.emailDelivered && deliveryInfo.email && (
                    <p className="text-[11px] text-base-content/70">
                      ✉️ Also delivered to your email:{" "}
                      <span className="font-medium text-primary">
                        {deliveryInfo.email}
                      </span>
                    </p>
                  )}
                  {deliveryInfo.smsDelivered ? (
                    <p className="text-[11px] text-success font-medium">
                      📲 Real-time carrier SMS dispatched to your phone!
                    </p>
                  ) : (
                    <div className="pt-0.5 flex items-center justify-center gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Your ChatApp verification code is ${receivedDevOtp}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-ghost text-primary text-[11px] flex items-center gap-1 hover:bg-primary/10"
                      >
                        <BsWhatsapp size={13} /> Open in Guftgu
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>
                    6-Digit Verification Code
                  </span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsKeyFill />
                  </span>
                  <input
                    type="text"
                    name="otp"
                    placeholder="••••••"
                    className="input input-bordered w-full pl-10 tracking-[0.35em] text-center font-mono text-xl font-bold rounded-xl"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-control mt-6">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className={primaryBtn}
                >
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Verify Phone & Start Chatting"
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs mt-3 px-1">
                <button
                  type="button"
                  className="btn btn-link btn-xs text-base-content/60 no-underline hover:text-primary transition-colors p-0"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Edit Phone Number
                </button>

                <button
                  type="button"
                  className={`btn btn-link btn-xs no-underline transition-colors p-0 flex items-center gap-1 ${
                    countdown > 0
                      ? "text-base-content/40 cursor-not-allowed"
                      : "text-primary hover:underline"
                  }`}
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resending || loading}
                >
                  <BsArrowRepeat className={resending ? "animate-spin" : ""} />
                  {resending
                    ? "Sending..."
                    : countdown > 0
                      ? `Resend in ${countdown}s`
                      : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="divider text-base-content/50">OR</div>
              <p className="text-center text-base-content/70 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="link link-primary font-semibold hover:opacity-80 transition-opacity"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
