import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  FileCheck,
  MessageSquare,
  Trophy,
  LogIn,
} from 'lucide-react';
import { ROLES } from '../data/roles';
import { BOT_PERSONAS } from '../data/botPersonas';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useActiveProject } from '../hooks/useActiveProject';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TASK_STATUSES = ['To Do', 'In Progress', 'Done'];
const STATUS_STYLES = {
  'To Do': 'bg-card-bg border-border text-text-secondary',
  'In Progress': 'bg-accent/20 border-accent text-text-primary',
  Done: 'bg-success/20 border-success text-success',
};

const ACTIVITY_ITEMS = [
  { id: 1, avatar: 'PS', name: 'Priya Sharma', text: 'completed: Login UI Wireframe', time: '2 hours ago', icon: FileCheck },
  { id: 2, avatar: 'AN', name: 'Arjun Nair', text: "commented on your task: 'Good progress, ensure the API follows REST standards'", time: '5 hours ago', icon: MessageSquare },
  { id: 3, avatar: '🎉', name: 'System', text: 'New milestone unlocked: Project Setup Complete 🎉', time: 'Yesterday', icon: Trophy },
  { id: 4, avatar: 'RK', name: 'Rajan Kumar (AI)', text: 'submitted: Database Schema Draft', time: 'Yesterday', icon: FileCheck },
  { id: 5, avatar: 'You', name: 'You', text: 'joined the project', time: '3 days ago', icon: LogIn, projectName: true },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project } = useActiveProject();
  const tasksFromProject = project?.tasks ?? [];
  const defaultTasks = [
    { id: 'd1', title: 'Set up project and design system', description: 'Initialize repo, add design tokens and folder structure.', milestone: 'Milestone 1: Setup' },
    { id: 'd2', title: 'Build core components', description: 'Implement shared UI components and layout.', milestone: 'Milestone 2: Foundation' },
    { id: 'd3', title: 'Connect to data layer', description: 'Wire up state and API integration.', milestone: 'Milestone 2: Foundation' },
  ];
  const sourceTasks = tasksFromProject.length >= 3 ? tasksFromProject : defaultTasks;
  const todayTasks = sourceTasks.slice(0, 3).map((t) => ({
    ...t,
    dueTime: '6:00 PM today',
    statusKey: `task-${t.id}`,
  }));
  const upcomingTasks = sourceTasks.slice(3, 6).map((t, i) => ({
    ...t,
    dueDate: ['Tomorrow', 'Wed', 'Thu'][i] ?? 'This week',
  }));

  const [taskStatuses, setTaskStatuses] = useState(() => {
    const o = {};
    todayTasks.forEach((t) => { o[t.statusKey] = t.id === todayTasks[0]?.id ? 'In Progress' : 'To Do'; });
    return o;
  });

  const teamRoles = project?.teamRolesNeeded ?? project?.team_roles_needed ?? [];
  const teamMembers = useMemo(() => {
    const list = [];
    teamRoles.forEach((roleId) => {
      const role = ROLES.find((r) => r.id === roleId);
      const persona = BOT_PERSONAS.find((p) => p.roleId === roleId);
      list.push({
        id: roleId,
        name: persona?.name ?? role?.title ?? roleId,
        role: role?.title ?? roleId,
        status: 'Working on Login UI',
        isAi: true,
        color: role?.color ?? '#0F3460',
      });
    });
    list.push({ id: 'manager', name: 'Arjun Nair', role: 'Manager', status: 'Available', isAi: false });
    return list.slice(0, 4);
  }, [teamRoles]);

  const tasksDueToday = 3;
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const dayStreak = 4;
  const projectCompletion = 28;
  const tasksCompleted = 7;
  const totalTasks = 25;
  const todayScore = 72;
  const projectHealth = 'On Track';

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const setTaskStatus = (statusKey, status) => {
    setTaskStatuses((prev) => ({ ...prev, [statusKey]: status }));
    if (status === 'Done') fireConfetti();
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Row 1 — Welcome Banner */}
        <motion.section
          variants={item}
          className="relative rounded-lg border border-border bg-card-bg p-6 overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(15,52,96,0.08) 50%)',
            backgroundSize: '12px 12px',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">
                {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'}.
              </h1>
              <p className="text-text-secondary mt-1">You have {tasksDueToday} tasks due today.</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-text-secondary">{dateStr}</span>
              <span className="text-sm text-text-secondary">Day {dayStreak} of your journey</span>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="3"
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                  <path
                    fill="none"
                    stroke="var(--color-success)"
                    strokeWidth="3"
                    strokeDasharray={`${projectCompletion}, 100`}
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
                  {projectCompletion}%
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Row 2 — Stat widgets */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tasks Completed', value: `${tasksCompleted}/${totalTasks}`, trend: true },
            { label: "Today's Score", value: todayScore, suffix: '/100', color: 'text-success' },
            { label: 'Streak', value: dayStreak, icon: Flame },
            { label: 'Project Health', value: projectHealth, pill: true, pillStyle: 'bg-success/20 text-success border-success/40' },
          ].map((w, i) => (
            <div key={i} className="rounded-lg border border-border bg-card-bg p-4">
              <p className="text-sm text-text-secondary">{w.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-semibold text-text-primary ${w.color ?? ''}`}>
                  {w.value}
                  {w.suffix ?? ''}
                </span>
                {w.trend && <TrendingUp className="w-4 h-4 text-success shrink-0" />}
                {w.icon && <w.icon className="w-5 h-5 text-highlight shrink-0" />}
                {w.pill && (
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium border ${w.pillStyle}`}>
                    {w.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Row 3 — Two columns */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Today's Tasks</h2>
              <button type="button" className="text-sm text-accent hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const status = taskStatuses[task.statusKey] ?? 'To Do';
                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border bg-card-bg p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-secondary">Task {task.id.slice(-1)}</p>
                        <h3 className="font-medium text-text-primary mt-0.5">{task.title}</h3>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded bg-secondary border border-border text-xs text-text-secondary">
                            {task.milestone}
                          </span>
                          <span className="text-xs text-text-secondary">Due by {task.dueTime}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex rounded-lg border border-border p-0.5 bg-secondary">
                          {TASK_STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setTaskStatus(task.statusKey, s)}
                              className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${status === s ? STATUS_STYLES[s] : 'text-text-secondary hover:text-text-primary'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        {(status === 'In Progress' || status === 'Done') && (
                          <Button variant="secondary" size="sm">
                            Submit Work
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-2">Upcoming This Week</h3>
              <ul className="space-y-1.5">
                {upcomingTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm text-text-secondary">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs shrink-0 ml-2">{t.dueDate}</span>
                  </li>
                ))}
                {upcomingTasks.length === 0 && (
                  <li className="text-sm text-text-secondary">No upcoming tasks</li>
                )}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Team</h2>
              <div className="space-y-2">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card-bg"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0 ring-2 ${
                        m.isAi ? 'ring-success' : 'ring-accent'
                      }`}
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary truncate">{m.name}</p>
                      <p className="text-xs text-text-secondary">{m.role}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{m.status}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/messaging?contact=${encodeURIComponent(m.name)}`)}
                    >
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card-bg p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-text-secondary font-medium py-1">
                    {d}
                  </div>
                ))}
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const first = new Date(year, month, 1);
                  const startPad = first.getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const today = currentDate.getDate();
                  const cells = [];
                  for (let i = 0; i < startPad; i++) cells.push(<div key={`pad-${i}`} />);
                  for (let d = 1; d <= daysInMonth; d++) {
                    const hasTask = [5, 12, 18, 21].includes(d);
                    const isToday = d === today;
                    cells.push(
                      <div
                        key={d}
                        className={`py-1 rounded ${isToday ? 'bg-highlight text-white' : 'text-text-primary'} ${hasTask ? 'relative' : ''}`}
                      >
                        {d}
                        {hasTask && !isToday && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success" />
                        )}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 4 — Recent Team Activity */}
        <motion.section variants={item}>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Team Activity</h2>
          <div className="rounded-lg border border-border bg-card-bg divide-y divide-border overflow-hidden">
            {ACTIVITY_ITEMS.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-text-primary shrink-0">
                  {a.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{a.name}</span>{' '}
                    {a.text}
                    {a.projectName && project?.projectTitle && (
                      <>: <span className="font-medium">{project.projectTitle}</span></>
                    )}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{a.time}</p>
                </div>
                <a.icon className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
