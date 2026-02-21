import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import ProjectSelectionPage from './pages/ProjectSelectionPage';
import PRDFormPage from './pages/PRDFormPage';
import DashboardPage from './pages/DashboardPage';
import MessagingPage from './pages/MessagingPage';
import ScoresPage from './pages/ScoresPage';
import CompletedProjectsPage from './pages/CompletedProjectsPage';
import CertificatePage from './pages/CertificatePage';
import VerificationPage from './pages/VerificationPage';
import AppShell from './components/layout/AppShell';
import DashboardLayout from './components/layout/DashboardLayout';

function RedirectFromRoot() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.onboarding_complete ? '/dashboard' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RedirectFromRoot />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/role-selection"
        element={
          <ProtectedRoute>
            <RoleSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route path="/project-selection" element={<Navigate to="/projects" replace />} />
      <Route
        path="/prd"
        element={
          <ProtectedRoute>
            <PRDFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="/prd-form" element={<Navigate to="/prd" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>
      <Route
        path="/messaging"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<MessagingPage />} />
      </Route>
      <Route
        path="/scores"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ScoresPage />} />
      </Route>
      <Route
        path="/completed"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<CompletedProjectsPage />} />
      </Route>
      <Route
        path="/certificate"
        element={
          <ProtectedRoute>
            <CertificatePage />
          </ProtectedRoute>
        }
      />
      <Route path="/verify/:certId" element={<VerificationPage />} />
      <Route path="/verification" element={<Navigate to="/verify/DEMO-PRIYA-2024" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
