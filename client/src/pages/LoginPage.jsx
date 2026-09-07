import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button, Card, CardContent, Input } from '../components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/modules';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/25 mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
            Welcome back to StudyAI
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 light:text-slate-600">
            Sign in to access your modules, lecture notes, and AI study companion
          </p>
        </div>

        {/* Card Container */}
        <Card className="p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2.5 light:bg-rose-50 light:border-rose-200 light:text-rose-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
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
            />

            <Input
              id="login-password"
              type="password"
              required
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3"
              size="md"
              rightIcon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 light:border-slate-200 text-center">
            <p className="text-xs text-slate-400 light:text-slate-600">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold light:text-indigo-600">
                Create an account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
