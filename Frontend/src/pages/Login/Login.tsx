import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error details:', err);
      setErrorMsg(err.message || 'Invalid credentials or connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080c14] overflow-hidden">
      {/* Left side: Premium Image Banner with text overlays */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/logistics_hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/80" />
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-rose-500/30">
            T
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Smarter Transport.<br />Faster Deliveries.<br />Nationwide Reach.
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Experience technology-driven transport solutions built for speed, safety, and efficiency — from freight and logistics to last-mile delivery.
          </p>
          <div className="flex items-center space-x-6 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            <div>
              <span className="text-white text-2xl font-extrabold block">25+</span>
              Years of Logistics
            </div>
            <div className="border-l border-slate-800 h-8" />
            <div>
              <span className="text-white text-2xl font-extrabold block">1.2M+</span>
              Deliveries Completed
            </div>
            <div className="border-l border-slate-800 h-8" />
            <div>
              <span className="text-white text-2xl font-extrabold block">180+</span>
              Shipping Vectors
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#080c14] relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 lg:hidden pointer-events-none"
          style={{ backgroundImage: "url('/logistics_hero.png')" }}
        />
        
        {/* Card */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-8 relative z-10 glow-red">
          {/* Header Block (mobile only shows logo) */}
          <div className="text-center space-y-2 lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-600 text-white rounded-2xl font-black text-2xl shadow-lg shadow-rose-500/25 mb-2 lg:hidden">
              T
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-xs text-slate-550 uppercase tracking-wide font-bold">Fleet Operations Management Console</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-400 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@transitops.com"
                required
                disabled={submitting}
                className="block w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-2xl placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Security Password
                </label>
                <span className="text-xs text-rose-400 hover:underline cursor-pointer font-semibold">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={submitting}
                className="block w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-2xl placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all duration-200"
              />
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                disabled={submitting}
                className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 select-none">
                Keep me signed in on this terminal
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-2xl transition duration-150 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            TransitOps Control Tower v1.0
          </div>
        </div>
      </div>
    </div>
  );
};
