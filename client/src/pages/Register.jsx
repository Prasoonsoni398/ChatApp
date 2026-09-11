import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsEnvelopeFill, BsLockFill, BsPersonFill, BsKeyFill } from 'react-icons/bs';
import toast from 'react-hot-toast';
import useAuthRedirect from '../hooks/useAuthRedirect.js';
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
} from '../constants/styles.js';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useAuthRedirect();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Using fetch assuming a vite proxy is set up or full URL is needed if not.
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      toast.success(data.message || 'OTP sent to your email!');
      setStep(2); // Move to OTP verification
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      
      // Store token (if any) and redirect
      // localStorage.setItem('token', data.token);
      toast.success('User registered successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={authPageWrapper}>
      <div className={authCard}>
        <div className="card-body">
          <h2 className={authCardTitle}>
            {step === 1 ? 'Create an Account' : 'Verify Email'}
          </h2>

          {step === 1 ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                    placeholder="John Doe" 
                    className={authInput} 
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
              </div>

              <div className="form-control mt-6">
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? <span className="loading loading-spinner"></span> : 'Sign Up'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <p className="text-center text-base-content/70 mb-4 text-sm">
                We've sent a 6-digit verification code to <br/>
                <strong className="text-base-content">{formData.email}</strong>
              </p>
              
              <div className={authFormControl}>
                <label className={authLabel}>
                  <span className={authLabelText}>Verification Code</span>
                </label>
                <div className={authInputGroup}>
                  <span className={authInputIconSpan}>
                    <BsKeyFill />
                  </span>
                  <input 
                    type="text" 
                    name="otp"
                    placeholder="Enter 6-digit OTP" 
                  className="input input-bordered w-full pl-10 tracking-widest text-center font-mono text-lg rounded-xl" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control mt-6">
                <button type="submit" disabled={loading || otp.length < 6} className={primaryBtn}>
                  {loading ? <span className="loading loading-spinner"></span> : 'Verify Code'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  className="btn btn-link btn-sm text-base-content/60 no-underline hover:text-primary transition-colors"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back to Registration
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="divider text-base-content/50">OR</div>
              <p className="text-center text-base-content/70">
                Already have an account?{' '}
                <Link to="/login" className="link link-primary font-semibold hover:opacity-80 transition-opacity">
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
