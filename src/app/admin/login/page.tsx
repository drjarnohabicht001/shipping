'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/Components/Button';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import Image from 'next/image';
import Logo from '../../../../public/svg/logo';

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const {
    login,
    completeMfaSignIn,
    cancelMfaSignIn,
    isLoading,
    error,
    isAuthenticated,
    mfaChallenge,
  } = useAuth();
  const router = useRouter();
  const passwordResetSucceeded = searchParams.get('passwordReset') === 'success';

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const resetEmail = searchParams.get('email');
    if (resetEmail) {
      setEmail(resetEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeMfaSignIn(mfaCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E3135] via-[#3a3f45] to-[#2E3135] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/img/bg.webp')] bg-cover bg-center opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>

          {/* Demo Credentials */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Super Admin:</strong> admin@shipping.com / admin123</div>
              <div><strong>User:</strong> user@shipping.com / user123</div>
            </div>
          </div> */}

          {/* Error Message */}
          {passwordResetSucceeded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <span className="text-sm text-green-700">
                Password reset completed. Sign in with your new password to continue.
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {!mfaChallenge ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#FF5A24] hover:text-[#e54a1f] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="py-3 text-base font-semibold"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <p className="font-medium text-amber-900">Multi-factor authentication required</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Enter the code from your authenticator app for `{mfaChallenge.email}`.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Authenticator Code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\s+/g, ''))}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.3em] text-center text-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] transition-colors"
                  placeholder="123456"
                  required
                />
                {mfaChallenge.displayName && (
                  <p className="mt-2 text-xs text-gray-500">
                    Factor: {mfaChallenge.displayName}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={cancelMfaSignIn}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="py-3 text-base font-semibold"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
