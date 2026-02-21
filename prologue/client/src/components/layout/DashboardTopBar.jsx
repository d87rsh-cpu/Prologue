import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { PROJECTS } from '../../data/projects';

const USER_KEY = 'prologue_user';
const ACTIVE_PROJECT_KEY = 'prologue_active_project';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getActiveProject() {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const COMPLEXITY_STYLES = {
  Beginner: 'bg-success/20 text-success border-success/40',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  Advanced: 'bg-highlight/20 text-highlight border-highlight/40',
};

export default function DashboardTopBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const user = getStoredUser();
  const project = getActiveProject();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const projectTitle = project?.projectTitle ?? 'No project selected';
  const proj = project?.projectId ? PROJECTS.find((p) => p.id === project.projectId) : null;
  const complexity = proj?.complexity ?? project?.complexity ?? 'Beginner';

  return (
    <header className="h-[60px] border-b border-border bg-primary flex items-center justify-between px-6 shrink-0 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-lg font-bold text-text-primary">
          P
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">{projectTitle}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${COMPLEXITY_STYLES[complexity]}`}>
            {complexity}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-highlight" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-text-primary hover:opacity-90"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-lg border border-border bg-card-bg shadow-card z-50">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-secondary"
                onClick={() => { setMenuOpen(false); /* Profile */ }}
              >
                Profile
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-secondary"
                onClick={() => { setMenuOpen(false); navigate('/projects'); }}
              >
                My Projects
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-secondary"
                onClick={() => { setMenuOpen(false); navigate('/'); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
