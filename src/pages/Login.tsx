import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

type ForgotStep = 'email' | 'code' | 'reset';

export function Login({ onNavigate }: LoginProps) {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back!', 'success');
      onNavigate('dashboard');
    }
  };

  // Step 1: Send OTP code to email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: resetEmail.trim(),
      options: { shouldCreateUser: false },
    });
    setForgotLoading(false);

    if (error) {
      showToast('Failed to send code: ' + error.message, 'error');
    } else {
      showToast('A 6-digit code has been sent to your email.', 'success');
      setForgotStep('code');
    }
  };

  // Step 2: Verify the OTP code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      showToast('Please enter the code from your email.', 'error');
      return;
    }
    if (otpCode.trim().length !== 6) {
      showToast('The code must be 6 digits.', 'error');
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: resetEmail.trim(),
      token: otpCode.trim(),
      type: 'email',
    });
    setForgotLoading(false);

    if (error) {
      showToast('Invalid or expired code. Please try again.', 'error');
    } else {
      showToast('Code verified. You can now set a new password.', 'success');
      setForgotStep('reset');
    }
  };

  // Step 3: Set the new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      showToast('Please fill in both password fields.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setForgotLoading(false);

    if (error) {
      showToast('Failed to reset password: ' + error.message, 'error');
    } else {
      showToast('Password reset successfully. Please sign in with your new password.', 'success');
      await supabase.auth.signOut();
      resetForgotState();
      setShowForgot(false);
    }
  };

  const resetForgotState = () => {
    setForgotStep('email');
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleBackToLogin = () => {
    resetForgotState();
    setShowForgot(false);
  };

  // Forgot password view
  if (showForgot) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        {/* Background Repeating Hat Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute top-12 left-16 transform -rotate-12"><GraduationCap className="w-24 h-24 text-blue-700" /></div>
          <div className="absolute top-24 left-1/3 transform rotate-12"><GraduationCap className="w-28 h-28 text-blue-800" /></div>
          <div className="absolute top-10 right-20 transform rotate-45"><GraduationCap className="w-32 h-32 text-blue-600" /></div>
          <div className="absolute top-1/2 left-10 transform -rotate-45"><GraduationCap className="w-20 h-20 text-blue-900" /></div>
          <div className="absolute bottom-16 left-1/4 transform rotate-12"><GraduationCap className="w-36 h-36 text-blue-700" /></div>
          <div className="absolute bottom-10 right-1/4 transform -rotate-30"><GraduationCap className="w-28 h-28 text-blue-600" /></div>
          <div className="absolute left-1/4 top-1/3 transform -rotate-12 opacity-30"><GraduationCap className="w-64 h-64 text-blue-800" /></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 bg-blue-600 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-blue-600/40 ring-4 ring-white dark:ring-slate-800">
              <GraduationCap className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">UniEquip</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">University Equipment Booking System</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={forgotStep === 'email'} label="1" done={forgotStep !== 'email'} />
              <div className={`flex-1 h-0.5 ${forgotStep !== 'email' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
              <StepDot active={forgotStep === 'code'} label="2" done={forgotStep === 'reset'} />
              <div className={`flex-1 h-0.5 ${forgotStep === 'reset' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
              <StepDot active={forgotStep === 'reset'} label="3" done={false} />
            </div>

            {/* Step 1: Email */}
            {forgotStep === 'email' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Reset Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email to receive a verification code</p>
                  </div>
                </div>

<<<<<<< Updated upstream
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {forgotLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Enter code */}
            {forgotStep === 'code' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Enter Verification Code</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      A 6-digit code was sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{resetEmail}</span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-2xl font-bold tracking-[0.5em] px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || otpCode.length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {forgotLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={forgotLoading}
                    className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Didn't receive a code? Resend
                  </button>
                </form>
              </>
            )}

            {/* Step 3: New password */}
            {forgotStep === 'reset' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Set New Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose a new password for your account</p>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pr-10 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading || !newPassword || !confirmNewPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
=======
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
>>>>>>> Stashed changes

            <button
              onClick={handleBackToLogin}
              className="mt-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Background Repeating Hat Pattern matching mockup style */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-12 left-16 transform -rotate-12"><GraduationCap className="w-24 h-24 text-blue-700" /></div>
        <div className="absolute top-24 left-1/3 transform rotate-12"><GraduationCap className="w-28 h-28 text-blue-800" /></div>
        <div className="absolute top-10 right-20 transform rotate-45"><GraduationCap className="w-32 h-32 text-blue-600" /></div>
        <div className="absolute top-1/2 left-10 transform -rotate-45"><GraduationCap className="w-20 h-20 text-blue-900" /></div>
        <div className="absolute bottom-16 left-1/4 transform rotate-12"><GraduationCap className="w-36 h-36 text-blue-700" /></div>
        <div className="absolute bottom-10 right-1/4 transform -rotate-30"><GraduationCap className="w-28 h-28 text-blue-600" /></div>
        {/* Large Watermark Cap in background */}
        <div className="absolute left-12 bottom-1/4 transform -rotate-12 opacity-25"><GraduationCap className="w-72 h-72 text-blue-800" /></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Massive Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 bg-blue-600 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-blue-600/40 ring-4 ring-white dark:ring-slate-800 transform transition hover:scale-105">
            <GraduationCap className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">UniEquip</h1>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">University Equipment Booking System</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Sign in to your account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button onClick={() => onNavigate('register')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                Register here
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
<<<<<<< Updated upstream
}

function StepDot({ active, label, done }: { active: boolean; label: string; done: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        done
          ? 'bg-blue-500 text-white'
          : active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
      }`}
    >
      {label}
    </div>
  );
}
=======
}
>>>>>>> Stashed changes
