import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('developer');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Please check your connection and API URL.'
          : '') ||
        'Failed to sign in. Please check your credentials.';
      setErrorMsg(message);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reviewer') {
      setValue('email', 'reviewer@buildboard.com');
      setValue('password', 'password123');
    } else if (tab === 'admin') {
      setValue('email', 'admin@buildboard.com');
      setValue('password', 'password123');
    } else {
      setValue('email', '');
      setValue('password', '');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--text-main)] flex items-center justify-center mb-6">
          <span className="text-[var(--bg-main)] font-bold text-2xl">D</span>
        </div>
        <h2 className="text-center text-2xl font-light tracking-tight text-[var(--text-main)]">
          {activeTab === 'admin' ? 'Admin Portal' : activeTab === 'reviewer' ? 'Reviewer Portal' : 'Sign in to BuildBoard+'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel py-6 px-4 sm:px-10">
          <div className="flex border-b border-[var(--border-main)] mb-6">
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'developer' ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              onClick={() => handleTabChange('developer')}
            >
              Developer
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'reviewer' ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              onClick={() => handleTabChange('reviewer')}
            >
              Reviewer
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'admin' ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              onClick={() => handleTabChange('admin')}
            >
              Admin
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 text-[var(--brand-danger)] px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{errorMsg}</span>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                className={`input-field ${errors.password ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.password.message}</p>}
              <div className="flex justify-end mt-1">
                <a href="#" className="text-xs text-[var(--brand-primary)] hover:underline">Forgot password?</a>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        
        <p className="mt-4 text-center text-sm text-[var(--text-main)] border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)] shadow-sm">
          New to BuildBoard+? <Link to="/register" className="text-[var(--brand-primary)] hover:underline">Create an account</Link>.
        </p>
      </div>
    </div>
  );
};

export default Login;
