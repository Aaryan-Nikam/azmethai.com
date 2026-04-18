'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bot, Loader2, AlertCircle, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard/command-center`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bot size={26} className="text-gray-900" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Azmeth OS</h1>
          <p className="text-sm text-gray-400 mt-1">AI-native sales operations</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-7">Sign in to access your dashboard</p>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl mb-5 text-sm text-red-400">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold text-sm py-3.5 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-gray-500" />
            ) : (
              <Chrome size={18} className="text-gray-700" />
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p className="text-center text-xs text-gray-600 mt-5">
            By signing in you agree to our Terms of Service.
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Azmeth AI © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
