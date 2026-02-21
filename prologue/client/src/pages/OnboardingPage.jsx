import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  Briefcase,
  Building2,
  Layers,
  BookOpen,
  Monitor,
  Server,
  BarChart2,
  Cpu,
  Pen,
  GitBranch,
  Shield,
  Smartphone,
  Check,
  ChevronRight,
} from 'lucide-react';
import StepIndicator from '../components/onboarding/StepIndicator';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ROLES } from '../data/roles';
import { DOMAINS } from '../data/domains';

const ONBOARDING_STEPS = ['Meet Your HR', 'About Yourself', 'Select Role', "You're all set"];
const STORAGE_KEY = 'prologue_onboarding';

const ROLE_ICON_MAP = {
  Monitor,
  Server,
  Layers,
  BarChart2,
  Cpu,
  Pen,
  GitBranch,
  Shield,
  Smartphone,
  Briefcase,
};

const STEP1_MESSAGE = `Welcome to Prologue. I'm Shreya, your HR Manager. I'll be walking you through your onboarding today. Before we get started, I'll need to understand your background and interests so we can set you up in the right role. This will only take a few minutes. Let's begin.`;

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Self-taught'];

const GOAL_OPTIONS = [
  { id: 'internship', label: 'Get my first internship', icon: Briefcase },
  { id: 'fulltime', label: 'Land my first full-time job', icon: Building2 },
  { id: 'portfolio', label: 'Build a strong portfolio', icon: Layers },
  { id: 'skills', label: 'Learn industry skills', icon: BookOpen },
];

function getStoredOnboarding() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredOnboarding(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function Typewriter({ text, speed = 25, onComplete }) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (display.length >= text.length) {
      setDone(true);
      onComplete?.();
      return;
    }
    const t = setTimeout(() => {
      setDisplay(text.slice(0, display.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [text, speed, display, done, onComplete]);

  return <span>{display}</span>;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stored = getStoredOnboarding();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(stored?.fullName ?? user?.name ?? '');
  const [completing, setCompleting] = useState(false);
  const [college, setCollege] = useState(stored?.college ?? '');
  const [yearOfStudy, setYearOfStudy] = useState(stored?.yearOfStudy ?? '');
  const [primaryGoal, setPrimaryGoal] = useState(stored?.primaryGoal ?? '');
  const [roleTab, setRoleTab] = useState('role');
  const [selectedRoleId, setSelectedRoleId] = useState(stored?.roleId ?? '');
  const [selectedDomains, setSelectedDomains] = useState(stored?.selectedDomains ?? []);

  const suggestedRoles = useMemo(() => {
    if (selectedDomains.length < 2) return [];
    return ROLES.filter((r) => r.domains.some((d) => selectedDomains.includes(d)));
  }, [selectedDomains]);

  const toggleDomain = (id) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const persistStep2 = () => {
    setStoredOnboarding({
      ...getStoredOnboarding(),
      fullName,
      college,
      yearOfStudy,
      primaryGoal,
    });
  };

  const persistStep3 = () => {
    setStoredOnboarding({
      ...getStoredOnboarding(),
      roleId: selectedRoleId,
      selectedDomains,
    });
  };

  const handleNext = async () => {
    if (step === 2) persistStep2();
    if (step === 3) persistStep3();
    if (step === 4) {
      if (!user?.id) {
        navigate('/projects');
        return;
      }
      setCompleting(true);
      try {
        await supabase
          .from('users')
          .update({
            onboarding_complete: true,
            role_id: selectedRoleId || null,
          })
          .eq('id', user.id);
      } catch (_) {}
      setCompleting(false);
      navigate('/projects');
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId);


  return (
    <div className="min-h-screen flex bg-primary">
      {/* Left sidebar — persistent step progress */}
      <aside className="w-56 shrink-0 border-r border-border bg-secondary flex flex-col p-6">
        <div className="text-sm font-medium text-text-secondary mb-4">Onboarding</div>
        <nav className="flex flex-col gap-1">
          {ONBOARDING_STEPS.map((label, i) => (
            <div
              key={i}
              className={`
                flex items-center gap-2 py-2 px-3 rounded-lg
                ${i + 1 === step ? 'bg-accent text-text-primary' : i + 1 < step ? 'text-success' : 'text-text-secondary'}
              `}
            >
              <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-card-bg">
                {i + 1}
              </span>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Right content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="p-6 border-b border-border">
          <StepIndicator steps={ONBOARDING_STEPS} currentStep={step - 1} />
        </div>
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-lg mx-auto flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-text-primary text-xl font-medium">SM</div>
                <h2 className="mt-4 text-xl font-semibold text-text-primary">Shreya Mehta</h2>
                <p className="text-sm text-text-secondary">HR Manager, Prologue Corp</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-success">Available</span>
                </div>
                <div className="mt-8 w-full bg-card-bg border border-border rounded-lg p-4 text-text-primary text-sm leading-relaxed">
                  <Typewriter text={STEP1_MESSAGE} />
                </div>
                <Button onClick={handleNext} className="mt-6" size="lg">
                  Let's Begin <ChevronRight className="w-4 h-4 ml-1 inline" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-xl mx-auto"
              >
                <h2 className="text-xl font-semibold text-text-primary mb-6">Tell Us About Yourself</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">College / University</label>
                    <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. MIT, Stanford" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Year of Study</label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select</option>
                      {YEAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Primary Goal</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {GOAL_OPTIONS.map(({ id, label: goalLabel, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPrimaryGoal(id)}
                          className={`
                            flex items-center gap-3 p-4 rounded-lg border text-left transition-colors
                            ${primaryGoal === id ? 'border-accent bg-accent/10 text-text-primary' : 'border-border bg-card-bg text-text-secondary hover:border-border hover:bg-secondary'}
                          `}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="font-medium">{goalLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>
                    <Button type="submit">Next</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-text-primary text-sm font-medium shrink-0">SM</div>
                  <div className="bg-card-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
                    Now let's find where you fit best. You can choose your role directly, or select your interests first.
                  </div>
                </div>
                <div className="flex rounded-lg border border-border p-1 mb-6 w-fit">
                  <button
                    type="button"
                    onClick={() => setRoleTab('role')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${roleTab === 'role' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Choose by Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleTab('interest')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${roleTab === 'interest' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Choose by Interest
                  </button>
                </div>

                {roleTab === 'role' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ROLES.map((role) => {
                      const IconComponent = ROLE_ICON_MAP[role.icon] || Briefcase;
                      const selected = selectedRoleId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`
                            text-left p-4 rounded-lg border bg-card-bg transition-all
                            ${selected ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-text-secondary'}
                          `}
                          style={{ borderLeftWidth: '4px', borderLeftColor: role.color }}
                        >
                          <IconComponent className="w-5 h-5 text-text-secondary mb-2" style={{ color: role.color }} />
                          <h3 className="font-medium text-text-primary">{role.title}</h3>
                          <p className="text-sm text-text-secondary mt-1">{role.description}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {roleTab === 'interest' && (
                  <div>
                    <p className="text-sm text-text-secondary mb-3">Select at least 2 interests</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {DOMAINS.map((d) => {
                        const active = selectedDomains.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDomain(d.id)}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                              ${active ? 'bg-accent border-accent text-text-primary' : 'bg-card-bg border-border text-text-secondary hover:border-text-secondary'}
                            `}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                    {selectedDomains.length >= 2 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-text-primary mb-3">Suggested roles based on your interests</h3>
                        <div className="flex flex-wrap gap-3">
                          {suggestedRoles.map((role) => {
                            const IconComponent = ROLE_ICON_MAP[role.icon] || Briefcase;
                            const selected = selectedRoleId === role.id;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`
                                  flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all
                                  ${selected ? 'border-accent bg-accent/10' : 'border-border bg-card-bg hover:border-text-secondary'}
                                `}
                              >
                                <IconComponent className="w-4 h-4" style={{ color: role.color }} />
                                <span className="text-text-primary">{role.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <Button variant="secondary" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext} disabled={!selectedRoleId}>Next</Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-xl mx-auto text-center"
              >
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-success flex items-center justify-center"
                  >
                    <Check className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
                <div className="flex justify-center mt-4">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-text-primary text-xs font-medium">SM</div>
                </div>
                <h2 className="mt-6 text-xl font-semibold text-text-primary">
                  Welcome aboard, {fullName || 'there'}.
                </h2>
                <p className="mt-2 text-text-secondary">
                  Your Employee ID is <strong className="text-text-primary">{user?.employee_id ?? '—'}</strong>.
                  You've been registered as a <strong className="text-text-primary">{selectedRole?.title ?? '—'}</strong>.
                </p>
                <p className="mt-1 text-sm text-text-secondary">Let's get you your first project.</p>
                <Button onClick={handleNext} className="mt-6" size="lg" disabled={completing}>
                  {completing ? 'Saving…' : 'View Project Recommendations'} <ChevronRight className="w-4 h-4 ml-1 inline" />
                </Button>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-lg border border-border bg-card-bg">
                    <h3 className="font-medium text-text-primary text-sm">Your Team</h3>
                    <p className="text-xs text-text-secondary mt-1">AI colleagues assigned based on your role will meet you on Day 1</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card-bg">
                    <h3 className="font-medium text-text-primary text-sm">Your Manager</h3>
                    <p className="text-xs text-text-secondary mt-1">Arjun Nair will oversee your projects and assign tasks</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card-bg">
                    <h3 className="font-medium text-text-primary text-sm">Your Workspace</h3>
                    <p className="text-xs text-text-secondary mt-1">Dashboard, messaging, calendar and docs — all ready</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
