/**
 * Calculate task completion score.
 * @param {number} aiInvolvement - 0-100 percentage of work done by AI
 * @param {boolean} wasOnTime - whether task was submitted by due date
 * @param {boolean} hasDocumentation - whether documentation was submitted alongside
 * @returns {number} Score between 10 and 100
 */
export function calculateTaskScore(aiInvolvement, wasOnTime, hasDocumentation) {
  let score = 100;
  score -= 0.4 * (aiInvolvement ?? 0);
  if (!wasOnTime) score -= 20;
  if (hasDocumentation) score += 10;
  return Math.min(100, Math.max(10, Math.round(score * 10) / 10));
}
