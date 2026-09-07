import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { quizService } from '../services/quiz.service.js';
import DashboardHero from '../components/dashboard/DashboardHero.jsx';
import DashboardStats from '../components/dashboard/DashboardStats.jsx';
import ContinueLearning from '../components/dashboard/ContinueLearning.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import PerformanceOverview from '../components/dashboard/PerformanceOverview.jsx';
import FocusAreas from '../components/dashboard/FocusAreas.jsx';
import RecentQuizzes from '../components/dashboard/RecentQuizzes.jsx';
import ModuleOverview from '../components/dashboard/ModuleOverview.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';
import { Button } from '../components/ui/Button.jsx';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [enrolledModules, setEnrolledModules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);

  // Localized error states
  const [moduleError, setModuleError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setModuleError(null);
    setAnalyticsError(null);

    // Parallel safe fetching via allSettled so one failing does not crash the others
    const [modulesResult, analyticsResult, quizResult] = await Promise.allSettled([
      moduleService.getEnrolledModules(),
      analyticsService.getOverview(),
      quizService.getAttemptHistory({ status: 'completed' })
    ]);

    // Handle Enrolled Modules
    if (modulesResult.status === 'fulfilled') {
      setEnrolledModules(Array.isArray(modulesResult.value) ? modulesResult.value : []);
    } else {
      console.warn('Failed to load enrolled modules:', modulesResult.reason);
      setModuleError('Could not refresh enrolled courses.');
    }

    // Handle Analytics
    if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.success) {
      setAnalytics(analyticsResult.value.data);
    } else {
      console.warn('Failed to load analytics:', analyticsResult.reason);
      setAnalyticsError('Could not refresh performance metrics.');
    }

    // Handle Recent Quiz attempts
    if (quizResult.status === 'fulfilled' && Array.isArray(quizResult.value)) {
      setRecentAttempts(quizResult.value);
    } else if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.data?.recentPerformance) {
      setRecentAttempts(analyticsResult.value.data.recentPerformance);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Loading skeleton matching final dashboard layout
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <Skeleton height="h-44" className="w-full rounded-3xl" />
        <SkeletonGrid count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2 h-52" />
          <SkeletonCard className="lg:col-span-1 h-52" />
        </div>
        <SkeletonGrid count={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const weakTopics = analytics?.weakTopics || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-8">
      {/* Top refresh indicator toolbar if localized error occurred */}
      {(moduleError || analyticsError) && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Some dashboard sections could not be refreshed in real-time. Showing cached view.</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            icon={RefreshCw}
            onClick={() => loadDashboardData(true)}
            loading={refreshing}
          >
            Retry
          </Button>
        </div>
      )}

      {/* A. Hero / Welcome Section */}
      <DashboardHero
        user={user}
        moduleCount={enrolledModules.length}
        quizCount={overview.totalQuizzesCompleted || recentAttempts.length}
        accuracy={overview.overallAccuracy || 0}
      />

      {/* B. Overview Real Statistics */}
      <DashboardStats
        enrolledCount={enrolledModules.length}
        analytics={analytics}
      />

      {/* C. Continue Learning & Performance Snapshot (2-Column Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContinueLearning enrolledModules={enrolledModules} />
        </div>
        <div className="lg:col-span-1">
          <PerformanceOverview analytics={analytics} />
        </div>
      </div>

      {/* D. Quick Actions */}
      <QuickActions />

      {/* E. Weak Topics Focus Areas & Recent Quiz History (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FocusAreas weakTopics={weakTopics} />
        <RecentQuizzes recentAttempts={recentAttempts} />
      </div>

      {/* F. Enrolled Module Catalog Grid */}
      <ModuleOverview enrolledModules={enrolledModules} />
    </div>
  );
}
