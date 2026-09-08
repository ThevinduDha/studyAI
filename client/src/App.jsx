import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Navbar from './components/Navbar.jsx';
import AppShell from './layouts/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ModulesPage from './pages/ModulesPage.jsx';
import AdminModulesPage from './pages/AdminModulesPage.jsx';
import SemanticSearchPage from './pages/SemanticSearchPage.jsx';
import StudyAssistantPage from './pages/StudyAssistantPage.jsx';
import LectureSummariesPage from './pages/LectureSummariesPage.jsx';
import ExamQuestionsPage from './pages/ExamQuestionsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import QuizResultPage from './pages/QuizResultPage.jsx';
import QuizHistoryPage from './pages/QuizHistoryPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import Phase1OverviewPage from './pages/Phase1OverviewPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t border-slate-800/60 light:border-slate-200 py-6 text-center text-xs text-slate-500 light:text-slate-400">
        StudyAI &bull; AI-Powered University Learning Platform
      </footer>
    </div>
  );
}

function SystemStatusRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return (
      <AppShell>
        <Phase1OverviewPage />
      </AppShell>
    );
  }
  return (
    <PublicLayout>
      <Phase1OverviewPage />
    </PublicLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Student / Shared Routes (wrapped in AppShell via ProtectedRoute) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <StudyAssistantPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/summaries"
              element={
                <ProtectedRoute>
                  <LectureSummariesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <ExamQuestionsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Quiz System Routes */}
            <Route
              path="/quizzes"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/:quizId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/attempt/:attemptId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz-results/:attemptId"
              element={
                <ProtectedRoute>
                  <QuizResultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz-history"
              element={
                <ProtectedRoute>
                  <QuizHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Performance Analytics Route */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/modules"
              element={
                <ProtectedRoute>
                  <ModulesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Semantic Search Route */}
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SemanticSearchPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Only Routes */}
            <Route
              path="/admin/modules"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminModulesPage />
                </ProtectedRoute>
              }
            />

            {/* System Status Route (Responsive to Auth state) */}
            <Route path="/system-status" element={<SystemStatusRoute />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
