import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-56 bg-secondary border-r border-border flex flex-col shrink-0">
      <nav className="p-3 flex flex-col gap-1">
        <NavLink to="/dashboard" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
          Dashboard
        </NavLink>
        <NavLink to="/messaging" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
          Messaging
        </NavLink>
        <NavLink to="/scores" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
          Scores
        </NavLink>
      </nav>
    </aside>
  );
}
