import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BsEnvelopeFill,
  BsLockFill,
  BsEyeFill,
  BsEyeSlashFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import useAuthRedirect from "../hooks/useAuthRedirect.js";
import { loginUser, googleLogin } from "../services/authService.js";
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

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useAuthRedirect();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(formData.identifier, formData.password);
      toast.success("Successfully logged in!");
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          _id: data._id,
          avatar: data.avatar,
        }),
      );
      navigate("/chat");
    } catch (error) {
      toast.error(error.message);
      if (error.needsVerification) {
        navigate("/signup", {
          state: {
            phone: error.phone || formData.identifier,
            devOtp: error.devOtp,
            step: 2,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      toast.success("Successfully logged in with Google!");
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          _id: data._id,
          avatar: data.avatar,
        }),
      );
      navigate("/chat");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className={authPageWrapper}>
      <div className={authCard}>
        <div className="card-body">
          <h2 className={authCardTitle}>Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={authFormControl}>
              <label className={authLabel}>
                <span className={authLabelText}>Phone Number or Email</span>
              </label>
              <div className={authInputGroup}>
                <span className={authInputIconSpan}>
                  <BsEnvelopeFill />
                </span>
                <input
                  type="text"
                  name="identifier"
                  placeholder="+91 98765 43210 or name@example.com"
                  className={authInput}
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={authFormControl}>
              <label className={authLabel}>
                <span className={authLabelText}>Password</span>
              </label>
              <div className={authInputGroup}>
                <span className={authInputIconSpan}>
                  <BsLockFill />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className={`${authInput} pr-10`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/50 hover:text-base-content z-20 cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <BsEyeSlashFill size={17} />
                  ) : (
                    <BsEyeFill size={17} />
                  )}
                </button>
              </div>
              <label className={authLabel}>
                <Link
                  to="/forgot-password"
                  className="label-text-alt link link-hover text-primary"
                >
                  Forgot password?
                </Link>
              </label>
            </div>

            <div className="form-control mt-6">
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="divider text-base-content/50">OR</div>

          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Google Login Failed");
              }}
              shape="pill"
            />
          </div>

          <p className="text-center text-base-content/70">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="link link-primary font-semibold hover:opacity-80"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
