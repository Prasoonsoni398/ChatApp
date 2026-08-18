import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsEnvelopeFill, BsLockFill } from 'react-icons/bs';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      toast.success('Successfully logged in!');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, _id: data._id }));
      navigate('/chat');
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 !rounded-3xl">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold text-center justify-center mb-6 text-base-content">
            Welcome Back
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <div className="input-group relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/50">
                  <BsEnvelopeFill />
                </span>
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@example.com" 
                  className="input input-bordered w-full pl-10 rounded-xl" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <div className="input-group relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/50">
                  <BsLockFill />
                </span>
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••" 
                  className="input input-bordered w-full pl-10 rounded-xl" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <label className="label">
                <a href="#" className="label-text-alt link link-hover text-primary">Forgot password?</a>
              </label>
            </div>

            <div className="form-control mt-6">
              <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-lg shadow-primary/30 rounded-xl">
                {loading ? <span className="loading loading-spinner"></span> : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="divider text-base-content/50">OR</div>

          <p className="text-center text-base-content/70">
            Don't have an account?{' '}
            <Link to="/signup" className="link link-primary font-semibold hover:opacity-80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
