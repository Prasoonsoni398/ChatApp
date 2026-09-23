import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsEnvelopeFill, BsLockFill } from "react-icons/bs";
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
    email: "",
    password: "",
  });
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
      const data = await loginUser(formData.email, formData.password);
      toast.success("Successfully logged in!");
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ name: data.name, email: data.email, _id: data._id }),
      );
      navigate("/chat");
    } catch (error) {
      toast.error(error.message);
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
        JSON.stringify({ name: data.name, email: data.email, _id: data._id }),
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
                <span className={authLabelText}>Email</span>
              </label>
              <div className={authInputGroup}>
                <span className={authInputIconSpan}>
                  <BsEnvelopeFill />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className={authInput}
                  value={formData.email}
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
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className={authInput}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
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
