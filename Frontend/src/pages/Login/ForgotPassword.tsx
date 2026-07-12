import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('Reset code generated! Please request the code from your system administrator (visible in Admin Security Audit Trail) to complete your password update.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit forgot password request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        token: code,
        newPassword
      });
      setSuccessMsg('Password has been reset successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2050);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification token or expiry.');
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
            Account Security<br />Verification Hub.
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Protecting logistics assets and driver metadata with end-to-end audit tracking. Contact your administrator if you are locked out of your terminal access.
          </p>
        </div>
      </div>

      {/* Right side: Reset form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#080c14] relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 lg:hidden pointer-events-none"
          style={{ backgroundImage: "url('/logistics_hero.png')" }}
        />
        
        {/* Card */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-6 relative z-10 glow-red">
          {/* Header Block */}
          <div className="text-center space-y-2 lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Reset Password</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Secure Account Recovery</p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-400 leading-relaxed">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-semibold text-emerald-400 leading-relaxed">
              {successMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-2xl transition duration-150 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Generating code...' : 'Request Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Verification Code (from Admin log)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  disabled={submitting}
                  className="block w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-2xl placeholder-slate-650 focus:outline-none focus:border-rose-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={submitting}
                  className="block w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-2xl placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={submitting}
                  className="block w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-2xl placeholder-slate-650 focus:outline-none focus:border-rose-500 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-2xl transition duration-150 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Resetting password...' : 'Complete Password Reset'}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-slate-450 hover:text-rose-400 hover:underline">
              Return to Login Screen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
