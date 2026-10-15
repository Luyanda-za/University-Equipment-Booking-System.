import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';
import {
  User, Mail, Lock, Sun, Moon, Monitor, LifeBuoy, Loader2,
  Check, Eye, EyeOff, Send, ArrowLeft,
} from 'lucide-react';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

export function Settings({ onNavigate }: SettingsProps) {
  const { profile, session, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Profile name
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState(session?.user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Help message
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [sendingHelp, setSendingHelp] = useState(false);
  const [helpHistory, setHelpHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setNewEmail(session?.user?.email ?? '');
  }, [profile, session]);

  useEffect(() => {
    loadHelpHistory();
  }, []);

  const loadHelpHistory = async () => {
    const { data, error } = await supabase
      .from('help_messages')
      .select('id, subject, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error) {
      setHelpHistory(data ?? []);
    }
    setLoadingHistory(false);
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile?.id);

    setSavingName(false);
    if (error) {
      showToast('Failed to update name.', 'error');
    } else {
      showToast('Name updated successfully.', 'success');
      await refreshProfile();
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim()) {
      showToast('Email cannot be empty.', 'error');
      return;
    }
    if (newEmail.trim() === session?.user?.email) {
      showToast('This is already your email.', 'info');
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      showToast('Failed to update email: ' + error.message, 'error');
    } else {
      showToast('Email update initiated. Please check your new email to confirm the change.', 'success');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);

    // Verify current password by re-authenticating
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email ?? '',
      password: currentPassword,
    });

    if (reauthError) {
      setSavingPassword(false);
      showToast('Current password is incorrect.', 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      showToast('Failed to change password: ' + error.message, 'error');
    } else {
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSendHelp = async () => {
    if (!helpSubject.trim() || !helpMessage.trim()) {
      showToast('Please fill in the subject and message.', 'error');
      return;
    }

    setSendingHelp(true);
    const { error } = await supabase
      .from('help_messages')
      .insert({
        subject: helpSubject.trim(),
        message: helpMessage.trim(),
      });

    setSendingHelp(false);
    if (error) {
      showToast('Failed to send help message.', 'error');
    } else {
      showToast('Help message sent to admin.', 'success');
      setHelpSubject('');
      setHelpMessage('');
      loadHelpHistory();
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onNavigate(profile?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Your account settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          User: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile?.full_name}</span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Name */}
        <SettingsSection icon={User} title="Display Name" description="Update the name shown on your account">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your display name"
              className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || fullName.trim() === profile?.full_name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        </SettingsSection>

        {/* Email */}
        <SettingsSection icon={Mail} title="Email Address" description="Update the email associated with your account">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@university.edu"
              className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSaveEmail}
              disabled={savingEmail || !newEmail.trim() || newEmail.trim() === session?.user?.email}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Update
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            You'll need to confirm the new email before the change takes effect.
          </p>
        </SettingsSection>

        {/* Password */}
        <SettingsSection icon={Lock} title="Change Password" description="Update your account password">
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </SettingsSection>

        {/* Theme */}
        <SettingsSection icon={Sun} title="Theme" description="Choose your preferred appearance">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.mode;
              return (
                <button
                  key={option.mode}
                  onClick={() => setTheme(option.mode)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        {/* Help & Support */}
        <SettingsSection icon={LifeBuoy} title="Help & Support" description="Send a message to the admin team">
          <div className="space-y-3">
            <input
              type="text"
              value={helpSubject}
              onChange={(e) => setHelpSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <textarea
              value={helpMessage}
              onChange={(e) => setHelpMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
            <button
              onClick={handleSendHelp}
              disabled={sendingHelp || !helpSubject.trim() || !helpMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {sendingHelp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to Admin
            </button>

            {/* Help history */}
            {!loadingHistory && helpHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Your recent messages</p>
                <div className="space-y-2">
                  {helpHistory.map((msg) => (
                    <div key={msg.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{msg.subject}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          msg.status === 'open'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{msg.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
