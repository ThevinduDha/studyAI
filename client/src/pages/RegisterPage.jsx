import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  User,
  Mail,
  GraduationCap,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { AuthLayout, PasswordInput, AuthError } from '../components/auth/index.js';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please provide your full legal or university name.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please provide a valid university email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (role === 'admin' && !adminPasscode.trim()) {
      setError('An administrative authorization key is required to register an administrator account.');
      return;
    }

    setLoading(true);
    try {
      const registeredUser = await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
        adminPasscode: role === 'admin' ? adminPasscode.trim() : undefined
      });
      navigate(registeredUser?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration failure:', err);
      setError(err.message || 'Registration failed. Please check your information or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join StudyAI to personalize your lecture-grounded revision experience"
      mode="register"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Error Alert */}
        {error && (
          <AuthError error={error} onDismiss={() => setError('')} />
        )}

        {/* Full Name */}
        <div>
          <Input
            id="register-name"
            type="text"
            required
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Mercer"
            icon={User}
            autoComplete="name"
            autoFocus
          />
        </div>

        {/* Email Address */}
        <div>
          <Input
            id="register-email"
            type="email"
            required
            label="University Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            icon={Mail}
            autoComplete="email"
          />
        </div>

        {/* Password with Strength Feedback and Show/Hide Toggle */}
        <div>
          <PasswordInput
            id="register-password"
            label="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
            showStrength={true}
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-heading">
            Account Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                role === 'student'
                  ? 'border-indigo-500 bg-indigo-500/10 text-heading shadow-xs'
                  : 'border-subtle bg-subtle/30 text-muted hover:border-subtle hover:text-heading'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <GraduationCap className={`h-4 w-4 ${role === 'student' ? 'text-indigo-400' : 'text-muted'}`} />
                <span>Student</span>
              </div>
              <span className="text-[11px] text-muted leading-snug">
                Coursework, practice tests &amp; analytics
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                role === 'admin'
                  ? 'border-purple-500 bg-purple-500/10 text-heading shadow-xs'
                  : 'border-subtle bg-subtle/30 text-muted hover:border-subtle hover:text-heading'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ShieldCheck className={`h-4 w-4 ${role === 'admin' ? 'text-purple-400' : 'text-muted'}`} />
                <span>Administrator</span>
              </div>
              <span className="text-[11px] text-muted leading-snug">
                Manage catalogs, documents &amp; literature
              </span>
            </button>
          </div>

          {/* Administrative Authorization Key Field */}
          {role === 'admin' && (
            <div className="mt-3 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Administrative Authorization Required</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Enter your institutional authorization passkey to create an administrator account.
              </p>
              <Input
                id="register-admin-passcode"
                type="password"
                label="Admin Passkey"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter admin registration passkey"
                required
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            icon={loading ? undefined : UserPlus}
            className="w-full justify-center py-3 text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </div>

        {/* Login Link */}
        <div className="pt-4 border-t border-subtle text-center">
          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold light:text-indigo-600 transition"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
