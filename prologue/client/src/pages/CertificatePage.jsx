import { useMemo } from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useActiveProject } from '../hooks/useActiveProject';

const ONBOARDING_KEY = 'prologue_onboarding';

function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRoleTitle(roleId, user) {
  const onboarding = getStoredOnboarding();
  const id = roleId ?? user?.role_id ?? onboarding?.roleId;
  const roles = [
    { id: 'frontend_dev', title: 'Frontend Developer' },
    { id: 'backend_dev', title: 'Backend Developer' },
    { id: 'fullstack_dev', title: 'Full Stack Developer' },
    { id: 'data_analyst', title: 'Data Analyst' },
    { id: 'ml_engineer', title: 'ML Engineer' },
    { id: 'ui_ux_designer', title: 'UI/UX Designer' },
    { id: 'devops_engineer', title: 'DevOps Engineer' },
    { id: 'cybersecurity', title: 'Cybersecurity Analyst' },
    { id: 'mobile_dev', title: 'Mobile Developer' },
    { id: 'product_manager', title: 'Product Manager' },
  ];
  return roles.find((r) => r.id === id)?.title ?? 'Team Member';
}

export default function CertificatePage() {
  const { user } = useAuth();
  const { project } = useActiveProject();
  const certId = useMemo(() => `CERT-${Math.floor(100000 + Math.random() * 900000)}`, []);
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const userName = user?.name ?? 'Participant';
  const projectTitle = project?.projectTitle ?? 'Project';
  const roleTitle = getRoleTitle(project?.myRoleId, user);
  const finalScore = 82;
  const grade = finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B' : 'C';

  return (
    <div className="min-h-screen bg-primary py-12 px-4 print:py-0 print:px-0">
      <div className="max-w-[800px] mx-auto">
        {/* Certificate card — print-ready */}
        <div
          className="bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none"
          style={{
            maxWidth: 800,
            padding: 48,
            border: '2px solid #e5e7eb',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* Ornate top border feel */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: '#0F3460' }}
              >
                P
              </div>
              <span className="text-2xl font-light text-gray-800 tracking-tight">Prologue Corp</span>
            </div>
            <h1 className="text-center text-xl font-semibold text-gray-700 uppercase tracking-widest">
              Certificate of Project Completion
            </h1>
          </div>

          <p className="text-center text-gray-600 mb-2">This certifies that</p>
          <p className="text-center text-2xl font-bold text-gray-900 mb-2">{userName}</p>
          <p className="text-center text-gray-600 mb-4">has successfully completed the project</p>
          <p className="text-center text-xl font-semibold italic text-gray-800 mb-2">{projectTitle}</p>
          <p className="text-center text-gray-600 mb-6">in the capacity of <strong>{roleTitle}</strong></p>

          <div className="flex justify-center gap-8 mb-6 text-sm text-gray-600">
            <span>Final Performance Score: <strong className="text-gray-800">{finalScore}/100</strong></span>
            <span>|</span>
            <span>Grade: <strong className="text-gray-800">{grade}</strong></span>
          </div>

          <p className="text-center text-sm text-gray-500 mb-8">
            Issue date: {issueDate} · Certificate ID: {certId}
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-800">Arjun Nair</p>
              <p className="text-xs text-gray-500">Project Manager</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-800">Prologue Corp</p>
              <p className="text-xs text-gray-500">Verified Issuer</p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1">
              <QrCode className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-500 text-center leading-tight">Scan to Verify</span>
            </div>
          </div>
        </div>

        {/* Actions — hide when printing */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 print:hidden">
          <Button variant="primary" onClick={() => window.print?.()} className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download as PDF
          </Button>
          <Button variant="secondary" className="inline-flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}
