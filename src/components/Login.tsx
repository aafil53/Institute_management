import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, AlertCircle, Loader } from 'lucide-react';

export default function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const success = await login(email, password, role);
    if (!success) {
      setError('Invalid email or password for the selected role');
    }
  };

  const quickLogin = (cred: { email: string; password: string; name: string; role: 'teacher' | 'admin' }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setRole(cred.role);
    // Trigger login after state updates
    setTimeout(() => {
      login(cred.email, cred.password, cred.role).catch(() => {});
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-white p-2.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Attendly</h1>
            </div>
            <p className="text-center text-blue-100 text-sm">Hudur Institute Attendance System</p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-8 sm:px-8">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
                    role === 'teacher'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  👨‍🏫 Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
                    role === 'admin'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  🔐 Admin
                </button>
              </div>
            </div>

            {/* Email Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hudur.edu"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200 ml-2">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            {showDemoCredentials && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-3 font-medium">📋 Demo Credentials (Dev Only)</p>
                <div className="space-y-2">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">
                      <span className="font-medium">Teacher:</span> sara@hudur.edu / teacher123
                    </p>
                    <button
                      type="button"
                      onClick={() => quickLogin({ email: 'sara@hudur.edu', password: 'teacher123', name: 'Sara Khan', role: 'teacher' })}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-all"
                    >
                      Quick Login
                    </button>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">
                      <span className="font-medium">Admin:</span> admin@hudur.edu / admin123
                    </p>
                    <button
                      type="button"
                      onClick={() => quickLogin({ email: 'admin@hudur.edu', password: 'admin123', name: 'Dr. Sarah Admin', role: 'admin' })}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-all"
                    >
                      Quick Login
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoCredentials(false)}
                  className="text-xs text-slate-500 hover:text-slate-400 mt-2"
                >
                  Hide credentials
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-400 text-xs">
          <p>© 2026 Hudur Institute. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
