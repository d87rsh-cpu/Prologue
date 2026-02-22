import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Calendar,
  FileText,
  BarChart2,
  Trophy,
  Settings,
  MessageCircle,
} from 'lucide-react';
import { ROLES } from '../../data/roles';
import { useAuth } from '../../hooks/useAuth';
import { useMessagesBadge } from '../../contexts/MessagesBadgeContext';

const ONBOARDING_KEY = 'prologue_onboarding';

function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard', icon: CheckSquare, label: 'My Tasks' },
  { to: '/messaging', icon: MessageSquare, label: 'Team Messages', badgeFromContext: true },
  { to: '/dashboard', icon: Calendar, label: 'Calendar' },
  { to: '/dashboard', icon: FileText, label: 'Documents' },
  { to: '/scores', icon: BarChart2, label: 'My Scores' },
  { to: '/completed', icon: Trophy, label: 'Completed Projects' },
  { to: '/dashboard', icon: Settings, label: 'Settings' },
];

export default function DashboardSidebar() {
  const { user } = useAuth();
  const { messagesBadge } = useMessagesBadge();
  const onboarding = getStoredOnboarding();
  const roleId = user?.role_id ?? onboarding?.roleId;
  const role = ROLES.find((r) => r.id === roleId);
  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="w-[72px] xl:w-[240px] bg-secondary border-r border-border flex flex-col shrink-0 fixed left-0 top-[60px] bottom-0 z-20 transition-all duration-200">
      <div className="p-4 border-b border-border flex items-center xl:items-start xl:gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-text-primary shrink-0 mx-auto xl:mx-0">
          {initials}
        </div>
        <div className="min-w-0 hidden xl:block">
            <p className="font-medium text-text-primary truncate">{user?.name ?? 'Guest'}</p>
            <p className="text-xs text-text-secondary truncate">{user?.employee_id ?? '—'}</p>
            {role && (
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: `${role.color}20`,
                  color: role.color,
                  borderColor: `${role.color}40`,
                }}
              >
                {role.title}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-3 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label, badge, badgeFromContext }, i) => {
          const useActive = to === '/dashboard' || to === '/messaging' || to === '/scores' || to === '/completed';
          const showBadge = badgeFromContext ? messagesBadge : (badge != null && badge > 0);
          return (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={to === '/dashboard'}
              title={label}
              className={({ isActive }) =>
                `flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  useActive && isActive ? 'bg-accent text-text-primary' : 'text-text-secondary hover:bg-card-bg hover:text-text-primary'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 truncate hidden xl:inline">{label}</span>
              {showBadge && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-highlight text-white text-xs flex items-center justify-center shrink-0">
                  {badgeFromContext ? '!' : badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="my-3 border-t border-border" />

        <NavLink
          to="/dashboard"
          title="Gossip Buddy"
          className={({ isActive }) =>
            `flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative border border-success/20 ${
              isActive ? 'bg-success/10 text-success shadow-[0_0_16px_rgba(0,180,216,0.12)]' : 'text-text-secondary hover:bg-card-bg hover:text-success hover:shadow-[0_0_12px_rgba(0,180,216,0.08)]'
            }`
          }
        >
          <span className="relative">
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-pulse" />
          </span>
          <span className="flex-1 truncate hidden xl:inline">Gossip Buddy</span>
        </NavLink>
      </nav>
    </aside>
  );
}
