import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SCORE_CATEGORIES = [
  {
    id: 'task_completion',
    title: 'Task Completion Score',
    description: 'Based on tasks completed on time',
    score: 88,
    style: 'circle',
  },
  {
    id: 'communication',
    title: 'Communication Quality',
    description: 'Based on your message professionalism with manager and team',
    score: 82,
    style: 'bar',
  },
  {
    id: 'documentation',
    title: 'Documentation Quality',
    description: 'Based on documentation submitted per task',
    score: 79,
    style: 'bar',
  },
  {
    id: 'delegation',
    title: 'Delegation Effectiveness',
    description: 'Based on how well you guided AI teammates and delegated work',
    score: 75,
    style: 'bar',
  },
  {
    id: 'consistency',
    title: 'Consistency Score',
    description: 'Based on daily logins and regular progress',
    score: 91,
    style: 'circle',
    streak: 4,
  },
  {
    id: 'leadership',
    title: 'Leadership Score',
    description: 'Interactions that showed initiative',
    score: 72,
    style: 'bar',
    extra: '3 times helped teammates',
  },
];

function getGrade(avg) {
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 60) return 'C';
  return 'D';
}

function AnimatedCircle({ score, size = 120 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (mounted ? (score / 100) * circumference : 0);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-text-primary">
        {mounted ? score : 0}
      </span>
    </div>
  );
}

function AnimatedBar({ score }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-success"
        initial={{ width: 0 }}
        animate={{ width: mounted ? `${score}%` : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function ScoresPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scores = SCORE_CATEGORIES.map((c) => c.score);
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const grade = getGrade(overall);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Performance Dashboard</h1>
        <p className="mt-1 text-text-secondary">
          A live view of your skills and work quality across this project.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {SCORE_CATEGORIES.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg border border-border bg-card-bg p-5"
          >
            <h3 className="font-semibold text-text-primary mb-1">{cat.title}</h3>
            <p className="text-sm text-text-secondary mb-4">{cat.description}</p>
            {cat.style === 'circle' ? (
              <div className="flex items-center gap-4">
                <AnimatedCircle score={cat.score} size={100} />
                {cat.streak != null && (
                  <div>
                    <p className="text-2xl font-semibold text-text-primary">{cat.score}</p>
                    <p className="text-sm text-text-secondary">Day streak: {cat.streak}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-text-primary">{cat.score}/100</span>
                  {cat.extra && <span className="text-xs text-text-secondary">{cat.extra}</span>}
                </div>
                <AnimatedBar score={cat.score} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-lg border border-border bg-card-bg p-8 text-center"
      >
        <p className="text-sm text-text-secondary uppercase tracking-wide mb-2">Overall Average Score</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="text-4xl font-bold text-text-primary">
            {mounted ? overall : 0}/100
          </span>
          <span className="px-4 py-2 rounded-lg bg-success/20 text-success border border-success/40 text-xl font-semibold">
            Grade {grade}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/certificate')}
          className="mt-6 px-6 py-3 rounded-lg bg-highlight text-white font-medium hover:opacity-90 transition-opacity"
        >
          Preview My Certificate →
        </button>
      </motion.div>
    </div>
  );
}
