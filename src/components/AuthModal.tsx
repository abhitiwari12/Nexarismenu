import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Store, Phone, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexarisLogo } from './NexarisLogo';
import { PaymentGatewayModal } from './PaymentGatewayModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  const { login, register, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (tab === 'forgot') {
      setLoading(true);
      if (!email) {
        setError('Please enter your email address.');
        setLoading(false);
        return;
      }
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Password reset link sent! Check your inbox.');
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
      return;
    }

    if (tab === 'login') {
      setLoading(true);
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Login failed');
      }
    }
    
    if (tab === 'register') {
      if (!ownerName || !restaurantName || !email || !password || !phone) {
        setError('All registration fields including mobile number are required.');
        return;
      }
      
      // Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address (e.g., user@example.com).');
        return;
      }

      // Mobile validation: strip formatting, check that we have between 7 and 15 digits
      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setError('Please enter a valid mobile number (must contain between 7 and 15 digits).');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      
      if (!slug || !slug.trim()) {
        setError('Please enter a custom menu link (slug).');
        return;
      }

      setLoading(true);
      setError(null);
      const res = await register(ownerName, email, password, restaurantName, slug, undefined, phone);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-3">
            <NexarisLogo size="sm" showTagline={false} />
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {tab === 'login'
              ? 'Welcome Back to Nexaris'
              : tab === 'register'
              ? 'Start Your Digital Menu'
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {tab === 'login'
              ? 'Sign in to manage dishes, categories & QR code'
              : tab === 'register'
              ? 'Register your restaurant and launch your QR menu'
              : 'Enter your account email to receive a password recovery link'}
          </p>

          {/* Tab Switcher */}
          {tab !== 'forgot' && (
            <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 rounded-xl backdrop-blur-xs">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Restaurant Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bella Italia Bistro"
                    value={restaurantName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRestaurantName(val);
                      if (!isSlugManual) {
                        const suggested = val
                          .toLowerCase()
                          .replace(/[\s_]+/g, '-')
                          .replace(/[^a-z0-9-]/g, '');
                        setSlug(suggested);
                      }
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex justify-between items-center">
                  <span>Custom Menu Link (Slug) *</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 lowercase">/menu/{slug || 'link'}</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 font-bold text-sm">/</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bella-italia"
                    value={slug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setSlug(value);
                      setIsSlugManual(true);
                    }}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                  This must be unique for your restaurant. If already in use, you will be asked to choose another.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Marco Rossi"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="owner@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password *
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>
              {tab === 'login'
                ? 'Sign In'
                : tab === 'register'
                ? 'Start 14-Day Free Trial'
                : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {tab === 'forgot' && (
            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
