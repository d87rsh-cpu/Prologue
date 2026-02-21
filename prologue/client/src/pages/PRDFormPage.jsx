import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PROJECTS } from '../data/projects';
import { ROLES } from '../data/roles';
import { BOT_PERSONAS } from '../data/botPersonas';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const ONBOARDING_KEY = 'prologue_onboarding';

const PROJECT_TYPES = [
  'Web App',
  'Mobile App',
  'Data Analysis',
  'ML Model',
  'API/Backend',
  'Design Project',
  'Other',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HOURS_PER_TASK = 2;
const DEFAULT_TASKS_CUSTOM = 40;

function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function formatDateInput(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export default function PRDFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const type = searchParams.get('type') || 'custom';
  const projectId = searchParams.get('projectId');
  const isRecommended = type === 'recommended' && projectId;
  const project = isRecommended ? PROJECTS.find((p) => p.id === projectId) : null;

  const onboarding = getStoredOnboarding();
  const userRoleId = user?.role_id ?? onboarding?.roleId;

  const [projectTitle, setProjectTitle] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [projectType, setProjectType] = useState('');
  const [myRoleId, setMyRoleId] = useState(userRoleId || '');
  const [problem, setProblem] = useState('');
  const [keyFeatures, setKeyFeatures] = useState(['', '', '']);
  const [outOfScope, setOutOfScope] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [daysPerWeek, setDaysPerWeek] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const minDate = addWeeks(new Date(), 2);
    setTargetDate(formatDateInput(minDate));
  }, []);

  useEffect(() => {
    if (!project) return;
    setProjectTitle(project.title);
    setOneLiner(project.description);
    setProjectType(project.complexity === 'Beginner' ? 'Web App' : 'Other');
    setKeyFeatures(project.tasks?.slice(0, 5).map((t) => t.title) ?? ['', '', '']);
    setProblem(project.brief ?? '');
    setOutOfScope('');
  }, [project]);

  useEffect(() => {
    if (userRoleId && !myRoleId) setMyRoleId(userRoleId);
  }, [userRoleId, myRoleId]);

  const addFeature = () => setKeyFeatures((prev) => [...prev, '']);
  const removeFeature = (i) => setKeyFeatures((prev) => prev.filter((_, idx) => idx !== i));
  const updateFeature = (i, value) =>
    setKeyFeatures((prev) => prev.map((f, idx) => (idx === i ? value : f)));

  const toggleDay = (day) => {
    setDaysPerWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const taskCount = project?.tasks?.length ?? DEFAULT_TASKS_CUSTOM;
  const totalHours = taskCount * HOURS_PER_TASK;
  const daysPerWeekNum = daysPerWeek.length || 1;
  const hoursPerWeek = hoursPerDay * daysPerWeekNum;
  const estimatedWeeks = hoursPerWeek > 0 ? totalHours / hoursPerWeek : 0;
  const weeks = Math.floor(estimatedWeeks);
  const remainderDays = Math.round((estimatedWeeks - weeks) * daysPerWeekNum);

  const canSubmit =
    projectTitle.trim() &&
    oneLiner.trim() &&
    projectType &&
    myRoleId &&
    keyFeatures.filter((f) => f.trim()).length >= 3 &&
    targetDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !user?.id) return;
    setSubmitError('');
    setSubmitLoading(true);
    const payload = {
      user_id: user.id,
      type: isRecommended ? 'recommended' : 'custom',
      project_id: project?.id ?? null,
      project_title: projectTitle,
      one_liner: oneLiner,
      project_type: projectType,
      my_role_id: myRoleId,
      problem,
      key_features: keyFeatures.filter((f) => f.trim()),
      out_of_scope: outOfScope,
      target_date: targetDate,
      hours_per_day: hoursPerDay,
      days_per_week: daysPerWeek,
      invite_email: inviteEmail.trim() || null,
      team_roles_needed: project?.team_roles_needed ?? [],
      tasks: project?.tasks ?? [],
      submitted_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      navigate('/dashboard', { state: { projectId: data?.id } });
    } catch (err) {
      setSubmitError(err?.message || 'Failed to save project. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const today = new Date();
  const docDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-primary py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Document-style card */}
        <div className="bg-[#f8f9fa] text-gray-900 rounded-lg shadow-card border border-gray-200 overflow-hidden">
          {/* Document header */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Project Requirements Document
            </h1>
            <p className="text-sm text-gray-500 mt-1">Prologue Corp — Internal</p>
            <p className="text-xs text-gray-400 mt-1">{docDate}</p>
            {isRecommended && (
              <div className="mt-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                This project is pre-configured by Prologue. Fields are pre-filled — review and customize.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
            {/* Section 1 — Project Basics */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Section 1 — Project Basics
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="e.g. Personal Portfolio Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">One-line Description</label>
                  <input
                    type="text"
                    value={oneLiner}
                    onChange={(e) => setOneLiner(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Brief description of the project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {PROJECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Role in this Project</label>
                  <select
                    value={myRoleId}
                    onChange={(e) => setMyRoleId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select role</option>
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2 — Project Scope */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Section 2 — Project Scope
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What problem does this project solve?
                  </label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Describe the problem or opportunity"
                  />
                  <p className="text-xs text-gray-500 mt-1">{problem.length} / 500</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Features (min 3)
                  </label>
                  {keyFeatures.map((f, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <span className="text-gray-400 mt-2">•</span>
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Feature description"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-gray-400 hover:text-red-600 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-sm text-accent hover:underline mt-1"
                  >
                    + Add feature
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What will you NOT build (out of scope)?
                  </label>
                  <textarea
                    value={outOfScope}
                    onChange={(e) => setOutOfScope(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Explicitly out of scope"
                  />
                </div>
              </div>
            </section>

            {/* Section 3 — Timeline & Commitment */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Section 3 — Timeline & Commitment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={formatDateInput(addWeeks(new Date(), 2))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours per day I can commit: <strong>{hoursPerDay} hours/day</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none bg-gray-200 accent-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days per week I'll work</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium border
                          ${daysPerWeek.includes(day) ? 'bg-accent border-accent text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 rounded-lg bg-gray-100 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    Based on your commitment, this project will take approximately{' '}
                    <strong>{weeks} weeks</strong>
                    {remainderDays > 0 && (
                      <> and <strong>{remainderDays} days</strong></>
                    )}.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 — Team Setup (recommended only) */}
            {isRecommended && project?.team_roles_needed?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Section 4 — Team Setup
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {project.team_roles_needed.map((roleId) => {
                      const role = ROLES.find((r) => r.id === roleId);
                      const persona = BOT_PERSONAS.find((p) => p.roleId === roleId);
                      const name = persona?.name ?? role?.title ?? roleId;
                      return (
                        <div
                          key={roleId}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                            style={{ backgroundColor: role?.color ?? '#0F3460' }}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-500">{role?.title ?? roleId}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success border border-success/40">
                              AI Colleague
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invite a Friend</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Section 5 — Confirmation */}
            <section className="pt-4">
              {submitError && <p className="text-sm text-red-500 mb-3">{submitError}</p>}
              <Button
                type="submit"
                disabled={!canSubmit || submitLoading}
                className="w-full"
                size="lg"
              >
                {submitLoading ? 'Saving…' : 'Submit PRD & Start Project →'}
              </Button>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}
