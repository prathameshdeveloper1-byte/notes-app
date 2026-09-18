'use client';

import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { BookOpen, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccessMsg('Account created successfully! Check your email to confirm if required, or sign in.');
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper-100 dark:bg-ink-900">
      <div className="w-full max-w-md bg-white dark:bg-ink-800 rounded-3xl shadow-page border border-paper-200 dark:border-ink-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-paper-200 dark:bg-ink-700 text-ink-800 dark:text-paper-100 mb-3 shadow-card">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink-800 dark:text-paper-100">
            Book Notes
          </h1>
          <p className="text-xs text-ink-400 mt-1">
            {isSignUp ? 'Create your personal notebook cloud account' : 'Sign in to access your private notes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-paper-100 dark:bg-ink-700/50 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-white dark:bg-ink-800 text-ink-800 dark:text-paper-100 shadow-sm'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isSignUp
                ? 'bg-white dark:bg-ink-800 text-ink-800 dark:text-paper-100 shadow-sm'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-xl">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-paper-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-paper-50 dark:bg-ink-700 border border-paper-200 dark:border-ink-600 rounded-xl text-sm text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-paper-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-paper-50 dark:bg-ink-700 border border-paper-200 dark:border-ink-600 rounded-xl text-sm text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-ink-800 dark:bg-paper-200 hover:bg-ink-700 dark:hover:bg-paper-100 text-white dark:text-ink-900 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-card disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In to My Books'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-ink-400 hover:text-ink-600 transition">
            &larr; Back to Notebook Shelf
          </Link>
        </div>
      </div>
    </div>
  );
}
