import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { authService } from '../../services/authService';
import { LoginPage } from './LoginPage';
import { LogOut, User, HardHat, Loader2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { STORAGE_KEY } from '../../constants/estimator';

// Helper to clear user-specific localStorage data on logout
const clearUserLocalStorage = (userId) => {
  if (!userId) return;

  // Clear user-specific keys
  const keysToRemove = [
    `contractor-estimator-company-${userId}`,
    `${STORAGE_KEY}-${userId}`,
    `contractor_estimator_products-${userId}`,
    `contractor-estimator-signature-${userId}`,
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  });

  console.log('Cleared user localStorage data on logout');
};

// Create a context to share user throughout the app
const UserContext = createContext(null);

// Hook to access user from any component
export function useUser() {
  return useContext(UserContext);
}

export function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await authService.login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (email, password, displayName) => {
    try {
      await authService.signup(email, password, displayName);
    } catch (error) {
      throw error;
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      // Clear user-specific localStorage data before logging out
      if (user?.uid) {
        clearUserLocalStorage(user.uid);
      }
      await authService.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResendVerification = async () => {
    setResendError('');
    setResendSuccess(false);
    setResendingEmail(true);
    try {
      await authService.resendVerificationEmail(user);
      setResendSuccess(true);
    } catch (error) {
      setResendError(error.message || 'Failed to send verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      // Reload the user to get the latest emailVerified status
      await user.reload();
      // Force a state update by getting the current user again
      const currentUser = auth.currentUser;
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 shadow-xl rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <div className="absolute border-2 -inset-4 rounded-3xl border-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <p className="font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        onResetPassword={handleResetPassword}
      />
    );
  }

  // Show email verification screen if email is not verified
  if (!user.emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Verify Your Email</h1>
            <p className="mt-2 text-slate-500">
              We've sent a verification link to your email
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>

                <p className="mb-6 text-sm text-slate-600">
                  Please check your inbox and click the verification link to activate your account.
                  If you don't see the email, check your spam folder.
                </p>

                {resendSuccess && (
                  <div className="flex items-center gap-2 p-3 mb-4 border border-green-200 rounded-xl bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">Verification email sent! Check your inbox.</p>
                  </div>
                )}

                {resendError && (
                  <div className="p-3 mb-4 border border-red-200 rounded-xl bg-red-50">
                    <p className="text-sm text-red-600">{resendError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleCheckVerification}
                    disabled={checkingVerification}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingVerification ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        I've Verified My Email
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 sm:px-8 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Signed in as {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
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

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        {/* User Header Bar */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between max-w-6xl px-4 py-2.5 mx-auto md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
        {children}
      </div>
    </UserContext.Provider>
  );
}
