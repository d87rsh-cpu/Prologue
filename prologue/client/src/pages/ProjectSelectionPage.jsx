import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PROJECTS } from '../data/projects';
import { ROLES } from '../data/roles';
import { DOMAINS } from '../data/domains';
import Button from '../components/ui/Button';

const USER_KEY = 'prologue_user';
const ONBOARDING_KEY = 'prologue_onboarding';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const COMPLEXITY_COLORS = {
  Beginner: 'bg-success/20 text-success border-success/40',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  Advanced: 'bg-highlight/20 text-highlight border-highlight/40',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProjectSelectionPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const onboarding = getStoredOnboarding();
  const roleId = onboarding?.roleId;
  const userRole = ROLES.find((r) => r.id === roleId);

  const [complexityFilter, setComplexityFilter] = useState('All');

  const recommendedProjects = useMemo(() => {
    if (!userRole) return PROJECTS;
    const roleDomainIds = new Set(userRole.domains);
    return PROJECTS.filter((p) => p.domains.some((d) => roleDomainIds.has(d)));
  }, [userRole]);

  const filteredProjects = useMemo(() => {
    if (complexityFilter === 'All') return recommendedProjects;
    return recommendedProjects.filter((p) => p.complexity === complexityFilter);
  }, [recommendedProjects, complexityFilter]);

  const domainLabel = (id) => DOMAINS.find((d) => d.id === id)?.label ?? id;
  const roleTitle = (id) => ROLES.find((r) => r.id === id)?.title ?? id;
  const roleColor = (id) => ROLES.find((r) => r.id === id)?.color ?? '#888';

  return (
    <div className="min-h-screen bg-primary">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-primary flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-lg font-bold text-text-primary">
            P
          </div>
          <span className="font-semibold text-text-primary">Prologue</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {user?.name ?? 'Guest'} · {user?.employeeId ?? '—'}
          </span>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-text-primary">
            {user?.name ? user.name.trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-text-primary">Project Recommendations</h1>
        <p className="mt-1 text-text-secondary">
          Based on your role as <strong className="text-text-primary">{userRole?.title ?? '—'}</strong>, here are curated projects for you.
        </p>

        {/* Complexity filter */}
        <div className="flex flex-wrap gap-2 mt-6">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setComplexityFilter(c)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${complexityFilter === c ? 'bg-accent border-accent text-text-primary' : 'bg-card-bg border-border text-text-secondary hover:border-text-secondary'}
              `}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Project cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-card-bg border border-border rounded-lg p-5 flex flex-col shadow-card"
            >
              <div className="flex justify-end mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${COMPLEXITY_COLORS[project.complexity] ?? COMPLEXITY_COLORS.Beginner}`}
                >
                  {project.complexity}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">{project.title}</h2>
              <p className="text-sm text-text-secondary line-clamp-2 mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.domains.slice(0, 4).map((d) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded bg-secondary border border-border text-xs text-text-secondary"
                  >
                    {domainLabel(d)}
                  </span>
                ))}
              </div>
              <div className="mb-3">
                <p className="text-xs text-text-secondary mb-1.5">Required Roles</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {project.required_roles.map((rid) => (
                    <span key={rid} className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: roleColor(rid) }}
                      />
                      <span className="text-xs text-text-primary">{roleTitle(rid)}</span>
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-secondary mb-4">~{project.estimated_weeks} weeks</p>
              <div className="mt-auto flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/prd?type=recommended&projectId=${project.id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="highlight"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/prd?type=recommended&projectId=${project.id}`)}
                >
                  Start Project
                </Button>
              </div>
            </div>
          ))}

          {/* Add my project card */}
          <button
            type="button"
            onClick={() => navigate('/prd?type=custom')}
            className="bg-card-bg/50 border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-accent hover:bg-card-bg transition-colors min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3 text-text-secondary">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">Work on Your Own Project</h3>
            <p className="text-sm text-text-secondary mb-4">Have a personal or academic project? Add it here.</p>
            <Button variant="secondary" size="sm">
              Add My Project →
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
}
