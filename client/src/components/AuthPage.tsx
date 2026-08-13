import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  loginUser, 
  registerUser, 
  clearAuthError, 
  googleLoginUser, 
  sendOtpAPI, 
  resetPasswordOtpAPI 
} from '../store/slices/authSlice';
import { LogIn, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';


export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-email' | 'forgot-otp'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Added CredentialResponse type instead of 'any'
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        await dispatch(googleLoginUser(credentialResponse.credential)).unwrap();
      }
    } catch {
      // Removed the unused 'err' parameter
      setLocalError('Google authentication failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setMessage('');
    dispatch(clearAuthError());

    try {
      if (mode === 'login') {
        await dispatch(loginUser({ email, password })).unwrap();
      } else if (mode === 'signup') {
        await dispatch(registerUser({ name, email, password })).unwrap();
      } else if (mode === 'forgot-email') {
        const res = await sendOtpAPI(email);
        setMessage(res.message || 'OTP sent to your email.');
        setMode('forgot-otp');
      } else if (mode === 'forgot-otp') {
        const res = await resetPasswordOtpAPI({ email, otp, password });
        setMessage(res.message || 'Password reset successful!');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setOtp('');
          setMessage('');
        }, 2000);
      }
    } catch (error: unknown) {
      // Safely typed the error response without using 'any'
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setLocalError(err?.response?.data?.message || err?.message || 'An error occurred. Please try again.');
    }
  };

  const toggleMode = () => {
    dispatch(clearAuthError());
    setLocalError('');
    setMessage('');
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 
             mode === 'signup' ? 'Create an Account' : 
             mode === 'forgot-email' ? 'Reset Password' : 'Enter OTP'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Manage your tasks efficiently with TaskCraft' : 
             mode === 'signup' ? 'Get started with your free task management hub' : 
             mode === 'forgot-email' ? 'Enter your email to receive a recovery code' : 'Check your email for the 6-digit code'}
          </p>
        </div>

        {/* Error & Success Messages */}
        {(error || localError) && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm rounded-xl text-center">
            {error || localError}
          </div>
        )}
        {message && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl text-center">
            {message}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              disabled={mode === 'forgot-otp'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {mode === 'forgot-otp' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot-otp') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {mode === 'forgot-otp' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-email');
                      dispatch(clearAuthError());
                      setLocalError('');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mode === 'login' && <LogIn className="w-4 h-4" />}
            {mode === 'signup' && <UserPlus className="w-4 h-4" />}
            
            {isLoading ? 'Processing...' : 
             mode === 'login' ? 'Sign In' : 
             mode === 'signup' ? 'Sign Up' : 
             mode === 'forgot-email' ? 'Send Recovery Code' : 'Reset Password'}
          </button>
        </form>

        {/* Google OAuth Section */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLocalError('Google Login Failed')}
                useOneTap={false}
                shape="rectangular"
                size="large"
                theme="outline"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2">
          {mode === 'forgot-email' || mode === 'forgot-otp' ? (
            <button
              onClick={() => {
                setMode('login');
                setMessage('');
                setLocalError('');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          ) : (
            <button
              onClick={toggleMode}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
