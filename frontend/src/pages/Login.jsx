import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sprout, Lock, User, AlertCircle } from 'lucide-react';
import API from '../utils/axiosConfig';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({ name: 'Rehman Agro Traders' });

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, send to dashboard
    if (user) {
      navigate('/');
    }

    const fetchBusiness = async () => {
      try {
        const { data } = await API.get('/settings/profile');
        if (data) setBusinessProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBusiness();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Invalid username or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-950 via-emerald-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-500 to-emerald-700 text-white shadow-xl shadow-primary-500/20">
            <Sprout size={36} className="animate-bounce" />
          </div>
          <h2 className="mt-6 font-sans text-3xl font-extrabold text-white tracking-wide">
            {businessProfile.name}
          </h2>
          <p className="mt-2 text-sm text-emerald-200/80">
            Stock Management & Ledger System
          </p>
        </div>

        <div className="border border-white/10 bg-white/10 backdrop-blur-xl px-6 py-8 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-sm text-red-200">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-emerald-100/90 mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-300/60">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 text-white placeholder-emerald-300/40 rounded-xl outline-none transition-all login-input"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-100/90 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-300/60">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 text-white placeholder-emerald-300/40 rounded-xl outline-none transition-all login-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-emerald-700 hover:from-primary-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-primary-700/20 active:scale-95 transition-all duration-150"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center text-xs text-emerald-400/50">
          <p>© {new Date().getFullYear()} Rehman Agro Traders. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
