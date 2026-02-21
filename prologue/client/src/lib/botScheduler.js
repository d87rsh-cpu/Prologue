import { supabase } from './supabase';
import { generateText } from './gemini';
import { BOT_PERSONAS } from '../data/botPersonas';

const TRIGGER_STORAGE_PREFIX = 'prologue_trigger_';
const BADGE_KEY = 'prologue_messages_badge';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getTriggerLastDate(triggerKey, projectId) {
  try {
    return localStorage.getItem(`${TRIGGER_STORAGE_PREFIX}${triggerKey}_${projectId}`) || null;
  } catch {
    return null;
  }
}

function setTriggerLastDate(triggerKey, projectId) {
  try {
    localStorage.setItem(`${TRIGGER_STORAGE_PREFIX}${triggerKey}_${projectId}`, todayStr());
  } catch (_) {}
}

function setMessagesBadge(projectId) {
  try {
    localStorage.setItem(BADGE_KEY, projectId || '1');
  } catch (_) {}
}

export function hasMessagesBadge() {
  try {
    return !!localStorage.getItem(BADGE_KEY);
  } catch {
    return false;
  }
}

export function clearMessagesBadge() {
  try {
    localStorage.removeItem(BADGE_KEY);
  } catch (_) {}
}

async function managerSentToday(projectId) {
  const start = `${todayStr()}T00:00:00.000Z`;
  const { data } = await supabase
    .from('messages')
    .select('id')
    .eq('user_project_id', projectId)
    .eq('sender', 'manager')
    .gte('created_at', start)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function insertBotMessage(projectId, senderId, content, isGossip = false) {
  await supabase.from('messages').insert({
    user_project_id: projectId,
    sender: senderId,
    sender_type: 'bot',
    recipient: 'user',
    content: content || '',
    is_gossip_buddy: isGossip,
  });
}

function tasksDueToday(tasks) {
  const today = todayStr();
  return (tasks || []).filter(
    (t) => t.statusDb !== 'done' && t.due_date && t.due_date.slice(0, 10) === today
  );
}

function overdueTasks(tasks) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  return (tasks || []).filter(
    (t) => t.statusDb !== 'done' && t.due_date && t.due_date.slice(0, 10) < yesterdayStr
  );
}

function milestonesFullyCompleted(tasks) {
  const byMilestone = {};
  (tasks || []).forEach((t) => {
    const m = t.milestone || 'General';
    if (!byMilestone[m]) byMilestone[m] = [];
    byMilestone[m].push(t);
  });
  return Object.entries(byMilestone).filter((group) =>
    group[1].every((t) => t.statusDb === 'done')
  );
}

/**
 * Run on dashboard load. Evaluates trigger conditions and inserts proactive bot messages.
 * @param {object} projectData - Active project: { id, project_title, team_roles_needed }
 * @param {Array} tasksData - Tasks with id, title, statusDb, due_date, milestone
 * @param {string} [lastLoginDate] - Optional last login date (YYYY-MM-DD)
 * @param {number} [streak] - Current streak (for Gossip Buddy trigger)
 */
export async function checkAndTriggerBotMessages(projectData, tasksData, lastLoginDate, streak = 0) {
  const projectId = projectData?.id;
  if (!projectId) return;

  const today = todayStr();
  const projectTitle = projectData?.project_title || projectData?.projectTitle || 'the project';

  // —— TRIGGER 1: Manager morning task assignment ——
  const trigger1Key = 'manager_morning';
  if (getTriggerLastDate(trigger1Key, projectId) !== today) {
    const dueToday = tasksDueToday(tasksData);
    const managerAlreadySent = await managerSentToday(projectId);
    if (dueToday.length > 0 && !managerAlreadySent) {
      const taskList = dueToday.map((t) => t.title || t.id).join(', ');
      const userPrompt = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. The user has these tasks due: ${taskList}. Write a brief, professional morning task briefing message (3-4 sentences max) assigning the day's work. Be specific about what you expect completed by end of day. Sign off formally as Arjun Nair, Project Manager.`;
      const text = await generateText(
        userPrompt,
        'You are Arjun Nair, a Senior Project Manager at Prologue Corp. Write only the message, no meta commentary.'
      );
      if (text) {
        await insertBotMessage(projectId, 'manager', text, false);
        setTriggerLastDate(trigger1Key, projectId);
        setMessagesBadge(projectId);
      }
    }
  }

  // —— TRIGGER 2: Overdue task warning ——
  const trigger2Key = 'overdue_warning';
  if (getTriggerLastDate(trigger2Key, projectId) !== today) {
    const overdue = overdueTasks(tasksData);
    if (overdue.length > 0) {
      const taskRef = overdue[0];
      const taskName = taskRef.title || taskRef.id;
      const userPrompt = `Write a professional but firm message from the manager (Arjun Nair) about a missed deadline. Reference this specific task: "${taskName}". Ask for an update. Express that consistent delivery is important. Exactly 3 sentences. Sign off formally. Output only the message.`;
      const text = await generateText(
        userPrompt,
        'You are Arjun Nair, Project Manager. Be direct and professional.'
      );
      if (text) {
        await insertBotMessage(projectId, 'manager', text, false);
        setTriggerLastDate(trigger2Key, projectId);
        setMessagesBadge(projectId);
      }
    }
  }

  // —— TRIGGER 3: Teammate status update (once a day, random teammate) ——
  const trigger3Key = 'teammate_status';
  if (getTriggerLastDate(trigger3Key, projectId) !== today) {
    const teamRoles = projectData?.team_roles_needed ?? ['frontend_dev', 'backend_dev'];
    const botId = teamRoles[Math.floor(Math.random() * teamRoles.length)];
    const bot = BOT_PERSONAS[botId];
    if (bot) {
      const userPrompt = `You are ${bot.name}, ${bot.role}. Write a 1-2 sentence realistic project status update that a developer would send to the team channel. Reference the project: ${projectTitle}. Make it sound like real work is happening. Output only the update, no quotes or labels.`;
      const text = await generateText(userPrompt);
      if (text) {
        await insertBotMessage(projectId, botId, text, false);
        setTriggerLastDate(trigger3Key, projectId);
        setMessagesBadge(projectId);
      }
    }
  }

  // —— TRIGGER 4: Milestone celebration (once per milestone ever) ——
  const completedMilestones = milestonesFullyCompleted(tasksData);
  for (const [milestoneName, milestoneTasks] of completedMilestones) {
    const trigger4Key = `milestone_${milestoneName.replace(/\s+/g, '_')}`;
    if (!getTriggerLastDate(trigger4Key, projectId)) {
      const accomplished = milestoneTasks.map((t) => t.title).filter(Boolean).join(', ');
      const nextMilestones = (tasksData || [])
        .filter((t) => t.statusDb !== 'done' && (t.milestone || '') !== milestoneName)
        .map((t) => t.milestone || t.title)
        .filter(Boolean);
      const nextRef = nextMilestones.length > 0 ? ` Next focus: ${nextMilestones[0]}.` : '';
      const userPrompt = `Write a professional congratulations message from the manager (Arjun Nair) on completing the milestone: "${milestoneName}". Briefly mention what was accomplished (e.g. ${accomplished}). Transition immediately to the next milestone and what's expected. Keep it encouraging but focused.${nextRef} Sign off formally. Output only the message.`;
      const text = await generateText(
        userPrompt,
        'You are Arjun Nair, Project Manager. Be concise and professional.'
      );
      if (text) {
        await insertBotMessage(projectId, 'manager', text, false);
        setTriggerLastDate(trigger4Key, projectId);
        setMessagesBadge(projectId);
      }
    }
  }

  // —— TRIGGER 5: Streak encouragement (Gossip Buddy) ——
  const trigger5Key = 'streak_encouragement';
  if (streak >= 5 && getTriggerLastDate(trigger5Key, projectId) !== today) {
    const message =
      "okay but can we talk about how you've been showing up every single day?? that's genuinely impressive and you should be proud of that 👏";
    await insertBotMessage(projectId, 'gossip_buddy', message, true);
    setTriggerLastDate(trigger5Key, projectId);
  }
}
