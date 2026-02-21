import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Flame,
  ChevronRight,
  FileCheck,
  MessageSquare,
  Trophy,
  LogIn,
  Loader2,
} from 'lucide-react';
import { ROLES } from '../data/roles';
import { BOT_PERSONAS_LIST } from '../data/botPersonas';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import { useMessagesBadge } from '../contexts/MessagesBadgeContext';
import { checkAndTriggerBotMessages } from '../lib/botScheduler';

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

const HEALTH_STYLES = {
  'On Track': 'bg-success/20 text-success border-success/40',
  'At Risk': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  Behind: 'bg-highlight/20 text-highlight border-highlight/40',
};

const ACTIVITY_ITEMS = [
  { id: 1, avatar: 'PS', name: 'Priya Sharma', text: 'completed: Login UI Wireframe', time: '2 hours ago', icon: FileCheck },
  { id: 2, avatar: 'AN', name: 'Arjun Nair', text: "commented on your task: 'Good progress, ensure the API follows REST standards'", time: '5 hours ago', icon: MessageSquare },
  { id: 3, avatar: '🎉', name: 'System', text: 'New milestone unlocked: Project Setup Complete 🎉', time: 'Yesterday', icon: Trophy },
  { id: 4, avatar: 'RK', name: 'Rajan Kumar (AI)', text: 'submitted: Database Schema Draft', time: 'Yesterday', icon: FileCheck },
  { id: 5, avatar: 'You', name: 'You', text: 'joined the project', time: '3 days ago', icon: LogIn, projectName: true },
];

const MIN_DESCRIPTION_LENGTH = 50;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    project,
    tasks,
    todaysTasks,
    updateTaskStatus,
    submitTaskWork,
    loading,
    tasksCompleted,
    totalTasks,
    todayScore,
    streak,
    projectHealth,
  } = useProject();

  const { refreshMessagesBadge } = useMessagesBadge();

  useEffect(() => {
    if (loading || !project?.id || !tasks) return;
    checkAndTriggerBotMessages(project, tasks, undefined, streak).then(() => {
      refreshMessagesBadge();
    });
  }, [loading, project?.id, streak, refreshMessagesBadge]);

  const [submitModalTask, setSubmitModalTask] = useState(null);
  const [submitWorkDescription, setSubmitWorkDescription] = useState('');
  const [submitAiPercent, setSubmitAiPercent] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const teamRoles = project?.team_roles_needed ?? project?.teamRolesNeeded ?? [];
  const teamMembers = useMemo(() => {
    const list = [];
    teamRoles.forEach((roleId) => {
      const role = ROLES.find((r) => r.id === roleId);
      const persona = BOT_PERSONAS_LIST.find((p) => p.roleId === roleId);
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

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const projectCompletion = totalTasks ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const tasksDueToday = todaysTasks.filter((t) => t.statusDb !== 'done').length;
  const upcomingTasks = tasks.filter((t) => t.statusDb !== 'done').slice(todaysTasks.length, todaysTasks.length + 5);

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleOpenSubmitModal = (task) => {
    setSubmitModalTask(task);
    setSubmitWorkDescription('');
    setSubmitAiPercent(0);
    setSubmitError('');
  };

  const handleCloseSubmitModal = () => {
    setSubmitModalTask(null);
    setSubmitWorkDescription('');
    setSubmitAiPercent(0);
    setSubmitError('');
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitModalTask || submitWorkDescription.trim().length < MIN_DESCRIPTION_LENGTH) return;
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await submitTaskWork(submitModalTask.id, submitWorkDescription.trim(), submitAiPercent, false);
      fireConfetti();
      handleCloseSubmitModal();
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="rounded-lg border border-border bg-card-bg p-8 text-center">
          <h2 className="text-lg font-semibold text-text-primary">No active project</h2>
          <p className="text-text-secondary mt-1">Start a project from the project recommendations to see your dashboard.</p>
          <Button className="mt-4" onClick={() => navigate('/projects')}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Modal
        open={!!submitModalTask}
        onClose={handleCloseSubmitModal}
        title={submitModalTask?.title}
      >
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Describe what you built/completed (min {MIN_DESCRIPTION_LENGTH} characters)
            </label>
            <textarea
              value={submitWorkDescription}
              onChange={(e) => setSubmitWorkDescription(e.target.value)}
              placeholder="Describe what you built/completed..."
              rows={4}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              minLength={MIN_DESCRIPTION_LENGTH}
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              {submitWorkDescription.length} / {MIN_DESCRIPTION_LENGTH} characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              How much of this was done by AI? {submitAiPercent}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={submitAiPercent}
              onChange={(e) => setSubmitAiPercent(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-secondary accent-accent"
            />
            <p className="text-sm text-text-secondary mt-1">
              I did <strong className="text-text-primary">{100 - submitAiPercent}%</strong> of this work, AI assisted with <strong className="text-text-primary">{submitAiPercent}%</strong>
            </p>
            {submitAiPercent > 60 && (
              <p className="text-sm text-amber-500 mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                High AI dependency noted. This will affect your Task Completion Score. Try to push your own understanding first.
              </p>
            )}
          </div>
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseSubmitModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitWorkDescription.trim().length < MIN_DESCRIPTION_LENGTH || submitLoading}
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Task'}
            </Button>
          </div>
        </form>
      </Modal>

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
              <p className="text-text-secondary mt-1">
                You have {tasksDueToday} tasks due today.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-text-secondary">{dateStr}</span>
              <span className="text-sm text-text-secondary">Day {streak || 1} of your journey</span>
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
            { label: "Today's Score", value: todayScore ?? '—', suffix: todayScore != null ? '/100' : '', color: 'text-success' },
            { label: 'Streak', value: streak, icon: Flame },
            { label: 'Project Health', value: projectHealth, pill: true, pillStyle: HEALTH_STYLES[projectHealth] ?? HEALTH_STYLES['On Track'] },
          ].map((w, i) => (
            <div key={i} className="rounded-lg border border-border bg-card-bg p-4">
              <p className="text-sm text-text-secondary">{w.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-semibold text-text-primary ${w.color ?? ''}`}>
                  {w.value}
                  {w.suffix ?? ''}
                </span>
                {w.trend && totalTasks > 0 && <TrendingUp className="w-4 h-4 text-success shrink-0" />}
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
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {todaysTasks.length === 0 ? (
                <p className="text-text-secondary text-sm">No tasks right now. Start a project to get tasks.</p>
              ) : (
                todaysTasks.map((task) => {
                  const status = task.status;
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border bg-card-bg p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-text-secondary">Task</p>
                          <h3 className="font-medium text-text-primary mt-0.5">{task.title}</h3>
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {task.milestone && (
                              <span className="px-2 py-0.5 rounded bg-secondary border border-border text-xs text-text-secondary">
                                {task.milestone}
                              </span>
                            )}
                            <span className="text-xs text-text-secondary">Due by {task.dueTime}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex rounded-lg border border-border p-0.5 bg-secondary">
                            {TASK_STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateTaskStatus(task.id, s)}
                                className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${status === s ? STATUS_STYLES[s] : 'text-text-secondary hover:text-text-primary'}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          {task.statusDb !== 'done' && (status === 'In Progress' || status === 'Done') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenSubmitModal(task)}
                            >
                              Submit Work
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-2">Upcoming This Week</h3>
              <ul className="space-y-1.5">
                {upcomingTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm text-text-secondary">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs shrink-0 ml-2">{t.dueTime}</span>
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
                    const isToday = d === today;
                    cells.push(
                      <div
                        key={d}
                        className={`py-1 rounded ${isToday ? 'bg-highlight text-white' : 'text-text-primary'}`}
                      >
                        {d}
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
                    {a.projectName && project?.project_title && (
                      <>: <span className="font-medium">{project.project_title}</span></>
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
