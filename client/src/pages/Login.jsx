import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BsEnvelopeFill, BsLockFill } from 'react-icons/bs';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
    // Add actual login logic here
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
                  className="input input-bordered w-full pl-10" 
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
                  className="input input-bordered w-full pl-10" 
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
              <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/30">
                Sign In
              </button>
            </div>
          </form>

          <div className="divider text-base-content/50">OR</div>

          <p className="text-center text-base-content/70">
            Don't have an account?{' '}
            <Link to="/signup" className="link link-primary font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
