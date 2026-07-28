import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Store,
  Phone,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Zap,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexarisLogo } from './NexarisLogo';
import { PaymentGatewayModal } from './PaymentGatewayModal';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onNavigateHome,
}) => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Password reset link sent! Please check your email inbox.');
      } else {
        setError(res.error || 'Failed to send password reset link.');
      }
      return;
    }

    if (mode === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
      return;
    }

    if (mode === 'register') {
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
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (!slug || !slug.trim()) {
        setError('Please enter a custom menu link (slug).');
        return;
      }

      setLoading(true);
      setError(null);
      const res = await register(
        ownerName,
        email,
        password,
        restaurantName,
        slug,
        undefined,
        phone
      );
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NexarisLogo size="md" showTagline={false} onClick={onNavigateHome} />

          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Branding Showcase & Benefits */}
          <div className="lg:col-span-6 space-y-8 pr-0 lg:pr-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen QR Menu Engine</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Empower Your Restaurant with Digital Elegance.
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Join thousands of modern cafes, dining spaces, and hotel restaurants effortlessly managing live digital menus, instant QR codes, and customer orders.
              </p>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Instant QR Code</h4>
                  <p className="text-xs text-slate-400 mt-0.5">High-res downloadable QR codes for dining tables</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Real-Time Updates</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Update prices, stock, & items without reprinting</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Veg & Food Tags</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Jain, Vegan, No Onion-Garlic, & Allergen indicators</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Secure Cashfree PG</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Instant online payment gateway integration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Full Dedicated Auth Form Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
              
              {/* Card Header & Switcher */}
              <div className="space-y-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {mode === 'login'
                      ? 'Sign In to Your Account'
                      : mode === 'register'
                      ? 'Create Restaurant Account'
                      : 'Recover Account Password'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {mode === 'login'
                      ? 'Access your menu editor, QR codes, and restaurant portal'
                      : mode === 'register'
                      ? 'Register your establishment and publish your digital menu'
                      : 'Enter your registered email address to receive password instructions'}
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                {mode !== 'forgot' && (
                  <div className="grid grid-cols-2 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                        mode === 'login'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                        mode === 'register'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Extra fields for Register */}
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Restaurant / Business Name *
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Royal Punjab Restaurant"
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                        <span>Custom Menu Link (Slug) *</span>
                        <span className="text-[10px] text-slate-500 lowercase">/menu/{slug || 'link'}</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-slate-500 font-bold text-sm">/</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. royal-punjab"
                          value={slug}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
                            setSlug(value);
                            setIsSlugManual(true);
                          }}
                          className="w-full pl-7 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                        This must be unique for your restaurant. If already in use, you will be asked to choose another.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Owner / Manager Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vikram Sharma"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Password field */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Password *
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setError(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {loading
                        ? 'Processing...'
                        : mode === 'login'
                        ? 'Sign In to Dashboard'
                        : mode === 'register'
                        ? 'Start 14-Day Free Trial'
                        : 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold py-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                )}
              </form>

              {/* Bottom Footer Switch */}
              <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                {mode === 'login' ? (
                  <p className="text-xs text-slate-400">
                    Don't have a restaurant account yet?{' '}
                    <button
                      onClick={() => {
                        setMode('register');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1 cursor-pointer"
                    >
                      Sign Up Now
                    </button>
                  </p>
                ) : mode === 'register' ? (
                  <p className="text-xs text-slate-400">
                    Already registered with Nexaris?{' '}
                    <button
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1 cursor-pointer"
                    >
                      Sign In Here
                    </button>
                  </p>
                ) : null}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          © {new Date().getFullYear()} Nexaris Digital Menu Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
