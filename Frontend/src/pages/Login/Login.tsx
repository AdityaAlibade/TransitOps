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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      {/* Outer Card with subtle drop shadow and borders */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 p-8 md:p-10 space-y-8">
        
        {/* Header Block */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-md shadow-blue-200 mb-2">
            T
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Welcome to TransitOps</h2>
          <p className="text-sm text-slate-400">Fleet Operations Management Console</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-medium text-rose-600 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Mock Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@transitops.com"
              required
              disabled={submitting}
              className="block w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Security Password
              </label>
              <span className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
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
              className="block w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              disabled={submitting}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-xs text-slate-500 select-none">
              Keep me signed in on this terminal
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl transition duration-150 shadow-md shadow-blue-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-50 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          TransitOps Control Tower v1.0
        </div>
      </div>
    </div>
  );
};
