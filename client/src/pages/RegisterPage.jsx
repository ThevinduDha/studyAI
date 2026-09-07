import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, User, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button, Card, Input } from '../components/ui';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please provide a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });
      navigate('/modules', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
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
            Create your StudyAI Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 light:text-slate-600">
            Join StudyAI to personalize your lecture-grounded revision experience
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
              id="register-name"
              type="text"
              required
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Mercer"
              icon={User}
              autoComplete="name"
            />

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

            <Input
              id="register-password"
              type="password"
              required
              minLength={6}
              label="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              autoComplete="new-password"
            />

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-2">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition cursor-pointer ${
                    role === 'student'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm light:bg-indigo-50 light:text-indigo-900'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 light:bg-slate-50 light:border-slate-200 light:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    <span>Student</span>
                  </div>
                  <span className="text-[11px] text-slate-400 light:text-slate-500 leading-tight">
                    Access coursework, practice quizzes & analytics
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition cursor-pointer ${
                    role === 'admin'
                      ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm light:bg-purple-50 light:text-purple-900'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 light:bg-slate-50 light:border-slate-200 light:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                    <span>Administrator</span>
                  </div>
                  <span className="text-[11px] text-slate-400 light:text-slate-500 leading-tight">
                    Manage course catalogs, documents & materials
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3"
              size="md"
              rightIcon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 light:border-slate-200 text-center">
            <p className="text-xs text-slate-400 light:text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold light:text-indigo-600">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
