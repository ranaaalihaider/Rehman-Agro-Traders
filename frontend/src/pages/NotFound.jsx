import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, AlertTriangle, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-800/20 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-900/40">
              <Sprout size={22} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm leading-tight font-sans">Rehman Agro Traders</p>
              <p className="text-primary-300 text-[11px] uppercase tracking-widest">Stock Manager</p>
            </div>
          </div>
        </div>

        {/* 404 Display */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle size={40} />
          </div>
        </div>

        <h1 className="text-8xl font-extrabold text-white mb-2 leading-none tracking-tight font-sans">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white/90 mb-3 font-sans">Page Not Found</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          The page you are looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-primary-900/30 transition-all duration-200 text-sm"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} Rehman Agro Traders. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
