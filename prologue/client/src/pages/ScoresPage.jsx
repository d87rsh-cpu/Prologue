import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { useScores } from '../hooks/useScores';
import { useDemoMode } from '../hooks/useDemoMode';

const SCORE_CATEGORIES = [
  {
    id: 'task_completion',
    title: 'Task Completion Score',
    description: 'Based on tasks completed on time',
    style: 'circle',
  },
  {
    id: 'communication_quality',
    title: 'Communication Quality',
    description: 'Based on your message professionalism with manager and team',
    style: 'bar',
  },
  {
    id: 'documentation_quality',
    title: 'Documentation Quality',
    description: 'Based on documentation submitted per task',
    style: 'bar',
  },
  {
    id: 'delegation',
    title: 'Delegation Effectiveness',
    description: 'Based on how well you guided AI teammates and delegated work',
    style: 'bar',
  },
  {
    id: 'consistency',
    title: 'Consistency Score',
    description: 'Based on daily logins and regular progress',
    style: 'circle',
  },
  {
    id: 'leadership',
    title: 'Leadership Score',
    description: 'Interactions that showed initiative with teammates',
    style: 'bar',
  },
];

function getGrade(avg) {
  if (avg >= 90) return 'A+';
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 60) return 'C';
  return 'D';
}

function TrendIcon({ trend }) {
  if (trend === 1) return <ChevronUp className="w-4 h-4 text-green-500" />;
  if (trend === -1) return <ChevronDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-text-secondary" />;
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
        {mounted ? Math.round(score) : 0}
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
        animate={{ width: mounted ? `${Math.min(100, score)}%` : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

function SparklineChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({ value: d.value }));

  return (
    <div className="h-10 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-success)"
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const DEMO_SCORES = {
  task_completion: 92,
  communication_quality: 88,
  documentation_quality: 85,
  delegation: 78,
  consistency: 94,
  leadership: 87,
};

export default function ScoresPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const { loading: scoresLoading, scores: rawScores, trends, scoreHistory } = useScores();
  const { isDemo } = useDemoMode();
  const scores = isDemo ? DEMO_SCORES : rawScores;
  const loading = isDemo ? false : scoresLoading;

  useEffect(() => setMounted(true), []);

  const scoreValues = SCORE_CATEGORIES.map((c) => {
    const key = c.id === 'delegation' ? 'delegation' : c.id;
    return scores[key] ?? 0;
  });
  const overall = scoreValues.length > 0
    ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
    : 0;
  const grade = getGrade(overall);

  const getScoreForCategory = (cat) => {
    const key = cat.id === 'delegation' ? 'delegation' : cat.id;
    return scores[key] ?? 0;
  };

  const getTrendForCategory = (cat) => {
    const key = cat.id === 'delegation' ? 'delegation' : cat.id;
    return trends[key] ?? 0;
  };

  const getHistoryForCategory = (cat) => {
    const key = cat.id === 'delegation' ? 'delegation' : cat.id;
    const hist = scoreHistory[key];
    return Array.isArray(hist) && hist.length > 0 ? hist : null;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary">Loading scores...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Performance Dashboard</h1>
        <p className="mt-1 text-text-secondary">
          A live view of your skills and work quality across this project.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {SCORE_CATEGORIES.map((cat) => {
          const scoreVal = getScoreForCategory(cat);
          const trend = getTrendForCategory(cat);
          const history = getHistoryForCategory(cat);

          return (
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
                  <AnimatedCircle score={scoreVal} size={100} />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold text-text-primary">
                        {mounted ? Math.round(scoreVal) : 0}
                      </span>
                      <TrendIcon trend={trend} />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-text-primary">
                        {mounted ? Math.round(scoreVal) : 0}/100
                      </span>
                      <TrendIcon trend={trend} />
                    </div>
                  </div>
                  <AnimatedBar score={scoreVal} />
                </div>
              )}
              {history && <SparklineChart data={history} />}
            </motion.div>
          );
        })}
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
