import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){2,38}$/,
      'Use 3-39 lowercase letters/numbers; hyphen cannot end username'
    ),
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['developer', 'reviewer', 'admin']).default('developer'),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'developer',
    },
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      await registerUser(data);
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Please check your connection and API URL.'
          : '') ||
        'Failed to register. Please try again.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--text-main)] flex items-center justify-center mb-6">
          <span className="text-[var(--bg-main)] font-bold text-2xl">D</span>
        </div>
        <h2 className="text-center text-2xl font-light tracking-tight text-[var(--text-main)]">
          Create your account
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="panel py-6 px-4 sm:px-10">
          {errorMsg && (
            <div className="mb-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 text-[var(--brand-danger)] px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                {...register('username')}
                className={`input-field ${errors.username ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
                autoComplete="username"
              />
              {errors.username && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                {...register('name')}
                className={`input-field ${errors.name ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.name.message}</p>}
            </div>

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
                autoComplete="new-password"
              />
              {errors.password && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Role</label>
              <select
                {...register('role')}
                className={`input-field ${errors.role ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
              >
                <option value="developer">Developer (User)</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.role.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Sign up for BuildBoard+'}
            </button>
          </form>
        </div>
        
        <p className="mt-4 text-center text-sm text-[var(--text-main)] border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)] shadow-sm">
          Already have an account? <Link to="/login" className="text-[var(--brand-primary)] hover:underline">Sign in</Link>.
        </p>
      </div>
    </div>
  );
};

export default Register;
