import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import ProjectSelectionPage from './pages/ProjectSelectionPage';
import PRDFormPage from './pages/PRDFormPage';
import DashboardPage from './pages/DashboardPage';
import MessagingPage from './pages/MessagingPage';
import ScoresPage from './pages/ScoresPage';
import CertificatePage from './pages/CertificatePage';
import VerificationPage from './pages/VerificationPage';
import AppShell from './components/layout/AppShell';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/role-selection" element={<RoleSelectionPage />} />
      <Route path="/projects" element={<ProjectSelectionPage />} />
      <Route path="/project-selection" element={<Navigate to="/projects" replace />} />
      <Route path="/prd" element={<PRDFormPage />} />
      <Route path="/prd-form" element={<Navigate to="/prd" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
      <Route path="/messaging" element={<AppShell />}>
        <Route index element={<MessagingPage />} />
      </Route>
      <Route path="/scores" element={<AppShell />}>
        <Route index element={<ScoresPage />} />
      </Route>
      <Route path="/certificate" element={<CertificatePage />} />
      <Route path="/verification" element={<VerificationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
