import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BsEnvelopeFill,
  BsLockFill,
  BsShieldLockFill,
  BsEyeFill,
  BsEyeSlashFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../services/authService.js";
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

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={authPageWrapper}>
      <div className={authCard}>
        <div className="card-body">
          <h2 className={authCardTitle}>
            {step === 1 ? "Reset Password" : "Enter OTP"}
          </h2>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-center text-base-content/70 mb-4">
                Enter your email address to receive a one-time password (OTP)
                for resetting your password.
              </p>
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>Email</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsEnvelopeFill />
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className={authInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control mt-6">
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-center text-base-content/70 mb-4">
                An OTP has been sent to <strong>{email}</strong>. Enter it below
                along with your new password.
              </p>
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>OTP</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsShieldLockFill />
                  </span>
                  <input
                    type="text"
                    placeholder="123456"
                    className={authInput}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>New Password</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsLockFill />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${authInput} pr-10`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/50 hover:text-base-content z-20 cursor-pointer transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <BsEyeSlashFill size={17} />
                    ) : (
                      <BsEyeFill size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-control mt-6 flex flex-col gap-2">
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="btn btn-ghost w-full rounded-xl"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-base-content/70 mt-4">
            Remember your password?{" "}
            <Link
              to="/login"
              className="link link-primary font-semibold hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
