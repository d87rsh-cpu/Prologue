import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEMO_CERTS = {
  'DEMO-PRIYA-2024': {
    userName: 'Priya Sharma',
    certId: 'DEMO-PRIYA-2024',
    projectTitle: 'AI-Powered Customer Support Platform',
    roleTitle: 'Frontend Developer',
    issuedAt: '2024-02-21T12:00:00Z',
    finalScore: 87.5,
    grade: 'A',
    scoreBreakdown: {
      task_completion: 92,
      communication_quality: 88,
      documentation_quality: 85,
      delegation: 82,
      consistency: 91,
      leadership: 90,
    },
    projectDescription: 'A full-stack platform integrating AI chatbots with existing customer support workflows, featuring real-time sentiment analysis and automated ticket routing.',
    totalTasksCompleted: 12,
    totalDaysActive: 14,
    messagesSent: 47,
  },
  'DEMO-RAHUL-ECOM-2025': {
    userName: 'Rahul Kumar',
    certId: 'DEMO-RAHUL-ECOM-2025',
    projectTitle: 'E-Commerce Backend API',
    roleTitle: 'Backend Developer',
    issuedAt: '2025-01-15T12:00:00Z',
    finalScore: 89,
    grade: 'A',
    scoreBreakdown: {
      task_completion: 92,
      communication_quality: 88,
      documentation_quality: 85,
      delegation_effectiveness: 78,
      consistency: 94,
      leadership: 87,
    },
    projectDescription: 'RESTful API for an e-commerce platform with product catalog, cart, checkout, and order management. Integrated with payment gateway and inventory tracking.',
    totalTasksCompleted: 14,
    totalDaysActive: 21,
    messagesSent: 56,
  },
  'DEMO-RAHUL-SALES-2024': {
    userName: 'Rahul Kumar',
    certId: 'DEMO-RAHUL-SALES-2024',
    projectTitle: 'Sales Data Dashboard',
    roleTitle: 'Data Analyst',
    issuedAt: '2024-12-03T12:00:00Z',
    finalScore: 81,
    grade: 'B+',
    scoreBreakdown: {
      task_completion: 85,
      communication_quality: 72,
      documentation_quality: 88,
      delegation_effectiveness: 84,
      consistency: 79,
      leadership: 77,
    },
    projectDescription: 'Interactive dashboard for sales analytics with real-time charts, cohort analysis, and export capabilities. Built with React and D3.js.',
    totalTasksCompleted: 10,
    totalDaysActive: 16,
    messagesSent: 38,
  },
};

const SCORE_LABELS = {
  task_completion: 'Task Completion',
  communication_quality: 'Communication Quality',
  documentation_quality: 'Documentation Quality',
  delegation: 'Delegation Effectiveness',
  consistency: 'Consistency',
  leadership: 'Leadership',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function VerificationPage() {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [data, setData] = useState(null);
  const [projectSummaryOpen, setProjectSummaryOpen] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!certId) {
        setFound(false);
        setLoading(false);
        return;
      }

      if (certId && DEMO_CERTS[certId]) {
        setData(DEMO_CERTS[certId]);
        setFound(true);
        setProjectSummaryOpen(true);
        setLoading(false);
        return;
      }

      const { data: cert, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('cert_id', certId)
        .maybeSingle();

      if (certError || !cert) {
        setFound(false);
        setLoading(false);
        return;
      }

      const [userRes, projectRes] = await Promise.all([
        supabase.from('users').select('id, name').eq('id', cert.user_id).maybeSingle(),
        supabase.from('user_projects').select('*').eq('id', cert.user_project_id).maybeSingle(),
      ]);

      const up = projectRes.data ?? {};

      const tasksRes = await supabase
        .from('tasks')
        .select('id, status')
        .eq('user_project_id', cert.user_project_id);
      const tasks = tasksRes.data ?? [];
      const tasksCompleted = tasks.filter((t) => t.status === 'done').length;

      const messagesRes = await supabase
        .from('messages')
        .select('id')
        .eq('user_project_id', cert.user_project_id)
        .eq('sender', 'user');
      const messagesSent = (messagesRes.data ?? []).length;

      const startDate = up.submitted_at ?? up.created_at;
      const endDate = cert.issued_at;
      const daysActive = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)))
        : 0;

      const roles = {
        frontend_dev: 'Frontend Developer',
        backend_dev: 'Backend Developer',
        fullstack_dev: 'Full Stack Developer',
        data_analyst: 'Data Analyst',
        ml_engineer: 'ML Engineer',
        ui_ux_designer: 'UI/UX Designer',
        devops_engineer: 'DevOps Engineer',
        cybersecurity: 'Cybersecurity Analyst',
        mobile_dev: 'Mobile Developer',
        product_manager: 'Product Manager',
      };

      setData({
        userName: userRes.data?.name ?? 'Certificate Holder',
        certId: cert.cert_id,
        projectTitle: up.project_title ?? 'Project',
        roleTitle: roles[up.my_role_id] ?? 'Team Member',
        issuedAt: cert.issued_at,
        finalScore: cert.final_score,
        grade: cert.grade,
        scoreBreakdown: cert.score_breakdown ?? {},
        projectDescription: up.one_liner ?? up.problem ?? '—',
        totalTasksCompleted: tasksCompleted,
        totalDaysActive: daysActive,
        messagesSent,
      });
      setFound(true);
      setLoading(false);
    }

    verify();
  }, [certId]);

  const todayStr = formatDate(new Date().toISOString());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 print:bg-white">
        <p className="text-gray-600">Verifying certificate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12 print:py-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8 print:mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: '#0F3460' }}
          >
            P
          </div>
          <span className="text-xl font-light text-gray-800 tracking-tight">Prologue Corp</span>
        </div>
        <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8 print:mb-6">
          Certificate Verification
        </h1>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 print:shadow-none">
          {found ? (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-12 h-12 text-green-600" strokeWidth={2.5} />
                </div>
                <p className="text-xl font-semibold text-green-700">✓ This certificate is authentic</p>
              </div>

              <div className="space-y-4 text-center mb-8">
                <p className="text-2xl font-bold text-gray-900">{data?.userName}</p>
                <p className="text-sm text-gray-600">Certificate ID: {data?.certId}</p>
                <p className="text-gray-700">Project completed: <strong>{data?.projectTitle}</strong></p>
                <p className="text-gray-600">Date issued: {formatDate(data?.issuedAt)}</p>
                <div className="flex justify-center gap-6 pt-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(data?.finalScore ?? 0)}/100</p>
                    <p className="text-sm text-gray-600">Final Score</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{data?.grade}</p>
                    <p className="text-sm text-gray-600">Grade</p>
                  </div>
                </div>
              </div>

              {/* Score breakdown - horizontal bars */}
              <div className="space-y-3 mb-8">
                {Object.entries(data?.scoreBreakdown ?? {}).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{SCORE_LABELS[key === 'delegation_effectiveness' ? 'delegation' : key] ?? key}</span>
                      <span className="font-medium text-gray-900">{Math.round(val)}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${Math.min(100, val)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Expandable project summary */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setProjectSummaryOpen(!projectSummaryOpen)}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-800 hover:text-gray-600 print:pointer-events-none"
                >
                  View Project Summary
                  {projectSummaryOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {projectSummaryOpen && (
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <p><strong className="text-gray-800">Project description:</strong> {data?.projectDescription}</p>
                    <p><strong className="text-gray-800">Role played:</strong> {data?.roleTitle}</p>
                    <p><strong className="text-gray-800">Total tasks completed:</strong> {data?.totalTasksCompleted}</p>
                    <p><strong className="text-gray-800">Total days active:</strong> {data?.totalDaysActive}</p>
                    <p><strong className="text-gray-800">Messages sent:</strong> {data?.messagesSent}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X className="w-12 h-12 text-red-600" strokeWidth={2.5} />
                </div>
                <p className="text-xl font-semibold text-red-700">Certificate not found</p>
              </div>
              <p className="text-center text-gray-600">
                The certificate ID &quot;{certId}&quot; could not be verified. It may be invalid or has been revoked.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 print:mt-8">
          Issued by Prologue Corp | Verified on {todayStr}
        </p>
      </div>
    </div>
  );
}
