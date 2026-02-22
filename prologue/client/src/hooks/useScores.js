import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

const MANAGER_ID = 'manager';
const GOSSIP_BUDDY_ID = 'gossip_buddy';

/**
 * Get the active user_project for the current user.
 */
async function fetchActiveUserProject(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

/**
 * Fetch all scores for a user_project_id.
 */
async function fetchScores(userProjectId) {
  if (!userProjectId) return [];
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_project_id', userProjectId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data ?? [];
}

/**
 * Fetch all tasks for a user_project_id.
 */
async function fetchTasks(userProjectId) {
  if (!userProjectId) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_project_id', userProjectId);
  if (error) return [];
  return data ?? [];
}

/**
 * Fetch all messages for a user_project_id (for Leadership: user-sent to teammates with professionalism).
 * We use scores with score_type='communication_quality' and recipient != manager, != gossip_buddy.
 */
function getLeadershipScoreFromScores(scores) {
  const teammateScores = scores.filter(
    (s) =>
      s.score_type === 'communication_quality' &&
      s.recipient &&
      s.recipient !== MANAGER_ID &&
      s.recipient !== GOSSIP_BUDDY_ID &&
      (s.score_value ?? 0) >= 70
  );
  return Math.min(100, teammateScores.length * 10);
}

/**
 * Get yesterday's date string (YYYY-MM-DD).
 */
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Get trend: 1 = up, -1 = down, 0 = neutral (comparing today avg to yesterday avg).
 */
function getTrend(scores, scoreType) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = yesterdayStr();

  const todayRows = scores.filter((s) => s.score_type === scoreType && (s.created_at ?? '').slice(0, 10) === todayStr);
  const yesterdayRows = scores.filter((s) => s.score_type === scoreType && (s.created_at ?? '').slice(0, 10) === yesterday);

  const todayAvg = todayRows.length ? todayRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / todayRows.length : null;
  const yesterdayAvg = yesterdayRows.length ? yesterdayRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / yesterdayRows.length : null;

  if (todayAvg == null || yesterdayAvg == null) return 0;
  const diff = todayAvg - yesterdayAvg;
  if (Math.abs(diff) < 1) return 0;
  return diff > 0 ? 1 : -1;
}

/**
 * For Consistency and Leadership, trend uses a synthetic comparison: today vs yesterday counts/values.
 * Leadership: count of qualifying messages. Consistency: unique days.
 */
function getConsistencyTrend(scores) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = yesterdayStr();
  const todayHas = scores.some((s) => (s.created_at ?? '').slice(0, 10) === todayStr);
  const yesterdayHas = scores.some((s) => (s.created_at ?? '').slice(0, 10) === yesterday);
  if (todayHas && !yesterdayHas) return 1;
  if (!todayHas && yesterdayHas) return -1;
  return 0;
}

export function useScores() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setScores([]);
      setTasks([]);
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const proj = await fetchActiveUserProject(user.id);
    setProject(proj);

    if (proj?.id) {
      const [scoreList, taskList] = await Promise.all([fetchScores(proj.id), fetchTasks(proj.id)]);
      setScores(scoreList);
      setTasks(taskList);
    } else {
      setScores([]);
      setTasks([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // 1. Task Completion Score: average of score_type='task_completion'. If none, 0.
  const taskCompletionRows = scores.filter((s) => s.score_type === 'task_completion');
  const taskCompletionScore =
    taskCompletionRows.length > 0
      ? Math.round((taskCompletionRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / taskCompletionRows.length) * 10) / 10
      : 0;

  // 2. Communication Quality: average of score_type='communication_quality' * 10 to make out of 100.
  // Note: score_value is already stored as 0–100 (score * 10 from MessagingPage).
  const commRows = scores.filter((s) => s.score_type === 'communication_quality');
  const communicationQualityScore =
    commRows.length > 0
      ? Math.round((commRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / commRows.length) * 10) / 10
      : 0;

  // 3. Documentation Quality: (tasks with submitted_work > 100 chars) / (total completed) * 100.
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const totalCompleted = completedTasks.length;
  const withGoodDocs = completedTasks.filter((t) => (t.submitted_work ?? '').length > 100).length;
  const documentationQualityScore = totalCompleted > 0 ? Math.round((withGoodDocs / totalCompleted) * 1000) / 10 : 0;

  // 4. Delegation Effectiveness: 100 - average AI involvement % across all submitted tasks.
  const completedWithAI = completedTasks.filter((t) => t.ai_involvement_percentage != null);
  const avgAI =
    completedWithAI.length > 0
      ? completedWithAI.reduce((a, t) => a + (t.ai_involvement_percentage ?? 0), 0) / completedWithAI.length
      : 0;
  const delegationEffectivenessScore = Math.round((100 - avgAI) * 10) / 10;

  // 5. Consistency: (unique days with score entry) / (days since project start) * 100, cap 100.
  const projectStart = project?.submitted_at ?? project?.created_at ?? new Date().toISOString();
  const startDate = new Date(projectStart);
  const now = new Date();
  const daysElapsed = Math.max(1, Math.floor((now - startDate) / (24 * 60 * 60 * 1000)));
  const uniqueDaysWithScores = new Set(scores.map((s) => (s.created_at ?? '').slice(0, 10))).size;
  const consistencyScore = Math.min(100, Math.round((uniqueDaysWithScores / daysElapsed) * 1000) / 10);

  // 6. Leadership: count of messages to teammates (not manager, not gossip) with professionalism_score >= 7.
  const leadershipScore = getLeadershipScoreFromScores(scores);

  const calculatedScores = {
    task_completion: taskCompletionScore,
    communication_quality: communicationQualityScore,
    documentation_quality: documentationQualityScore,
    delegation: delegationEffectivenessScore,
    consistency: consistencyScore,
    leadership: leadershipScore,
  };

  // Trend for each type (for communication/documentation/delegation we use score_type-specific logic).
  // Task completion and communication use standard score rows.
  // Consistency and Leadership use custom trends.
  const trends = {
    task_completion: getTrend(scores, 'task_completion'),
    communication_quality: getTrend(scores, 'communication_quality'),
    documentation_quality: getTrend(scores, 'documentation_quality'),
    delegation: getTrend(scores, 'delegation_effectiveness'),
    consistency: getConsistencyTrend(scores),
    leadership: getTrend(scores, 'communication_quality'), // proxy: teammate comm quality trend
  };

  // History for sparklines: last 7 entries per score type.
  const getHistoryForType = (scoreType) => {
    const rows = scores
      .filter((s) => s.score_type === scoreType)
      .slice(-7)
      .map((s) => ({ value: s.score_value ?? 0, date: s.created_at }));
    return rows;
  };

  // Documentation quality history: derived from tasks. Use documentation_quality scores if any, else compute.
  const docQualityHistory = scores
    .filter((s) => s.score_type === 'documentation_quality')
    .slice(-7)
    .map((s) => ({ value: s.score_value ?? 0, date: s.created_at }));

  // Delegation: use delegation_effectiveness scores if any; else we'd need to derive from tasks per submission.
  const delegationHistory = scores
    .filter((s) => s.score_type === 'delegation_effectiveness')
    .slice(-7)
    .map((s) => ({ value: s.score_value ?? 0, date: s.created_at }));

  // Consistency history: for each of last 7 days with any score, use 100 (day had activity).
  const consistencyHistory = (() => {
    const byDay = {};
    for (const s of scores) {
      const day = (s.created_at ?? '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] ?? 0) + 1;
    }
    const entries = Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date]) => ({ value: 100, date: `${date}T00:00:00.000Z` }));
    return entries.length > 0 ? entries : null;
  })();

  const scoreHistory = {
    task_completion: getHistoryForType('task_completion'),
    communication_quality: getHistoryForType('communication_quality'),
    documentation_quality: docQualityHistory.length > 0 ? docQualityHistory : null,
    delegation: delegationHistory.length > 0 ? delegationHistory : null,
    consistency: consistencyHistory,
    leadership: (() => {
      const teammateComms = scores.filter(
        (s) =>
          s.score_type === 'communication_quality' &&
          s.recipient &&
          s.recipient !== MANAGER_ID &&
          s.recipient !== GOSSIP_BUDDY_ID
      );
      return teammateComms.slice(-7).map((s) => ({ value: s.score_value ?? 0, date: s.created_at }));
    })(),
  };

  const lastUpdatedByType = {
    task_completion: taskCompletionRows.length ? taskCompletionRows[taskCompletionRows.length - 1]?.created_at : null,
    communication_quality: commRows.length ? commRows[commRows.length - 1]?.created_at : null,
    documentation_quality: scores.filter((s) => s.score_type === 'documentation_quality').pop()?.created_at ?? null,
    delegation: scores.filter((s) => s.score_type === 'delegation_effectiveness').pop()?.created_at ?? null,
    consistency: scores.length ? scores[scores.length - 1]?.created_at : null,
    leadership: null,
  };

  return {
    loading,
    scores: calculatedScores,
    trends,
    scoreHistory,
    lastUpdatedByType,
    rawScores: scores,
    refetch: load,
  };
}
