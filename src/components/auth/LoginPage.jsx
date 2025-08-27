import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';

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

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">
              {isSignup ? 'Create Account' : 'Login'}
            </h1>
            <p className="mt-2 text-neutral-600">
              {isSignup ? 'Start managing your contractor estimates' : 'Access your contractor estimates'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isSignup}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  minLength={isSignup ? 6 : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-200 rounded-md bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || !email || !password || (isSignup && !displayName)}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
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
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {!isSignup && (
              <div>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    // You can implement password reset here
                    alert('Password reset functionality would be implemented here');
                  }}
                >
                  Forgot your password?
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
