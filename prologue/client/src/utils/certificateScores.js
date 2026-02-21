/**
 * Shared score calculation logic for certificate generation and verification.
 * Mirrors the logic from useScores hook.
 */

const MANAGER_ID = 'manager';
const GOSSIP_BUDDY_ID = 'gossip_buddy';

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
 * Calculate all 6 scores from raw scores and tasks.
 * @param {Array} scores - raw score rows from Supabase
 * @param {Array} tasks - raw task rows from Supabase
 * @param {Object} project - user_project row (for project start date)
 */
export function calculateCertificateScores(scores, tasks, project) {
  const taskCompletionRows = scores.filter((s) => s.score_type === 'task_completion');
  const taskCompletionScore =
    taskCompletionRows.length > 0
      ? Math.round((taskCompletionRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / taskCompletionRows.length) * 10) / 10
      : 0;

  const commRows = scores.filter((s) => s.score_type === 'communication_quality');
  const communicationQualityScore =
    commRows.length > 0
      ? Math.round((commRows.reduce((a, s) => a + (s.score_value ?? 0), 0) / commRows.length) * 10) / 10
      : 0;

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const totalCompleted = completedTasks.length;
  const withGoodDocs = completedTasks.filter((t) => (t.submitted_work ?? '').length > 100).length;
  const documentationQualityScore = totalCompleted > 0 ? Math.round((withGoodDocs / totalCompleted) * 1000) / 10 : 0;

  const completedWithAI = completedTasks.filter((t) => t.ai_involvement_percentage != null);
  const avgAI =
    completedWithAI.length > 0
      ? completedWithAI.reduce((a, t) => a + (t.ai_involvement_percentage ?? 0), 0) / completedWithAI.length
      : 0;
  const delegationEffectivenessScore = Math.round((100 - avgAI) * 10) / 10;

  const projectStart = project?.submitted_at ?? project?.created_at ?? new Date().toISOString();
  const startDate = new Date(projectStart);
  const now = new Date();
  const daysElapsed = Math.max(1, Math.floor((now - startDate) / (24 * 60 * 60 * 1000)));
  const uniqueDaysWithScores = new Set(scores.map((s) => (s.created_at ?? '').slice(0, 10))).size;
  const consistencyScore = Math.min(100, Math.round((uniqueDaysWithScores / daysElapsed) * 1000) / 10);

  const leadershipScore = getLeadershipScoreFromScores(scores);

  return {
    task_completion: taskCompletionScore,
    communication_quality: communicationQualityScore,
    documentation_quality: documentationQualityScore,
    delegation: delegationEffectivenessScore,
    consistency: consistencyScore,
    leadership: leadershipScore,
  };
}

/**
 * Compute overall average and grade from score breakdown.
 */
export function getOverallAndGrade(scoreBreakdown) {
  const values = Object.values(scoreBreakdown);
  const avg = values.length > 0
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : 0;
  let grade = 'D';
  if (avg >= 90) grade = 'A+';
  else if (avg >= 80) grade = 'A';
  else if (avg >= 70) grade = 'B';
  else if (avg >= 60) grade = 'C';
  return { overall: avg, grade };
}
