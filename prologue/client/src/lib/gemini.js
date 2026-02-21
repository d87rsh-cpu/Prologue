import { BOT_PERSONAS } from '../data/botPersonas';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_HISTORY_MESSAGES = 10;

const FALLBACK_MESSAGE =
  "I'm having trouble connecting right now. Please try again in a moment.";

/**
 * Build PROJECT CONTEXT string from projectContext using only the bot's contextFields.
 * Keeps payload small for token efficiency.
 */
function buildContextBlock(bot, projectContext) {
  const fields = bot.contextFields;
  if (!fields || !Array.isArray(fields) || fields.length === 0) return '';

  const parts = [];
  if (projectContext) {
    if (fields.includes('project_title') && projectContext.project_title) {
      parts.push(`Project: ${projectContext.project_title}`);
    }
    if (fields.includes('active_tasks') && projectContext.active_tasks != null) {
      const tasks =
        typeof projectContext.active_tasks === 'string'
          ? projectContext.active_tasks
          : Array.isArray(projectContext.active_tasks)
            ? projectContext.active_tasks.join(', ')
            : String(projectContext.active_tasks);
      parts.push(`Your task: ${tasks}`);
    }
    if (fields.includes('upcoming_deadlines') && projectContext.upcoming_deadlines != null) {
      const deadlines =
        typeof projectContext.upcoming_deadlines === 'string'
          ? projectContext.upcoming_deadlines
          : Array.isArray(projectContext.upcoming_deadlines)
            ? projectContext.upcoming_deadlines.join(', ')
            : String(projectContext.upcoming_deadlines);
      parts.push(`Deadline: ${deadlines}`);
    }
    if (fields.includes('user_role') && projectContext.user_role) {
      parts.push(`User's role: ${projectContext.user_role}`);
    }
    if (fields.includes('recent_submissions') && projectContext.recent_submissions != null) {
      const subs =
        typeof projectContext.recent_submissions === 'string'
          ? projectContext.recent_submissions
          : Array.isArray(projectContext.recent_submissions)
            ? projectContext.recent_submissions.join('; ')
            : String(projectContext.recent_submissions);
      parts.push(`Recent submissions: ${subs}`);
    }
  }

  if (parts.length === 0) return '';
  return `\n\nPROJECT CONTEXT: ${parts.join(', ')}`;
}

/**
 * Format messageHistory for Gemini: alternating user/model, last N messages.
 * Expects messageHistory as array of { role: 'user'|'assistant', content: string } or { from: 'me'|contactId, text: string }.
 */
function formatHistory(messageHistory) {
  if (!messageHistory || !Array.isArray(messageHistory) || messageHistory.length === 0) {
    return [];
  }

  const normalized = messageHistory.slice(-MAX_HISTORY_MESSAGES * 2).map((m) => {
    const role = m.role === 'model' || m.role === 'assistant' || m.from !== 'me' ? 'model' : 'user';
    const text = m.content ?? m.text ?? '';
    return { role, text };
  });

  const contents = [];
  for (const { role, text } of normalized) {
    if (!text?.trim()) continue;
    contents.push({
      role: role === 'user' ? 'user' : 'model',
      parts: [{ text: text.trim() }],
    });
  }
  return contents;
}

/**
 * Send a user message to a bot and return the bot's response.
 * @param {string} botId - One of: manager, frontend_dev, backend_dev, gossip_buddy
 * @param {string} userMessage - The user's message text
 * @param {object} projectContext - Optional. Keys: project_title, active_tasks, upcoming_deadlines, recent_submissions, user_role (only fields in bot.contextFields are injected)
 * @param {Array} messageHistory - Optional. Previous messages [{ role, content }] or [{ from, text }]. Last 10 messages used.
 * @returns {Promise<string>} Bot response text or fallback message on error
 */
export async function sendBotMessage(botId, userMessage, projectContext = {}, messageHistory = []) {
  const bot = BOT_PERSONAS[botId];
  if (!bot) {
    return FALLBACK_MESSAGE;
  }

  if (!GEMINI_API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is not set');
    return FALLBACK_MESSAGE;
  }

  const contextBlock = buildContextBlock(bot, projectContext);
  const systemPrompt = (bot.systemPrompt || '') + contextBlock;

  const historyContents = formatHistory(messageHistory);
  const contents = [
    ...historyContents,
    {
      role: 'user',
      parts: [{ text: (userMessage || '').trim() || '(No message)' }],
    },
  ];

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
  };

  try {
    const url = `${BASE_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Gemini API error', res.status, errBody);
      return FALLBACK_MESSAGE;
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const text = part?.text;

    if (typeof text !== 'string' || !text.trim()) {
      return FALLBACK_MESSAGE;
    }

    return text.trim();
  } catch (err) {
    console.error('sendBotMessage failed', err);
    return FALLBACK_MESSAGE;
  }
}

/**
 * Generate text from a single prompt or system + user prompt (for bot-initiated messages).
 * @param {string} userPrompt - The main prompt to send
 * @param {string} [systemPrompt] - Optional system instruction
 * @returns {Promise<string|null>} Generated text or null on error
 */
export async function generateText(userPrompt, systemPrompt = '') {
  if (!GEMINI_API_KEY || !userPrompt?.trim()) return null;

  const payload = {
    contents: [{ parts: [{ text: userPrompt.trim() }] }],
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
    },
  };
  if (systemPrompt?.trim()) {
    payload.system_instruction = { parts: [{ text: systemPrompt.trim() }] };
  }

  try {
    const url = `${BASE_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error('generateText failed', err);
    return null;
  }
}

/**
 * Rate the professionalism of a workplace message 1-10 via Gemini.
 * Used for communication_quality scoring (not for Gossip Buddy).
 * @param {string} messageText - The message to rate
 * @returns {Promise<number|null>} Score 1-10 or null on error
 */
export async function scoreProfessionalism(messageText) {
  if (!GEMINI_API_KEY || !messageText?.trim()) return null;

  const prompt = `Rate the professionalism of this workplace message from 1-10. Return ONLY a number. Message: ${messageText.trim()}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8,
      temperature: 0.2,
    },
  };

  try {
    const url = `${BASE_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return null;

    const num = parseInt(text.trim().replace(/[^\d]/g, ''), 10);
    if (Number.isNaN(num) || num < 1 || num > 10) return null;
    return num;
  } catch (err) {
    console.error('scoreProfessionalism failed', err);
    return null;
  }
}
