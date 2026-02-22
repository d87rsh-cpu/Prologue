import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import { SkeletonCertificate } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ROLES } from '../data/roles';
import { calculateCertificateScores, getOverallAndGrade } from '../utils/certificateScores';

const VERIFY_BASE_URL = 'https://prologue-verify.app/cert';
const DISPLAY_VERIFY_URL = 'prologue.app/verify';

async function fetchActiveUserProject(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

async function fetchScores(userProjectId) {
  if (!userProjectId) return [];
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_project_id', userProjectId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data ?? [];
}

async function fetchTasks(userProjectId) {
  if (!userProjectId) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_project_id', userProjectId);
  if (error) return [];
  return data ?? [];
}

function getRoleTitle(roleId) {
  return ROLES.find((r) => r.id === roleId)?.title ?? 'Team Member';
}

/**
 * Format date as "21st February 2026"
 */
function formatOrdinalDate(iso) {
  const d = new Date(iso);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

const SCORE_LABELS = {
  task_completion: 'Task Completion',
  communication_quality: 'Communication Quality',
  documentation_quality: 'Documentation Quality',
  delegation: 'Delegation Effectiveness',
  delegation_effectiveness: 'Delegation Effectiveness',
  consistency: 'Consistency',
  leadership: 'Leadership',
};

const DEMO_CERTS = {
  'DEMO-RAHUL-ECOM-2025': {
    userName: 'Rahul Kumar',
    projectTitle: 'E-Commerce Backend API',
    roleTitle: 'Backend Developer',
    grade: 'A',
    overall: 89,
    issueDate: '2025-01-15T12:00:00Z',
    certId: 'DEMO-RAHUL-ECOM-2025',
    scoreBreakdown: {
      task_completion: 92,
      communication_quality: 88,
      documentation_quality: 85,
      delegation_effectiveness: 78,
      consistency: 94,
      leadership: 87,
    },
  },
  'DEMO-RAHUL-SALES-2024': {
    userName: 'Rahul Kumar',
    projectTitle: 'Sales Data Dashboard',
    roleTitle: 'Data Analyst',
    grade: 'B+',
    overall: 81,
    issueDate: '2024-12-03T12:00:00Z',
    certId: 'DEMO-RAHUL-SALES-2024',
    scoreBreakdown: {
      task_completion: 85,
      communication_quality: 72,
      documentation_quality: 88,
      delegation_effectiveness: 84,
      consistency: 79,
      leadership: 77,
    },
  },
};

export default function CertificatePage() {
  const [searchParams] = useSearchParams();
  const certIdParam = searchParams.get('certId');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [scores, setScores] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [certId, setCertId] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [overall, setOverall] = useState(0);
  const [grade, setGrade] = useState('D');
  const [issueDate, setIssueDate] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const certCardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (certIdParam) {
        const demo = DEMO_CERTS[certIdParam];
        if (demo) {
          setProject({ project_title: demo.projectTitle, my_role_id: null });
          setCertId(demo.certId);
          setScoreBreakdown(demo.scoreBreakdown);
          setOverall(demo.overall);
          setGrade(demo.grade);
          setIssueDate(demo.issueDate);
          try {
            const dataUrl = await QRCode.toDataURL(`${VERIFY_BASE_URL}/${demo.certId}`, { width: 180, margin: 1 });
            if (!cancelled) setQrDataUrl(dataUrl);
          } catch (_) {}
          setLoading(false);
          return;
        }
        const { data: cert } = await supabase.from('certificates').select('*').eq('cert_id', certIdParam).maybeSingle();
        if (cancelled || !cert) {
          setLoading(false);
          return;
        }
        const [userRes, projRes] = await Promise.all([
          supabase.from('users').select('name').eq('id', cert.user_id).maybeSingle(),
          supabase.from('user_projects').select('*').eq('id', cert.user_project_id).maybeSingle(),
        ]);
        const up = projRes.data ?? {};
        setProject(up);
        setCertId(cert.cert_id);
        setScoreBreakdown(cert.score_breakdown ?? {});
        setOverall(cert.final_score ?? 0);
        setGrade(cert.grade ?? 'D');
        setIssueDate(cert.issued_at);
        try {
          const dataUrl = await QRCode.toDataURL(`${VERIFY_BASE_URL}/${cert.cert_id}`, { width: 180, margin: 1 });
          if (!cancelled) setQrDataUrl(dataUrl);
        } catch (_) {}
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setLoading(false);
        return;
      }

      const proj = await fetchActiveUserProject(user.id);
      if (cancelled) return;
      if (!proj) {
        setLoading(false);
        setProject(null);
        return;
      }

      const [scoreList, taskList] = await Promise.all([fetchScores(proj.id), fetchTasks(proj.id)]);
      if (cancelled) return;

      setProject(proj);
      setScores(scoreList);
      setTasks(taskList);

      const breakdown = calculateCertificateScores(scoreList, taskList, proj);
      const { overall: ov, grade: g } = getOverallAndGrade(breakdown);

      const projIdPart = ((proj.project_id ?? proj.id) ?? '').toString().replace(/-/g, '').slice(0, 6).toUpperCase();
      const generatedCertId = 'CERT-' + projIdPart + '-' + Date.now().toString(36).toUpperCase();

      const issuedAt = new Date().toISOString();

      await supabase.from('certificates').insert({
        user_id: user.id,
        user_project_id: proj.id,
        cert_id: generatedCertId,
        final_score: ov,
        grade: g,
        score_breakdown: breakdown,
        issued_at: issuedAt,
      });

      setCertId(generatedCertId);
      setScoreBreakdown(breakdown);
      setOverall(ov);
      setGrade(g);
      setIssueDate(issuedAt);

      const verifyUrl = `${VERIFY_BASE_URL}/${generatedCertId}`;
      try {
        const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (err) {
        console.warn('QR generation failed', err);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id, certIdParam]);

  const handleDownloadPDF = async () => {
    if (!certCardRef.current) return;
    try {
      const canvas = await html2canvas(certCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH) * 0.95;
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;

      pdf.addImage(imgData, 'PNG', x, y, w, h);

      pdf.addPage();
      const projectStart = project?.submitted_at ?? project?.created_at ?? '';
      const projectEnd = new Date().toISOString();
      const tasksCompleted = tasks?.filter((t) => t.status === 'done').length ?? 0;
      const messagesSent = scores?.filter((s) => s.score_type === 'communication_quality').length ?? 0;
      const uniqueDays = scores?.length ? new Set(scores.map((s) => (s.created_at ?? '').slice(0, 10))).size : 0;

      pdf.setFontSize(14);
      pdf.text(`Detailed Performance Report — ${project?.project_title ?? 'Project'}`, 20, 20);
      pdf.setFontSize(11);
      let yPos = 35;
      for (const [key, val] of Object.entries(scoreBreakdown)) {
        pdf.text(`${SCORE_LABELS[key] ?? key}: ${Math.round(val)}/100`, 20, yPos);
        yPos += 8;
      }
      yPos += 5;
      pdf.text(`Date range: ${projectStart ? new Date(projectStart).toLocaleDateString() : '—'} to ${new Date(projectEnd).toLocaleDateString()}`, 20, yPos);
      yPos += 8;
      pdf.text(`Total tasks completed: ${tasksCompleted}`, 20, yPos);
      yPos += 8;
      pdf.text(`Messages sent: ${messagesSent}`, 20, yPos);
      yPos += 8;
      pdf.text(`Streak days (unique days with activity): ${uniqueDays}`, 20, yPos);

      const safeName = (user?.name ?? 'Participant').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
      const safeTitle = (project?.project_title ?? 'Project').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
      const filename = `Prologue_Certificate_${safeName}_${safeTitle}.pdf`;

      pdf.save(filename);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF');
    }
  };

  const demoCert = certIdParam && DEMO_CERTS[certIdParam];
  const userName = demoCert?.userName ?? user?.name ?? 'Participant';
  const projectTitle = demoCert?.projectTitle ?? project?.project_title ?? 'Project';
  const roleTitle = demoCert?.roleTitle ?? getRoleTitle(project?.my_role_id);

  if (loading) return <SkeletonCertificate />;

  if (!project && !certIdParam) {
    return (
      <div className="min-h-screen bg-primary py-12 px-4 flex items-center justify-center">
        <p className="text-text-secondary">No active project found. Complete a project to earn your certificate.</p>
      </div>
    );
  }

  if (certIdParam && !project && !DEMO_CERTS[certIdParam]) {
    return (
      <div className="min-h-screen bg-primary py-12 px-4 flex items-center justify-center">
        <p className="text-text-secondary">Certificate not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-12 px-4 print:py-0 print:px-0">
      <div className="max-w-[800px] mx-auto">
        <div
          id="certificate-card"
          ref={certCardRef}
          className="paper-texture bg-white rounded-lg shadow-xl overflow-visible print:shadow-none print:rounded-none relative"
          style={{
            maxWidth: 800,
            padding: 48,
            border: '2px solid #e5e7eb',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* Gold corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-amber-600/60 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-amber-600/60 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-amber-600/60 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-amber-600/60 rounded-br-lg" />
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
          <p className="text-center text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {userName}
          </p>
          <p className="text-center text-gray-600 mb-4">has successfully completed the project</p>
          <p className="text-center text-xl font-semibold italic text-gray-800 mb-2">{projectTitle}</p>
          <p className="text-center text-gray-600 mb-6">
            in the capacity of <strong>{roleTitle}</strong>
          </p>

          <div className="flex justify-center gap-8 mb-6 text-sm text-gray-600">
            <span>
              Final Performance Score: <strong className="text-gray-800">{Math.round(overall)}/100</strong>
            </span>
            <span>|</span>
            <span>
              Grade: <strong className="text-gray-800">{grade}</strong>
            </span>
          </div>

          <p className="text-center text-sm text-gray-500 mb-6">
            Issue date: {issueDate ? formatOrdinalDate(issueDate) : '—'} · Certificate ID: {certId ?? '—'}
          </p>

          {/* Score breakdown table - 6 scores in 2 columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-6 text-xs text-gray-600 max-w-md mx-auto">
            {Object.entries(scoreBreakdown).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span>{SCORE_LABELS[key] ?? key}</span>
                <span className="font-medium text-gray-800">{Math.round(val)}</span>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mb-6">
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

          {/* QR code with P logo overlay */}
          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <div className="relative">
                <img src={qrDataUrl} alt="QR code to verify certificate" className="w-[120px] h-[120px]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold" style={{ color: '#0F3460' }}>P</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-[120px] h-[120px] rounded bg-gray-100 border border-gray-300" />
            )}
            <p className="mt-2 text-xs text-gray-500 text-center">
              Scan or visit {DISPLAY_VERIFY_URL}/{certId ?? '...'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8 print:hidden">
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
