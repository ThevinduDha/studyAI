import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ModulesPage from './pages/ModulesPage.jsx';
import AdminModulesPage from './pages/AdminModulesPage.jsx';
import SemanticSearchPage from './pages/SemanticSearchPage.jsx';
import Phase1OverviewPage from './pages/Phase1OverviewPage.jsx';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/modules" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Student / Shared Routes */}
              <Route
                path="/modules"
                element={
                  <ProtectedRoute>
                    <ModulesPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Semantic Search Route (Phase 6) */}
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

              {/* Preserved Phase 1 System Health & Architecture */}
              <Route path="/system-status" element={<Phase1OverviewPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            StudyAI &bull; AI-Powered University Learning Platform &bull; Phase 6: Semantic Retrieval
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
