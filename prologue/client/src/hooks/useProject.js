import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { calculateTaskScore } from '../utils/scoreEngine';

const STATUS_TO_DB = { 'To Do': 'todo', 'In Progress': 'in_progress', Done: 'done' };
const DB_TO_STATUS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function mapTaskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_project_id: row.user_project_id,
    title: row.title,
    description: row.description ?? '',
    status: DB_TO_STATUS[row.status] ?? 'To Do',
    statusDb: row.status,
    due_date: row.due_date,
    dueTime: row.due_date ? formatDueTime(row.due_date) : '—',
    milestone: row.milestone ?? '',
    sort_order: row.sort_order,
    submitted_work: row.submitted_work,
    ai_involvement_percentage: row.ai_involvement_percentage,
    completed_at: row.completed_at,
  };
}

function formatDueTime(isoDate) {
  const d = new Date(isoDate);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return '6:00 PM today';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isDueToday(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function computeStreak(scoreRows) {
  if (!scoreRows?.length) return 0;
  const dates = [...new Set(scoreRows.map((r) => r.created_at?.slice(0, 10)))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let check = today;
  for (const d of dates) {
    if (d !== check) break;
    streak++;
    const next = new Date(check);
    next.setDate(next.getDate() - 1);
    check = next.toISOString().slice(0, 10);
  }
  return streak;
}

function computeProjectHealth(tasksCompleted, totalTasks, projectStartDate) {
  if (!totalTasks || !projectStartDate) return 'On Track';
  const start = new Date(projectStartDate);
  const now = new Date();
  const daysElapsed = Math.max(1, Math.floor((now - start) / (24 * 60 * 60 * 1000)));
  const expectedRate = totalTasks / Math.max(1, daysElapsed);
  const actualRate = tasksCompleted / Math.max(1, daysElapsed);
  const ratio = expectedRate > 0 ? actualRate / expectedRate : 1;
  if (ratio >= 0.9) return 'On Track';
  if (ratio >= 0.8) return 'At Risk';
  return 'Behind';
}

export function useProject() {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveProject = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  }, [user?.id]);

  const fetchTasks = useCallback(async (userProjectId) => {
    if (!userProjectId) return [];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_project_id', userProjectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data ?? []).map(mapTaskRow);
  }, []);

  const fetchScores = useCallback(async (userProjectId) => {
    if (!userProjectId) return [];
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_project_id', userProjectId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data ?? [];
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) {
      setProject(null);
      setTasks([]);
      setScores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const proj = await fetchActiveProject();
    setProject(proj);
    if (proj?.id) {
      const [taskList, scoreList] = await Promise.all([fetchTasks(proj.id), fetchScores(proj.id)]);
      setTasks(taskList);
      setScores(scoreList);
    } else {
      setTasks([]);
      setScores([]);
    }
    setLoading(false);
  }, [user?.id, fetchActiveProject, fetchTasks, fetchScores]);

  useEffect(() => {
    load();
  }, [load]);

  const todaysTasks = tasks.filter((t) => isDueToday(t.due_date) || t.statusDb !== 'done').slice(0, 8);

  const tasksCompleted = tasks.filter((t) => t.statusDb === 'done').length;
  const totalTasks = tasks.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayScores = scores.filter((s) => (s.created_at ?? '').slice(0, 10) === todayStr);
  const todayScore = todayScores.length
    ? Math.round((todayScores.reduce((a, s) => a + (s.score_value ?? 0), 0) / todayScores.length) * 10) / 10
    : null;
  const streak = computeStreak(scores);
  const projectHealth = computeProjectHealth(
    tasksCompleted,
    totalTasks,
    project?.submitted_at ?? project?.created_at
  );

  const updateTaskStatus = useCallback(
    async (taskId, newStatus) => {
      const dbStatus = STATUS_TO_DB[newStatus] ?? newStatus.toLowerCase?.();
      const { error } = await supabase.from('tasks').update({ status: dbStatus }).eq('id', taskId);
      if (!error) await load();
    },
    [load]
  );

  const submitTaskWork = useCallback(
    async (taskId, workDescription, aiInvolvementPercentage, hasDocumentation = false) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !project?.id) return;
      const now = new Date().toISOString();
      const due = task.due_date ? new Date(task.due_date) : null;
      const wasOnTime = !due || due >= new Date();

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          submitted_work: workDescription,
          ai_involvement_percentage: aiInvolvementPercentage,
          completed_at: now,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      const scoreValue = calculateTaskScore(aiInvolvementPercentage, wasOnTime, hasDocumentation);
      await supabase.from('scores').insert({
        score_type: 'task_completion',
        score_value: scoreValue,
        user_project_id: project.id,
      });

      await load();
    },
    [tasks, project?.id, load]
  );

  return {
    project,
    tasks,
    todaysTasks,
    updateTaskStatus,
    submitTaskWork,
    loading,
    refetch: load,
    tasksCompleted,
    totalTasks,
    todayScore,
    streak,
    projectHealth,
  };
}
