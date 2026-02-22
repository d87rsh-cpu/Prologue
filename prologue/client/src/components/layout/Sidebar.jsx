import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BarChart2, Trophy } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/messaging', label: 'Messaging', icon: MessageSquare },
  { to: '/scores', label: 'Scores', icon: BarChart2 },
  { to: '/completed', label: 'Completed Projects', icon: Trophy },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[72px] xl:w-56 bg-secondary border-r border-border flex flex-col shrink-0 transition-all duration-200">
      <nav className="p-3 flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            title={label}
            className={({ isActive }) =>
              `flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary ${isActive ? 'bg-accent text-text-primary' : ''}`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden xl:inline truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
