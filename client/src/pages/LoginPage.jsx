import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { AuthLayout, PasswordInput, AuthError } from '../components/auth/index.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if student arrived from session expiration or protected redirect
  const from = location.state?.from?.pathname || '/dashboard';
  const sessionExpired = location.state?.sessionExpired;

  useEffect(() => {
    if (sessionExpired) {
      setError('Your authentication session has expired. Please sign in again to continue.');
    }
  }, [sessionExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please provide both your university email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failure:', err);
      setError(err.message || 'Invalid email address or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your course revision and AI study sessions"
      mode="login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Error Alert */}
        {error && (
          <AuthError error={error} onDismiss={() => setError('')} />
        )}

        {/* Email Field */}
        <div>
          <Input
            id="login-email"
            type="email"
            required
            label="University Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            icon={Mail}
            autoComplete="email"
            autoFocus
          />
        </div>

        {/* Password Field with Show/Hide Toggle */}
        <div>
          <PasswordInput
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            icon={loading ? undefined : LogIn}
            className="w-full justify-center py-3 text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20"
          >
            {loading ? 'Signing In...' : 'Sign In to StudyAI'}
          </Button>
        </div>

        {/* Registration Link */}
        <div className="pt-4 border-t border-subtle text-center">
          <p className="text-xs text-muted">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold light:text-indigo-600 transition"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
