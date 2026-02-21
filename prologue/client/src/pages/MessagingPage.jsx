import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenSquare, Info, Paperclip, Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ROLES } from '../data/roles';
import { BOT_PERSONAS_LIST } from '../data/botPersonas';
import { useProject } from '../hooks/useProject';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { sendBotMessage, scoreProfessionalism } from '../lib/gemini';
import { clearMessagesBadge } from '../lib/botScheduler';

const MANAGER_ID = 'manager';
const MANAGER = {
  id: MANAGER_ID,
  name: 'Arjun Nair',
  role: 'Manager',
  department: 'Project Management',
  isManager: true,
  isGossip: false,
  currentWork: 'Reviewing sprint deliverables and task assignments',
  responseStyle: 'Formal',
  color: '#0F3460',
};

const MIN_MANAGER_MESSAGE_LENGTH = 20;

function buildTeamContacts(project) {
  const roleIds = project?.team_roles_needed ?? project?.teamRolesNeeded ?? ['frontend_dev', 'backend_dev'];
  return roleIds.slice(0, 4).map((roleId) => {
    const role = ROLES.find((r) => r.id === roleId);
    const persona = BOT_PERSONAS_LIST.find((p) => p.roleId === roleId);
    return {
      id: roleId,
      name: persona?.name ?? role?.title ?? roleId,
      role: role?.title ?? roleId,
      department: 'Engineering',
      isManager: false,
      isGossip: false,
      currentWork: 'Working on assigned tasks',
      responseStyle: 'Friendly',
      color: role?.color ?? '#0F3460',
    };
  });
}

const GOSSIP_BUDDY = {
  id: 'gossip_buddy',
  name: 'Gossip Buddy',
  role: 'Confidential Support',
  department: '—',
  isManager: false,
  isGossip: true,
  currentWork: 'Here to listen',
  responseStyle: 'Friendly',
  color: '#E94560',
};

function formatMessageTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { project, tasks, projectHealth, tasksCompleted, totalTasks } = useProject();

  const contactParam = searchParams.get('contact');
  const [selectedId, setSelectedId] = useState(contactParam || null);
  const [contextOpen, setContextOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState('');
  const [typingBotId, setTypingBotId] = useState(null);
  const chatEndRef = useRef(null);
  const [gossipSessionCount, setGossipSessionCount] = useState(0);

  const teamContacts = buildTeamContacts(project);
  const allContacts = [MANAGER, ...teamContacts, GOSSIP_BUDDY];

  useEffect(() => {
    if (contactParam && !selectedId) {
      const match = allContacts.find((c) => decodeURIComponent(contactParam) === c.name || c.id === contactParam);
      if (match) setSelectedId(match.id);
    }
  }, [contactParam]);

  const selected = allContacts.find((c) => c.id === selectedId) ?? null;
  const isGossip = selected?.isGossip ?? false;
  const projectId = project?.id ?? null;

  const loadMessages = useCallback(
    async (userProjectId, contactId) => {
      if (!userProjectId || !contactId) {
        setMessages([]);
        return;
      }
      setMessagesLoading(true);
      const isGossipThread = contactId === 'gossip_buddy';

      const base = (q) => {
        let query = q.eq('user_project_id', userProjectId);
        if (isGossipThread) query = query.eq('is_gossip_buddy', true);
        else query = query.or('is_gossip_buddy.is.null,is_gossip_buddy.eq.false');
        return query.order('created_at', { ascending: true });
      };

      const { data: data1 } = await base(
        supabase.from('messages').select('*').eq('sender', 'user').eq('recipient', contactId)
      );
      const { data: data2 } = await base(
        supabase.from('messages').select('*').eq('sender', contactId).eq('recipient', 'user')
      );

      setMessagesLoading(false);
      const merged = [...(data1 ?? []), ...(data2 ?? [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      const list = merged.map((row) => ({
        id: row.id,
        from: row.sender === 'user' ? 'me' : row.sender,
        text: row.content ?? '',
        time: formatMessageTime(row.created_at),
        created_at: row.created_at,
      }));
      setMessages(list);

      if (isGossipThread && list.length > 0) {
        const userMessages = list.filter((m) => m.from === 'me').length;
        setGossipSessionCount((s) => Math.max(s, Math.ceil(userMessages / 2)));
      }
    },
    []
  );

  useEffect(() => {
    if (projectId && selectedId) loadMessages(projectId, selectedId);
    else setMessages([]);
  }, [projectId, selectedId, loadMessages]);

  useEffect(() => {
    clearMessagesBadge();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingBotId]);

  const selectContact = (contact) => {
    setSelectedId(contact.id);
    setSearchParams({ contact: contact.name });
    setValidationWarning('');
  };

  const buildProjectContext = useCallback(() => {
    const title = project?.project_title ?? project?.projectTitle ?? '—';
    const userRoleId = project?.my_role_id ?? user?.role_id;
    const roleTitle = ROLES.find((r) => r.id === userRoleId)?.title ?? userRoleId ?? '—';
    const activeTasks = tasks.filter((t) => t.statusDb !== 'done').map((t) => t.title);
    const upcomingDeadlines = tasks.filter((t) => t.statusDb !== 'done').slice(0, 3).map((t) => t.dueTime || t.due_date);
    const recentSubmissions = tasks.filter((t) => t.statusDb === 'done').slice(-3).map((t) => t.title);
    return {
      project_title: title,
      user_role: roleTitle,
      active_tasks: activeTasks,
      upcoming_deadlines: upcomingDeadlines,
      recent_submissions: recentSubmissions,
    };
  }, [project, user?.role_id, tasks]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedId || !projectId || !user?.id) return;

    if (selectedId === MANAGER_ID && text.length < MIN_MANAGER_MESSAGE_LENGTH) {
      setValidationWarning(
        'Messages to your manager should be detailed and professional. Please provide more context.'
      );
      return;
    }
    setValidationWarning('');

    const recipientBotId = selectedId;
    const isGossipThread = recipientBotId === 'gossip_buddy';

    const userRow = {
      user_project_id: projectId,
      sender: 'user',
      sender_type: 'user',
      recipient: recipientBotId,
      content: text,
      is_gossip_buddy: isGossipThread,
    };

    const { data: insertedUser } = await supabase.from('messages').insert(userRow).select('id, created_at').single();
    const optimisticUserMsg = {
      id: insertedUser?.id ?? `temp-${Date.now()}`,
      from: 'me',
      text,
      time: formatMessageTime(insertedUser?.created_at ?? new Date().toISOString()),
      created_at: insertedUser?.created_at,
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputValue('');
    setSendLoading(true);
    setTypingBotId(recipientBotId);

    const last10 = messages.slice(-10).map((m) => ({
      from: m.from === 'me' ? 'me' : recipientBotId,
      text: m.text,
    }));
    const projectContext = buildProjectContext();

    try {
      const botReplyText = await sendBotMessage(recipientBotId, text, projectContext, last10);

      const botRow = {
        user_project_id: projectId,
        sender: recipientBotId,
        sender_type: 'bot',
        recipient: 'user',
        content: botReplyText,
        is_gossip_buddy: isGossipThread,
      };
      const { data: insertedBot } = await supabase.from('messages').insert(botRow).select('id, created_at').single();

      setTypingBotId(null);
      const botMsg = {
        id: insertedBot?.id ?? `bot-${Date.now()}`,
        from: recipientBotId,
        text: botReplyText,
        time: formatMessageTime(insertedBot?.created_at ?? new Date().toISOString()),
        created_at: insertedBot?.created_at,
      };
      setMessages((prev) => [...prev, botMsg]);

      if (!isGossipThread) {
        const score = await scoreProfessionalism(text);
        if (score != null) {
          const scoreValue = score * 10;
          await supabase.from('scores').insert({
            score_type: 'communication_quality',
            score_value: scoreValue,
            user_project_id: projectId,
            context: text.slice(0, 500),
            recipient: recipientBotId,
          });
          if (score < 5) {
            toast(
              '💡 Tip: Try to be more specific and professional in your communications. It affects your Communication Score.',
              { duration: 4000 }
            );
          }
        }
      } else {
        setGossipSessionCount((s) => s + 1);
      }
    } catch (err) {
      setTypingBotId(null);
      toast.error('Failed to send. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contextPanelContent = selected ? (
    selected.isGossip ? (
      <>
        <p className="text-sm text-text-primary text-center mb-4">
          Your conversations here are always private 🔒
        </p>
        <div className="rounded-lg bg-card-bg border border-border p-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{gossipSessionCount}</p>
          <p className="text-xs text-text-secondary">Stress vented: {gossipSessionCount} sessions</p>
        </div>
      </>
    ) : selected.isManager ? (
      <>
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Project Health
            </h4>
            <p className="text-sm text-text-primary">{projectHealth ?? 'On Track'}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Upcoming deadlines
            </h4>
            <p className="text-sm text-text-primary">
              {tasks
                .filter((t) => t.statusDb !== 'done')
                .slice(0, 3)
                .map((t) => t.title || t.dueTime)
                .join(' • ') || '—'}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Last task submitted
            </h4>
            <p className="text-sm text-text-primary">
              {tasks.filter((t) => t.statusDb === 'done').slice(-1)[0]?.title ?? '—'}
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-200 mt-4">
          💡 Tip: Keep messages professional and project-focused.
        </div>
      </>
    ) : (
      <>
        <div>
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
            Their current task
          </h4>
          <p className="text-sm text-text-primary">
            {tasks.filter((t) => t.statusDb !== 'done')[0]?.title ?? selected.currentWork}
          </p>
        </div>
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
            Response Style
          </h4>
          <span className="inline-block px-2 py-1 rounded bg-card-bg border border-border text-sm text-text-primary">
            {selected.responseStyle}
          </span>
        </div>
      </>
    )
  ) : null;

  return (
    <div className="flex overflow-hidden bg-primary" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Column 1 — Contacts */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-secondary flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Team Messages</h2>
          <button type="button" className="p-1.5 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
            <PenSquare className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Manager</p>
            <button
              type="button"
              onClick={() => selectContact(MANAGER)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                selectedId === MANAGER.id ? 'bg-accent/20 border-l-2 border-accent' : 'hover:bg-card-bg'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: MANAGER.color }}>
                  AN
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary truncate">{MANAGER.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">Manager</span>
              </div>
            </button>
          </div>
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Team</p>
            {teamContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectContact(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  selectedId === c.id ? 'bg-accent/20 border-l-2 border-accent' : 'hover:bg-card-bg'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: c.color }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{c.name}</p>
                  <p className="text-xs text-text-secondary truncate">{c.role}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="py-2">
            <button
              type="button"
              onClick={() => selectContact(GOSSIP_BUDDY)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg mx-2 ${
                selectedId === GOSSIP_BUDDY.id ? 'bg-success/10 border border-success/30' : 'hover:bg-card-bg border border-transparent'
              }`}
            >
              <span className="relative shrink-0 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success" />
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              </span>
              <span className="font-medium text-text-primary truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                Gossip Buddy 🤫
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Column 2 — Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-primary">
        {!projectId ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <p>Start a project from the dashboard to message your team.</p>
          </div>
        ) : selected ? (
          <>
            <div
              className={`shrink-0 flex items-center justify-between px-4 py-3 border-b border-border ${
                isGossip ? 'bg-card-bg/80' : 'bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0" style={{ backgroundColor: selected.color }}>
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {isGossip ? 'Gossip Buddy 😉' : selected.name}
                  </h3>
                  <p className="text-xs text-text-secondary">{selected.role}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => setContextOpen((o) => !o)}
                className="p-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            {isGossip && (
              <div className="shrink-0 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-sm">
                🔒 This is your safe space. Your conversations here are private and confidential.
              </div>
            )}
            <div
              className={`flex-1 overflow-auto p-4 space-y-3 ${
                isGossip ? 'bg-gradient-to-b from-card-bg/50 to-primary' : ''
              }`}
            >
              {messagesLoading ? (
                <div className="flex justify-center py-8 text-text-secondary text-sm">Loading messages…</div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isMe = msg.from === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isMe ? 'bg-highlight text-white' : 'bg-card-bg border border-border text-text-primary'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <p className={`text-xs text-text-secondary mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {typingBotId === selectedId && (
                    <div className="flex justify-start">
                      <div className="rounded-lg px-4 py-2 bg-card-bg border border-border flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            <div className="shrink-0 p-4 border-t border-border bg-secondary">
              {validationWarning && (
                <p className="text-sm text-amber-500 mb-2">{validationWarning}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isGossip ? 'Vent away... this is just between us 🤫' : 'Type a professional message...'}
                  className="flex-1 bg-card-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={sendLoading}
                />
                <button type="button" className="p-2.5 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sendLoading || !inputValue.trim()}
                  className="p-2.5 rounded-lg bg-highlight text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <p>Select a contact to start messaging</p>
          </div>
        )}
      </div>

      {/* Column 3 — Context */}
      {contextOpen && (
        <aside className="w-[240px] shrink-0 border-l border-border bg-secondary flex flex-col p-4">
          {selected ? (
            <>
              <div className="text-center mb-4">
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-medium text-white mb-2"
                  style={{ backgroundColor: selected.color }}
                >
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-text-primary">{selected.name}</h3>
                <p className="text-sm text-text-secondary">{selected.role}</p>
                <p className="text-xs text-text-secondary">{selected.department}</p>
              </div>
              <div className="space-y-4">{contextPanelContent}</div>
            </>
          ) : (
            <p className="text-sm text-text-secondary">Select a contact to view details</p>
          )}
        </aside>
      )}
    </div>
  );
}
