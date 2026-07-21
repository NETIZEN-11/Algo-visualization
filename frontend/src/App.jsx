import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, Suspense, lazy } from 'react'
import { MotionConfig } from 'framer-motion'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/common/ErrorBoundary'
import useAuthStore from './store/useAuthStore'

const HomePage             = lazy(() => import('./pages/HomePage'))
const ProblemSolverPage    = lazy(() => import('./pages/ProblemSolverPage'))
const ProblemPage          = lazy(() => import('./pages/ProblemPage'))
const VisualizationPage    = lazy(() => import('./pages/VisualizationPage'))
const DynamicVisualizationPage = lazy(() => import('./pages/DynamicVisualizationPage'))
const CatalogPage          = lazy(() => import('./pages/CatalogPage'))
const AlgorithmDetailPage  = lazy(() => import('./pages/AlgorithmDetailPage'))
const InterviewPage        = lazy(() => import('./pages/InterviewPage'))
const BugDetectorPage      = lazy(() => import('./pages/BugDetectorPage'))
const PlaygroundPage       = lazy(() => import('./pages/PlaygroundPage'))
const RoadmapPage          = lazy(() => import('./pages/RoadmapPage'))
const ProgressPage         = lazy(() => import('./pages/ProgressPage'))
const DailyChallengePage   = lazy(() => import('./pages/DailyChallengePage'))
const ContestPage          = lazy(() => import('./pages/ContestPage'))
const NotesPage            = lazy(() => import('./pages/NotesPage'))
const BadgesPage           = lazy(() => import('./pages/BadgesPage'))
const CompaniesPage        = lazy(() => import('./pages/CompaniesPage'))
const SettingsPage         = lazy(() => import('./pages/SettingsPage'))
const LoginPage            = lazy(() => import('./pages/LoginPage'))
const SignupPage           = lazy(() => import('./pages/SignupPage'))
const ForgotPasswordPage   = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage    = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage      = lazy(() => import('./pages/VerifyEmailPage'))
const OAuthCallbackPage    = lazy(() => import('./pages/OAuthCallbackPage'))
const AdminPage            = lazy(() => import('./pages/AdminPage'))
const NotificationsPage    = lazy(() => import('./pages/NotificationsPage'))

function PageLoader() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PublicRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

function ProtectedRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout />
}

function App() {

  const rehydrate = useAuthStore((s) => s.rehydrate)
  useEffect(() => { rehydrate() }, [rehydrate])

  return (
    <ErrorBoundary>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {}
      <MotionConfig reducedMotion="user">
      {}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-sky-500 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      {}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Notifications
      </div>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,

          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        </Route>

        {}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/problem-solver" element={<ProblemSolverPage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/visualization/dynamic" element={<DynamicVisualizationPage />} />
          <Route path="/visualization/catalog" element={<CatalogPage />} />
          <Route path="/visualization/:slug" element={<AlgorithmDetailPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/bug-detector" element={<BugDetectorPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/daily-challenge" element={<DailyChallengePage />} />
          <Route path="/contest" element={<ContestPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </Suspense>
      </MotionConfig>
    </Router>
    </ErrorBoundary>
  )
}

export default App
