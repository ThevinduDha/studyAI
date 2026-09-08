import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { analyticsService } from '../services/analytics.service.js';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Award,
  BarChart3,
  ArrowRight,
  RefreshCw,
  FileText,
  Target,
  CheckCircle2,
  Clock,
  GraduationCap
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [modulesResult, analyticsResult] = await Promise.allSettled([
        moduleService.getEnrolledModules(),
        analyticsService.getOverview()
      ]);

      if (modulesResult.status === 'fulfilled') {
        setEnrolledModules(Array.isArray(modulesResult.value) ? modulesResult.value : []);
      }

      if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.success) {
        setAnalytics(analyticsResult.value.data);
      }
    } catch (err) {
      console.warn('Dashboard data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const studentName = user?.name?.split(' ')[0] || 'Student';
  const overview = analytics?.overview || {};
  const hasQuizData = analytics?.hasData && overview.totalQuizzesCompleted > 0;

  // Primary active course for Continue Studying
  const primaryModule = enrolledModules[0] || null;
  const primaryDoc = primaryModule?.documents?.[0] || null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <Skeleton height="h-36" className="w-full rounded-2xl" />
        <SkeletonCard className="h-44" />
        <SkeletonGrid count={3} />
        <SkeletonCard className="h-36" />
        <SkeletonGrid count={2} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. WELCOME SECTION */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 light:from-indigo-50 light:via-purple-50 light:to-slate-50 border border-indigo-500/20 light:border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 light:text-indigo-600 uppercase tracking-wider">
              Student Workspace
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-heading">
            {getGreeting()}, {studentName}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            What would you like to study today?
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={Sparkles}
            onClick={() => navigate('/assistant')}
            className="shadow-md shadow-indigo-600/20"
          >
            Ask AI Tutor
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={() => loadData(true)}
            loading={refreshing}
            title="Refresh dashboard"
          />
        </div>
      </div>

      {/* 2. CONTINUE STUDYING */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Continue Studying
          </h2>
          <Link
            to="/modules"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>All Courses</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {primaryModule ? (
          <Card className="p-5 sm:p-6 border border-subtle hover:border-indigo-500/40 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo" size="xs">
                      {primaryModule.moduleCode}
                    </Badge>
                    <span className="text-xs text-muted">
                      {primaryModule.semester} &bull; {primaryModule.year}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-heading">
                    {primaryModule.moduleName}
                  </h3>
                  {primaryDoc ? (
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Latest Lecture: {primaryDoc.originalName}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted">
                      {primaryModule.description || 'Course enrolled and active for study.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate(`/modules`)}
                >
                  Continue Studying
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center border border-subtle space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-heading">No Enrolled Courses Yet</h3>
              <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                Enroll in university courses to unlock lecture notes, study materials, and AI tutoring.
              </p>
            </div>
            <div>
              <Button
                variant="primary"
                size="sm"
                icon={BookOpen}
                onClick={() => navigate('/modules')}
              >
                Browse Course Catalog
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 3. QUICK ACTIONS (3 Clear Pillars) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Action 1: AI Tutor */}
          <Card
            hoverable={true}
            onClick={() => navigate('/assistant')}
            className="p-5 border border-subtle hover:border-indigo-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-heading group-hover:text-indigo-400 transition">
                  AI Tutor
                </h3>
                <p className="text-xs text-muted mt-1">
                  Ask questions grounded in your uploaded lecture notes with direct citations.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-subtle flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition">
              <span>Ask Tutor</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Card>

          {/* Action 2: Practice Questions */}
          <Card
            hoverable={true}
            onClick={() => navigate('/questions')}
            className="p-5 border border-subtle hover:border-purple-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-heading group-hover:text-purple-400 transition">
                  Practice Questions
                </h3>
                <p className="text-xs text-muted mt-1">
                  Master university exam questions with instant step-by-step reasoning.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-subtle flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition">
              <span>Start Practice</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Card>

          {/* Action 3: Take a Quiz */}
          <Card
            hoverable={true}
            onClick={() => navigate('/quizzes')}
            className="p-5 border border-subtle hover:border-emerald-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-heading group-hover:text-emerald-400 transition">
                  Take a Quiz
                </h3>
                <p className="text-xs text-muted mt-1">
                  Test your knowledge in timed exam conditions and discover weak spots.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-subtle flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Launch Quiz</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Card>
        </div>
      </div>

      {/* 4. YOUR PROGRESS (Simple 3-Metric Summary) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Your Progress
          </h2>
          <Link
            to="/analytics"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>View Full Analytics</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {hasQuizData ? (
          <Card className="p-5 sm:p-6 border border-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-subtle">
              {/* Overall Accuracy */}
              <div className="sm:pr-4 flex items-center justify-between sm:block space-y-1">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-indigo-400" />
                  Overall Accuracy
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-heading">
                  {Math.round(overview.overallAccuracy || 0)}%
                </p>
              </div>

              {/* Quizzes Completed */}
              <div className="pt-4 sm:pt-0 sm:px-4 flex items-center justify-between sm:block space-y-1">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-purple-400" />
                  Quizzes Completed
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-heading">
                  {overview.totalQuizzesCompleted || 0}
                </p>
              </div>

              {/* Questions Answered */}
              <div className="pt-4 sm:pt-0 sm:pl-4 flex items-center justify-between sm:block space-y-1">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Questions Answered
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-heading">
                  {overview.totalQuestionsAnswered || 0}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-heading">
                  No Quiz Progress Recorded Yet
                </h4>
                <p className="text-xs text-muted">
                  Take your first practice quiz to start tracking accuracy, mastery, and weak topics.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="xs"
              icon={Award}
              onClick={() => navigate('/quizzes')}
            >
              Take a Quiz
            </Button>
          </Card>
        )}
      </div>

      {/* 5. YOUR COURSES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Your Courses ({enrolledModules.length})
          </h2>
          <Link
            to="/modules"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {enrolledModules.length === 0 ? (
          <Card className="p-6 text-center border border-subtle">
            <p className="text-xs text-muted">You haven't enrolled in any courses yet.</p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                icon={BookOpen}
                onClick={() => navigate('/modules')}
              >
                Browse Catalog
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledModules.map((mod) => {
              const docCount = mod.documents?.length || mod.documentCount || 0;
              return (
                <Card
                  key={mod._id}
                  hoverable={true}
                  className="p-5 border border-subtle hover:border-indigo-500/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" size="xs">
                        {mod.moduleCode}
                      </Badge>
                      <span className="text-[11px] text-muted">
                        {docCount} {docCount === 1 ? 'lecture' : 'lectures'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-heading line-clamp-1">
                      {mod.moduleName}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {mod.description || 'University syllabus materials available.'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-subtle flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      {mod.semester}
                    </span>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => navigate('/modules')}
                    >
                      Open Course
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
