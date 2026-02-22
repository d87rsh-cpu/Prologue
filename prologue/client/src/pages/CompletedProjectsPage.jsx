import { useNavigate } from 'react-router-dom';
import { Trophy, Award, ExternalLink, FileCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCompletedProjects } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../hooks/useDemoMode';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

const DEMO_EMPLOYEE_ID = 'PRO-2024-00001';

const DEMO_PROJECTS = [
  {
    id: 'demo-ecom',
    projectTitle: 'E-Commerce Backend API',
    description: 'RESTful API for an e-commerce platform with product catalog, cart, checkout, and order management. Integrated with payment gateway and inventory tracking.',
    role: 'Backend Developer',
    grade: 'A',
    finalScore: 89,
    completedDate: 'January 15, 2025',
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
  {
    id: 'demo-sales',
    projectTitle: 'Sales Data Dashboard',
    description: 'Interactive dashboard for sales analytics with real-time charts, cohort analysis, and export capabilities. Built with React and D3.js.',
    role: 'Data Analyst',
    grade: 'B+',
    finalScore: 81,
    completedDate: 'December 3, 2024',
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
];

const SCORE_COLORS = {
  task_completion: 'bg-blue-500/20 text-blue-600 border-blue-500/40',
  communication_quality: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40',
  documentation_quality: 'bg-violet-500/20 text-violet-600 border-violet-500/40',
  delegation_effectiveness: 'bg-amber-500/20 text-amber-600 border-amber-500/40',
  consistency: 'bg-teal-500/20 text-teal-600 border-teal-500/40',
  leadership: 'bg-rose-500/20 text-rose-600 border-rose-500/40',
};

const SCORE_LABELS = {
  task_completion: 'Tasks',
  communication_quality: 'Comm',
  documentation_quality: 'Docs',
  delegation_effectiveness: 'Delegation',
  consistency: 'Consistency',
  leadership: 'Leadership',
};

function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card-bg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  color: '#b8860b',
                  borderColor: 'rgba(212, 175, 55, 0.5)',
                }}
              >
                <Award className="w-3.5 h-3.5" />
                Certificate issued
              </span>
            </div>
            <h3 className="font-semibold text-lg text-text-primary truncate">{project.projectTitle}</h3>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{project.description}</p>
          </div>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 border-2"
            style={{
              borderColor: 'var(--color-success)',
              color: 'var(--color-success)',
            }}
          >
            {project.grade}
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-3">
          <span className="font-medium text-text-primary">{project.role}</span>
          {' · '}
          {project.completedDate}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(project.scoreBreakdown ?? {}).map(([key, val]) => (
            <span
              key={key}
              className={`px-2 py-0.5 rounded text-xs font-medium border ${SCORE_COLORS[key] ?? 'bg-secondary text-text-secondary border-border'}`}
            >
              {SCORE_LABELS[key] ?? key}: {Math.round(val)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/certificate?certId=${project.certId}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent text-text-primary hover:opacity-90 transition-opacity"
          >
            <FileCheck className="w-4 h-4" />
            View Certificate
          </button>
          <button
            type="button"
            onClick={() => navigate(`/verify/${project.certId}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-secondary text-text-primary hover:bg-card-bg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on Prologue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompletedProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const [dbProjects, setDbProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data: certs, error } = await supabase
        .from('certificates')
        .select('cert_id, final_score, grade, score_breakdown, issued_at, user_project_id')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) {
        setLoading(false);
        return;
      }

      const projectIds = [...new Set((certs ?? []).map((c) => c.user_project_id).filter(Boolean))];
      const projectRows = {};
      if (projectIds.length > 0) {
        const { data: ups } = await supabase
          .from('user_projects')
          .select('id, project_title, one_liner, my_role_id, problem')
          .in('id', projectIds);
        (ups ?? []).forEach((u) => { projectRows[u.id] = u; });
      }

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

      const projects = (certs ?? [])
        .filter((r) => r.cert_id && !['DEMO-RAHUL-ECOM-2025', 'DEMO-RAHUL-SALES-2024'].includes(r.cert_id))
        .map((r) => {
          const up = projectRows[r.user_project_id] ?? {};
          return {
            id: r.cert_id,
            projectTitle: up.project_title ?? 'Project',
            description: up.one_liner ?? up.problem ?? '',
            role: roles[up.my_role_id] ?? 'Team Member',
            grade: r.grade ?? '—',
            finalScore: r.final_score ?? 0,
            completedDate: r.issued_at
              ? new Date(r.issued_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—',
            certId: r.cert_id,
            scoreBreakdown: r.score_breakdown ?? {},
          };
        });

      setDbProjects(projects);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  const projects = isDemo ? DEMO_PROJECTS : dbProjects;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
          <Trophy className="w-7 h-7" style={{ color: 'var(--color-success)' }} />
          Completed Projects
        </h1>
        <p className="mt-1 text-text-secondary">
          Your project completions and earned certificates.
        </p>
      </header>

      {loading ? (
        <SkeletonCompletedProjects />
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-border bg-card-bg">
          <EmptyState
            icon={Trophy}
            title="No completed projects yet"
            subtitle="Complete a project to see your certificates here."
            actionLabel="Go to Projects"
            onAction={() => navigate('/projects')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
