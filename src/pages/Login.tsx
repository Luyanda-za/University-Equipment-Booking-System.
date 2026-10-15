import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * Props interface for the Login component.
 */
interface LoginProps {
  /** Callback function to handle page routing/navigation */
  onNavigate: (page: string) => void;
}

/**
 * Login Component
 * Renders a full-screen authentication form for user sign-in with email and password,
 * toggleable password visibility, form validation, and quick-fill demo credentials.
 */
export function Login({ onNavigate }: LoginProps) {
  // Custom context hooks for authentication and toast notifications
  const { signIn } = useAuth();
  const { showToast } = useToast();

  // Component State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Controls password field type (text vs. password)
  const [loading, setLoading] = useState(false);           // Manages submit button loading spinner state

  /**
   * Handles form submission for signing in the user.
   * Performs basic validation, calls the auth provider, and routes to the dashboard upon success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent standard browser form refresh

    // Basic empty field validation
    if (!email || !password) {
      showToast('Please enter your email and password.', 'error');
      return;
    }

    setLoading(true);
    
    // Attempt authentication via AuthContext
    const { error } = await signIn(email, password);
    
    setLoading(false);

    // Handle authentication response
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back!', 'success');
      onNavigate('dashboard'); // Redirect user to the dashboard view
    }
  };

  return (
    // Outer Container: Centered layout with subtle gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        
        {/* Header / Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">UniEquip</h1>
          <p className="text-sm text-slate-500 mt-1">University Equipment Booking System</p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Toggleable Visibility */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                
                {/* Password Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Navigation to Registration Page */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <button 
                onClick={() => onNavigate('register')} 
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Register here
              </button>
            </p>
          </div>

          {/* Helper Section: Demo Credentials for Testing */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-600">Admin:</span>
                <span>admin@university.edu / admin12345</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-600">Student:</span>
                <span>student@university.edu / student123</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
