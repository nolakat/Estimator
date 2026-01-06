import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, UserPlus, HardHat, Loader2 } from 'lucide-react';

export function LoginPage({ onLogin, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup && onSignup) {
        await onSignup(email, password, displayName);
      } else if (onLogin) {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setDisplayName('');
  };

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-slate-500">
            {isSignup ? 'Start managing your contractor estimates' : 'Sign in to access your estimates'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label htmlFor="displayName" className={labelClasses}>Full Name</label>
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Enter your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={isSignup}
                    className={inputClasses}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClasses}>Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isSignup ? 6 : undefined}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 border border-red-200 rounded-xl bg-red-50">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password || (isSignup && !displayName)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignup ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignup ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 sm:px-8 bg-slate-50 border-t border-slate-100">
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>

              {!isSignup && (
                <div>
                  <button
                    type="button"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset functionality would be implemented here');
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Contractor Estimator. All rights reserved.
        </p>
      </div>
    </div>
  );
}
